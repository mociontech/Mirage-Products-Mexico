import { getSyncConfig } from '../sync/connection.config';

export interface RegistrationFields {
  name: string | null;
  email: string | null;
  company?: string | null;
  phone?: string | null;
  area?: string | null;
}

const REGISTER_RETRY_DELAYS_MS = [0, 800, 2000];

/**
 * Guarda el registro (nombre/correo/etc) asociado a un codigo apenas se
 * genera en Register.tsx, via el sync-server local (POST /register, ver
 * gateway.ts#submitRegistration) - nunca directo contra Supabase desde la
 * tablet, mismo motivo que fetchTopRanking en services/ranking.ts (el
 * sync-server es quien tiene la service_role key).
 *
 * Antes esto era fire-and-forget silencioso: no revisaba `response.ok`, asi
 * que un 503 del sync-server (Supabase caida, RLS, etc.) se veia identico a
 * un exito - el codigo se mostraba en pantalla como si ya estuviera guardado
 * cuando en realidad nunca llego a la base (bug real detectado en vivo en
 * Mexico). Ahora reintenta unas pocas veces con backoff corto (util contra
 * caidas cortas del wifi del venue) y devuelve si de verdad quedo guardado,
 * para que Register.tsx pueda avisarle al staff si no.
 */
export async function submitRegistration(code: string, fields: RegistrationFields): Promise<boolean> {
  const config = getSyncConfig();
  if (!config) return false;

  for (const delay of REGISTER_RETRY_DELAYS_MS) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    try {
      const response = await fetch(`http://${config.host}:${config.port}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, ...fields }),
      });
      if (response.ok) return true;
    } catch {
      // Sin conexion al sync-server en este intento - se reintenta abajo.
    }
  }
  return false;
}

export type RegistrationLookup =
  | { status: 'found'; record: RegistrationFields }
  | { status: 'not_found' }
  | { status: 'error' };

/**
 * Busca un codigo ya registrado via el sync-server (GET /register, ver
 * gateway.ts#lookupRegistration). "error" (tablet sin configurar, sin
 * conexion, o el sync-server no responde) se distingue de "not_found": ahi
 * no sabemos si el codigo existe, asi que la pantalla no debe tratarlo
 * como invalido, solo pedir que se reintente.
 */
export async function lookupRegistrationByCode(code: string): Promise<RegistrationLookup> {
  const config = getSyncConfig();
  if (!config) return { status: 'error' };

  try {
    const response = await fetch(`http://${config.host}:${config.port}/register?code=${encodeURIComponent(code)}`);
    if (!response.ok) return { status: 'error' };
    const body = (await response.json()) as { record: RegistrationFields | null };
    return body.record ? { status: 'found', record: body.record } : { status: 'not_found' };
  } catch {
    return { status: 'error' };
  }
}
