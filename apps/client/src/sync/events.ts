/**
 * Contrato de eventos de la sala. Debe mantenerse identico al de
 * apps/sync-server/src/events.ts - no hay un paquete compartido a proposito
 * (monorepo simple, sin tooling de workspace pesado), asi que un cambio aqui
 * se replica a mano del otro lado.
 */

export type Role = 'tablet' | 'pitch';

export interface RoomState {
  status: 'idle' | 'active';
  productId: string | null;
  updatedAt: number;
}

export type PitchEvent =
  | { type: 'HELLO'; role: Role; ts: number }
  | { type: 'STATE_SYNC'; state: RoomState; ts: number }
  | { type: 'SESSION_START'; ts: number }
  | { type: 'PRODUCT_PREVIEW'; productId: string; ts: number }
  | { type: 'PRODUCT_SELECTED'; productId: string; ts: number }
  | { type: 'SESSION_END'; ts: number }
  | { type: 'RESET_IDLE'; ts: number }
  | { type: 'HEARTBEAT'; ts: number }
  | { type: 'PARTICIPATION_RESULT'; ts: number; idempotencyKey: string; name: string | null; code: string | null; productId: string | null; points: number };

export function isPitchEvent(value: unknown): value is PitchEvent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as { type: unknown }).type === 'string' &&
    'ts' in value &&
    typeof (value as { ts: unknown }).ts === 'number'
  );
}
