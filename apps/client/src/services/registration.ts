import { getSyncConfig } from '../sync/connection.config';

export interface RegistrationFields {
  name: string | null;
  email: string | null;
  company?: string | null;
  phone?: string | null;
  area?: string | null;
}

/**
 * Guarda el registro (nombre/correo/etc) asociado a un codigo apenas se
 * genera en Register.tsx, via el sync-server local (POST /register, ver
 * gateway.ts#submitRegistration) - nunca directo contra Supabase desde la
 * tablet, mismo motivo que fetchTopRanking en services/ranking.ts (el
 * sync-server es quien tiene la service_role key). Best-effort y
 * silencioso: nunca bloquea el registro ni lanza. Si falla (tablet sin
 * configurar o sync-server no responde), el peor caso es que ese codigo
 * puntual no se pueda recuperar despues.
 */
export async function submitRegistration(code: string, fields: RegistrationFields): Promise<void> {
  const config = getSyncConfig();
  if (!config) return;

  try {
    await fetch(`http://${config.host}:${config.port}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, ...fields }),
    });
  } catch {
    // Sin conexion al sync-server: el codigo no queda recuperable por ahora.
  }
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
