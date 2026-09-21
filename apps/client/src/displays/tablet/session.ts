/** Datos de la sesion actual de la tablet, vacios si el usuario no se registro. */
export interface TabletSession {
  name: string | null;
  email: string | null;
  code: string | null;
}

export const EMPTY_SESSION: TabletSession = { name: null, email: null, code: null };

/**
 * Puntos por participacion completa (seleccionar un producto y llegar a
 * Agradecimiento). Fijo en 100: el catalogo siempre otorga el maximo, el
 * memory match aporta 0-100 segun desempeno, y el ranking final promedia
 * ambas experiencias.
 */
export const PARTICIPATION_POINTS = 100;

export function generateParticipantCode(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}

/**
 * crypto.randomUUID solo existe en "secure context" (HTTPS o localhost) -
 * en pruebas por IP LAN sobre http (no localhost) Safari no lo expone y
 * rompe el flujo en silencio. Con crypto disponible se usa esa; si no, cae
 * a un UUID v4 armado a mano con Math.random (suficiente para una llave de
 * idempotencia, no para seguridad).
 */
export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
