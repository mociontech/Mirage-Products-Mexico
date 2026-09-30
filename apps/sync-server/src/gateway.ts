import { randomUUID } from 'node:crypto';
import { log } from './logger.js';

/**
 * Destinos de internet, configurados por variable de entorno - nunca
 * hardcodeados. Mientras falten (Evius, Supabase), cualquier intento de
 * entrega falla limpio y el outbox sigue reintentando, exactamente igual
 * que si no hubiera internet.
 *
 * Evius (eviusapi/Datahub) identifica el evento por pais - "Mirage Colombia"
 * y "Mirage Mexico" son eventos separados en Evius - por eso EVIUS_EVENT_ID,
 * EVIUS_EXPERIENCE_ID y COUNTRY son variables de entorno propias de cada
 * despliegue del sync-server (uno por pais), nunca hardcodeadas ni
 * compartidas entre paises.
 */
const EVIUS_URL = process.env.EVIUS_URL;
const EVIUS_TOKEN = process.env.EVIUS_TOKEN;
const EVIUS_EVENT_ID = process.env.EVIUS_EVENT_ID;
const EVIUS_EXPERIENCE_ID = process.env.EVIUS_EXPERIENCE_ID;
const EXPERIENCE_NAME = process.env.EXPERIENCE_NAME ?? 'Mirage - Catalogo de Productos';
const COUNTRY = process.env.COUNTRY;

/**
 * RANKING_DB_URL es la URL base del proyecto Supabase (ej.
 * https://xxxx.supabase.co), sin /rest/v1 ni tabla - eso se arma aca.
 * RANKING_DB_API_KEY es la service_role key (bypassa RLS para escribir;
 * la tabla `participations` no tiene policy de insert para anon/authenticated
 * a proposito, ver docs/supabase-schema.sql). RANKING_DB_TABLE por si el
 * nombre de tabla cambia sin tocar codigo - default 'participations'.
 */
const RANKING_DB_URL = process.env.RANKING_DB_URL;
const RANKING_DB_API_KEY = process.env.RANKING_DB_API_KEY;
const RANKING_DB_TABLE = process.env.RANKING_DB_TABLE ?? 'participations';

/**
 * Normalizacion de email (trim + lowercase) en el unico punto donde este
 * proyecto la aplica. Tiene que dar el mismo resultado que
 * idService.normalizeEmail en Memory Match - es la llave de dedup en Evius
 * (email+eventId) y en Supabase (participant_id+country+experience), asi
 * que un "Ana@Mail.com " y un "ana@mail.com" tienen que cruzar como la
 * misma persona sin importar en cual de las dos experiencias jugo primero.
 */
