/** Datos de la sesion actual de la tablet, vacios si el usuario no se registro. */
export interface TabletSession {
  name: string | null;
  code: string | null;
}

export const EMPTY_SESSION: TabletSession = { name: null, code: null };

export function generateParticipantCode(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}
