/** Datos de la sesion actual de la tablet, vacios si el usuario no se registro. */
export interface TabletSession {
  name: string | null;
  email: string | null;
  code: string | null;
}

export const EMPTY_SESSION: TabletSession = { name: null, email: null, code: null };

/**
 * Puntaje segun cuantos productos DISTINTOS exploro el visitante (tocando
 * un tile en ProductSelect, ver TabletApp.tsx) sobre el total del catalogo,
 * redondeado - ya no es un fijo en 100. Mismo criterio en las 4 apps que
 * alimentan "catalogo" (tablet+pitch y movil, CO+MX), para que el ranking
 * combinado con memory_match siga siendo comparable entre dispositivos.
 */
export function computeParticipationScore(viewedProductIds: readonly string[], totalProducts: number): number {
  if (totalProducts <= 0) return 0;
  return Math.round((viewedProductIds.length / totalProducts) * 100);
}

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