function normalizeEmail(email: string | null): string | null {
  const trimmed = email?.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

/**
 * Deja el codigo solo en digitos (sin guion). Bug real detectado en el
 * evento de Mexico: el tablet genera codigos de 6 digitos sin guion
 * (generateParticipantCode en session.ts), pero Memory Match/Mobile
 * generan "NNN-NNN" y su pantalla de "Digita ID" siempre reconstruye la
 * busqueda CON guion - un codigo generado en el tablet nunca calzaba
 * contra si mismo en esa busqueda. Normalizar en cada punto de
 * escritura/lectura hace que el formato (con o sin guion) deje de importar.
 */
function normalizeCode(code: string): string {
  return code.replace(/\D/g, '');
}

/**
 * Fecha local (YYYY-MM-DD) de "ahora" en la zona horaria del pais de este
 * despliegue - tiene que dar el mismo valor que el event_day calculado en
 * las vistas ranking_by_experience/ranking_combined (ver docs/supabase-schema.sql
 * seccion 2/3), o el filtro `event_day=eq.` de fetchRanking/fetchMyCombinedPosition
 * nunca calzaria con la fila de hoy. El ranking (y el premio) se maneja por
 * dia: cada dia del evento de una semana arranca en position 1 de nuevo.
 */
function getEventDay(): string {
  const timeZone = COUNTRY === 'CO' ? 'America/Bogota' : 'America/Mexico_City';
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

async function postJson(url: string, body: unknown, apiKey?: string): Promise<boolean> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return response.ok;
}

/**
 * PostgREST (Supabase) requiere el header `apikey` ademas de
 * `Authorization: Bearer` - a diferencia de Evius/data hub generico, que
 * solo pide el segundo. `Prefer: resolution=merge-duplicates` convierte el
 * insert en upsert por el constraint unico (participant_id, country,
 * experience): un reintento del outbox actualiza la fila en vez de fallar
 * con 409.
 */
async function postToSupabase(path: string, body: unknown): Promise<boolean> {
  if (!RANKING_DB_URL || !RANKING_DB_API_KEY) return false;
  const response = await fetch(`${RANKING_DB_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: RANKING_DB_API_KEY,
      Authorization: `Bearer ${RANKING_DB_API_KEY}`,
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(body),
  });
  return response.ok;
}

interface ParticipationPayload {
  name: string | null;
  email: string | null;
  code: string | null;
  productId: string | null;
  points: number;
  ts: number;
  viewedProductIds?: string[];
}

function isParticipationPayload(value: unknown): value is ParticipationPayload {
  return typeof value === 'object' && value !== null && 'points' in value && 'ts' in value;
}

/**
 * POST /api/datahub/attendees - se omite si no hay email (igual que el
 * patron ya usado en otras experiencias: sin registro no hay attendee).
 * Evius deduplica por (email, eventId) del lado del servidor.
 */
export async function deliverAttendeeToEvius(payload: unknown): Promise<boolean> {
  if (!EVIUS_URL || !EVIUS_EVENT_ID) {
    log({ event: 'gateway_not_configured', destination: 'eviusAttendee' });
    return false;
  }
  const email = isParticipationPayload(payload) ? normalizeEmail(payload.email) : null;
  if (!isParticipationPayload(payload) || !email) {
    log({ event: 'gateway_skipped_no_email', destination: 'eviusAttendee' });
    return true;
  }

  return postJson(
    `${EVIUS_URL}/attendees`,
    {
      eventId: EVIUS_EVENT_ID,
      source: EXPERIENCE_NAME,
      sentAt: new Date(payload.ts).toISOString(),
      records: [
        {
          fullName: payload.name ?? email,
          email,
          checkInAt: new Date(payload.ts).toISOString(),
          country: COUNTRY,
        },
      ],
    },
    EVIUS_TOKEN,
  );
}

/**
 * POST /api/datahub/activities - fallback si /experiences no responde (no
 * esta en el PDF oficial de eviusapi, ver nota abajo). El score va embebido
 * como string JSON en longDescription, igual que el patron ya usado en
 * otras experiencias antes de que existiera /experiences.
 */
async function deliverExperienceAsActivity(payload: ParticipationPayload, email: string): Promise<boolean> {
  if (!EVIUS_URL) return false;
  return postJson(
    `${EVIUS_URL}/activities`,
    {
      eventId: EVIUS_EVENT_ID,
      source: EXPERIENCE_NAME,
      sentAt: new Date(payload.ts).toISOString(),
      records: [
        {
          name: EXPERIENCE_NAME,
          shortDescription: String(payload.points),
          longDescription: JSON.stringify({
            experiencia: EXPERIENCE_NAME,
            email,
            score: payload.points,
            productId: payload.productId,
            code: payload.code,
            country: COUNTRY,
          }),
        },
      ],
    },
    EVIUS_TOKEN,
  );
}

/**
 * POST /api/datahub/experiences - guarda el puntaje de la participacion.
 * No documentado en el PDF oficial de eviusapi (solo visto en produccion
 * en otras experiencias), pero es el unico endpoint con score/bonusScore
 * nativos; /activities obligaria a esconder el score en un longDescription.
 * Se manda siempre, con o sin registro (usa un email sintetico si hace
 * falta, igual que el patron ya usado en otras experiencias). Si falla,
 * cae a /activities antes de devolver false - asi el outbox no reintenta
 * un endpoint que puede no existir en este evento.
 */
export async function deliverExperienceToEvius(payload: unknown): Promise<boolean> {
  if (!EVIUS_URL || !EVIUS_EVENT_ID || !EVIUS_EXPERIENCE_ID) {
    log({ event: 'gateway_not_configured', destination: 'eviusExperience' });
    return false;
  }
  if (!isParticipationPayload(payload)) return false;

  const email = normalizeEmail(payload.email) ?? `anon-${payload.ts}@local`;
  const delivered = await postJson(
    `${EVIUS_URL}/experiences`,
    {
      eventId: EVIUS_EVENT_ID,
      experienceId: EVIUS_EXPERIENCE_ID,
      source: EXPERIENCE_NAME,
      sentAt: new Date(payload.ts).toISOString(),
      records: [
        {
          email,
          play_timestamp: new Date(payload.ts).toISOString(),
          score: payload.points,
          bonusScore: 0,
          data: {
            experiencia: EXPERIENCE_NAME,
            productId: payload.productId,
            code: payload.code,
            country: COUNTRY,
          },
        },
      ],
    },
    EVIUS_TOKEN,
  ).catch(() => false);

  if (delivered) return true;

  log({ event: 'gateway_fallback_to_activities', destination: 'eviusExperience' });
  return deliverExperienceAsActivity(payload, email);
}

/**
 * Escritura hacia la DB propia (Supabase) para poder construir el ranking
 * compartido. Forma acordada con el proyecto de Memory Match -
 * participant_id/participant_name/country/experience/score/submitted_at -,
 * no el evento crudo: ambos proyectos escriben filas con el mismo shape para
 * que el agregador que promedia las dos experiencias (vive en Supabase, no
 * aca) las pueda leer igual sin importar de cual experiencia vinieron.
 * participant_name es el nombre tal cual lo registro la persona en esta
 * experiencia - null si no se registro con nombre (solo email).
 */
export async function deliverToRankingDb(payload: unknown): Promise<boolean> {
  if (!RANKING_DB_URL) {
    log({ event: 'gateway_not_configured', destination: 'rankingDb' });
    return false;
  }
  if (!isParticipationPayload(payload)) return false;

  // "Continua sin registro": antes esto se descartaba en silencio (nunca
  // llegaba a Supabase), asi que no habia forma de saber cuanta gente jugo
  // sin registrarse. Ahora se guarda igual, con un id sintetico (nunca
  // colisiona con el unique constraint) y is_anonymous=true - las vistas de
  // ranking (ranking_by_experience/ranking_combined) excluyen estas filas,
  // asi que nunca compiten por el premio ni aparecen en el Top 5.
  const email = normalizeEmail(payload.email);
  const isAnonymous = !email;

  return postToSupabase(RANKING_DB_TABLE, {
    participant_id: email ?? `anon:${randomUUID()}`,
    participant_name: payload.name?.trim() || null,
    country: COUNTRY,
    experience: 'catalogo',
    score: payload.points,
    submitted_at: new Date(payload.ts).toISOString(),
    is_anonymous: isAnonymous,
    viewed_products: payload.viewedProductIds ?? null,
  });
}

export type RankingResult = { status: 'not_configured' } | { status: 'unavailable' } | { status: 'ok'; data: unknown };

/**
 * Lectura del ranking compartido, top 10 de este pais (`COUNTRY`, la
 * variable de entorno de este despliegue - cada stand solo muestra su
 * propio ranking).
 *
 * `experience=combined` lee `ranking_combined` (promedio de las dos
 * experiencias, ver docs/supabase-schema.sql) - es el que decide el premio.
 * Cualquier otro valor ('catalogo' | 'memory_match') lee `ranking_by_experience`
 * filtrado por esa experiencia.
 */
export async function fetchRanking(experience: string): Promise<RankingResult> {
  if (!RANKING_DB_URL || !RANKING_DB_API_KEY) return { status: 'not_configured' };
  if (!COUNTRY) return { status: 'not_configured' };

  const view = experience === 'combined' ? 'ranking_combined' : 'ranking_by_experience';
  const query = new URLSearchParams({
    country: `eq.${COUNTRY}`,
    event_day: `eq.${getEventDay()}`,
    order: 'position.asc',
    limit: '10',
  });
  if (view === 'ranking_by_experience') query.set('experience', `eq.${experience}`);

  try {
    const response = await fetch(`${RANKING_DB_URL}/rest/v1/${view}?${query.toString()}`, {
      headers: { apikey: RANKING_DB_API_KEY, Authorization: `Bearer ${RANKING_DB_API_KEY}` },
    });
    if (!response.ok) return { status: 'unavailable' };
    return { status: 'ok', data: await response.json() };
  } catch {
    return { status: 'unavailable' };
  }
}

export interface RegistrationFields {
  name: string | null;
  email: string | null;
  company?: string | null;
  phone?: string | null;
  area?: string | null;
}

/**
 * Escribe el registro (nombre/correo/etc) asociado a un codigo apenas se
 * genera en Register.tsx, para que la vista "CODIGO ID" lo pueda recuperar
 * despues desde cualquier dispositivo - antes el codigo no quedaba en
 * ningun lado consultable, asi que esa pantalla no podia saber de quien
 * era y avanzaba con name/email en null (ver docs/supabase-schema.sql
 * seccion 6). A diferencia del insert de `participations`, este SI usa
 * `Prefer: resolution=merge-duplicates`: si el mismo codigo se reenvia
 * (reintento de red) se actualiza la fila en vez de fallar con 409.
 */
export async function submitRegistration(code: string, fields: RegistrationFields): Promise<boolean> {
  if (!RANKING_DB_URL) {
    log({ event: 'gateway_not_configured', destination: 'registration' });
    return false;
  }
  if (!COUNTRY) return false;

  return postToSupabase('registrations', {
    code: normalizeCode(code),
    country: COUNTRY,
    experience: 'catalogo',
    name: fields.name?.trim() || null,
    email: normalizeEmail(fields.email),
    company: fields.company?.trim() || null,
    phone: fields.phone?.trim() || null,
    area: fields.area?.trim() || null,
  });
}

export type RegistrationLookupResult =
  | { status: 'not_configured' }
  | { status: 'unavailable' }
  | { status: 'ok'; record: RegistrationFields | null };

/**
 * Busca un codigo directo contra la tabla base `registrations` - la
 * service_role key de este servidor puede hacer SELECT ahi (a diferencia de
 * la Publishable key que usan las apps de celular/memory-match, que pasan
 * por la funcion RPC get_registration_by_code en vez de esto).
 *
 * NO filtra por experience: el mismo codigo tiene que reconocerse sin
 * importar en cual de las dos experiencias (catalogo/memory_match) se
 * genero - alguien que jugo Products primero y guardo su codigo debe poder
 * usarlo igual en Memory Match, y viceversa. Filtrar por experience aca
 * rompia justo ese caso (ver constraint registrations_unique_code, que ya
 * es solo (code, country)).
 */
export async function lookupRegistration(code: string): Promise<RegistrationLookupResult> {
  if (!RANKING_DB_URL || !RANKING_DB_API_KEY) return { status: 'not_configured' };
  if (!COUNTRY) return { status: 'not_configured' };

  const query = new URLSearchParams({
    code: `eq.${normalizeCode(code)}`,
    country: `eq.${COUNTRY}`,
    select: 'name,email,company,phone,area',
    limit: '1',
  });

  try {
    const response = await fetch(`${RANKING_DB_URL}/rest/v1/registrations?${query.toString()}`, {
      headers: { apikey: RANKING_DB_API_KEY, Authorization: `Bearer ${RANKING_DB_API_KEY}` },
    });
    if (!response.ok) return { status: 'unavailable' };
    const rows = (await response.json()) as RegistrationFields[];
    return { status: 'ok', record: rows[0] ?? null };
  } catch {
    return { status: 'unavailable' };
  }
}

export interface CombinedPositionRecord {
  position: number;
  finalScore: number;
  catalogoScore: number;
  memoryMatchScore: number;
}

export type CombinedPositionResult =
  | { status: 'not_configured' }
  | { status: 'unavailable' }
  | { status: 'ok'; record: CombinedPositionRecord | null };

/**
 * Puesto de una persona puntual en `ranking_combined` (el que decide el
 * premio) - a diferencia de fetchRanking('combined'), que trae el top 10,
 * esta filtra por participant_id (email) para poder mostrarle a esa persona
 * su propio puesto general aunque no este en el top 10. Se usa en ThankYou
 * para separar "tu puntaje en esta experiencia" (que ya se ve arriba) de "tu
 * puesto en el ranking general".
 */
export async function fetchMyCombinedPosition(email: string): Promise<CombinedPositionResult> {
  if (!RANKING_DB_URL || !RANKING_DB_API_KEY) return { status: 'not_configured' };
  if (!COUNTRY) return { status: 'not_configured' };

  const normalized = normalizeEmail(email);
  if (!normalized) return { status: 'ok', record: null };

  const query = new URLSearchParams({
    participant_id: `eq.${normalized}`,
    country: `eq.${COUNTRY}`,
    event_day: `eq.${getEventDay()}`,
    select: 'position,final_score,catalogo_score,memory_match_score',
    limit: '1',
  });

  try {
    const response = await fetch(`${RANKING_DB_URL}/rest/v1/ranking_combined?${query.toString()}`, {
      headers: { apikey: RANKING_DB_API_KEY, Authorization: `Bearer ${RANKING_DB_API_KEY}` },
    });
    if (!response.ok) return { status: 'unavailable' };
    const rows = (await response.json()) as Array<{
      position: number;
      final_score: number;
      catalogo_score: number;
      memory_match_score: number;
    }>;
    const row = rows[0];
    if (!row) return { status: 'ok', record: null };
    return {
      status: 'ok',
      record: {
        position: row.position,
        finalScore: row.final_score,
        catalogoScore: row.catalogo_score,
        memoryMatchScore: row.memory_match_score,
      },
    };
  } catch {
    return { status: 'unavailable' };
  }
}

export type ParticipantCheckResult = { status: 'not_configured' } | { status: 'unavailable' } | { status: 'ok'; exists: boolean };

/**
 * Verifica si un correo ya participo en esta experiencia+pais, consultando
 * la tabla base `participations` directo (la service_role key de este
 * servidor puede hacer SELECT ahi, a diferencia de la Publishable key que
 * usan las apps de celular - por eso este chequeo vive aca y no en el
 * cliente de la tablet). Antes de esto, Register.tsx no tenia forma de
 * avisarle a nadie que ya habia participado - el insert final se rechazaba
 * en silencio por el unique constraint (participant_id, country,
 * experience) de Supabase, pero el participante nunca se enteraba.
 */
export async function checkParticipantExists(email: string, experience: string): Promise<ParticipantCheckResult> {
  if (!RANKING_DB_URL || !RANKING_DB_API_KEY) return { status: 'not_configured' };
  if (!COUNTRY) return { status: 'not_configured' };

  const query = new URLSearchParams({
    participant_id: `eq.${normalizeEmail(email)}`,
    country: `eq.${COUNTRY}`,
    experience: `eq.${experience}`,
    select: 'participant_id',
    limit: '1',
  });

  try {
    const response = await fetch(`${RANKING_DB_URL}/rest/v1/participations?${query.toString()}`, {
      headers: { apikey: RANKING_DB_API_KEY, Authorization: `Bearer ${RANKING_DB_API_KEY}` },
    });
    if (!response.ok) return { status: 'unavailable' };
    const rows = (await response.json()) as unknown[];
    return { status: 'ok', exists: Array.isArray(rows) && rows.length > 0 };
  } catch {
    return { status: 'unavailable' };
  }
}
