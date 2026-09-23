import { getSyncConfig } from '../sync/connection.config';

const USED_EMAILS_CACHE_KEY = 'kam:usedEmails';
const CHECK_TIMEOUT_MS = 2500;

/** Trim + lowercase, misma normalizacion que usa gateway.ts del lado del servidor. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readUsedEmailsCache(): string[] {
  try {
    const raw = localStorage.getItem(USED_EMAILS_CACHE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/**
 * Recuerda un correo como ya participado, localmente en esta tablet. El
 * dedupe real vive en el unique constraint de Supabase (participant_id,
 * country, experience) via checkEmailUsedRemotely - esto solo deja
 * rechazar un reintento en el acto, sin esperar red.
 */
export function rememberUsedEmail(email: string): void {
  const normalized = normalizeEmail(email);
  const emails = readUsedEmailsCache();
  if (!emails.includes(normalized)) {
    localStorage.setItem(USED_EMAILS_CACHE_KEY, JSON.stringify([...emails, normalized]));
  }
}

/** Solo revisa el cache local - ver rememberUsedEmail para por que no es autoritativo. */
export function hasEmailPlayedLocally(email: string): boolean {
  return readUsedEmailsCache().includes(normalizeEmail(email));
}

/**
 * Chequeo real via el sync-server (GET /check-participant, ver
 * gateway.ts#checkParticipantExists) de si este correo ya participo en
 * "catalogo" para este pais. hasEmailPlayedLocally solo atrapa un repetido
 * en ESTA tablet; alguien que ya participo en otra tablet/celular con el
 * mismo correo pasaba sin aviso, aunque el insert final ya fuera rechazado
 * en silencio por el unique constraint de Supabase - este chequeo cierra
 * esa brecha de UX (los datos ya estaban protegidos).
 *
 * Nunca bloquea el flujo: sin red, sync-server caido, o mas lento que
 * CHECK_TIMEOUT_MS, se asume "disponible" y el registro sigue - un stand
 * con mal internet no debe impedir participar, la proteccion real sigue
 * siendo el constraint de la base de datos.
 */
export async function checkEmailUsedRemotely(email: string): Promise<boolean> {
  const config = getSyncConfig();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    const response = await fetch(
      `http://${config.host}:${config.port}/check-participant?email=${encodeURIComponent(email)}&experience=catalogo`,
      { signal: controller.signal },
    );
    if (!response.ok) return false;
    const body = (await response.json()) as { exists?: boolean };
    return body.exists === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
