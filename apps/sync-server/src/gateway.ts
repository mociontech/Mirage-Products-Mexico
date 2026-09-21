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

  const email = normalizeEmail(payload.email);
  if (!email) {
    log({ event: 'gateway_skipped_no_email', destination: 'rankingDb' });
    return true;
  }

  return postToSupabase(RANKING_DB_TABLE, {
    participant_id: email,
    participant_name: payload.name?.trim() || null,
    country: COUNTRY,
    experience: 'catalogo',
    score: payload.points,
    submitted_at: new Date(payload.ts).toISOString(),
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
