/**
 * Contrato de eventos de la sala. Debe mantenerse identico al de
 * apps/client/src/sync/events.ts - no hay un paquete compartido a proposito
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

export const INITIAL_ROOM_STATE: RoomState = {
  status: 'idle',
  productId: null,
  updatedAt: 0,
};

/** Aplica un evento entrante al estado de la sala. Puro, sin side effects. */
export function reduceRoomState(state: RoomState, event: PitchEvent): RoomState {
  switch (event.type) {
    case 'SESSION_START':
      return { status: 'active', productId: null, updatedAt: event.ts };
    case 'PRODUCT_PREVIEW':
    case 'PRODUCT_SELECTED':
      return { status: 'active', productId: event.productId, updatedAt: event.ts };
    case 'SESSION_END':
    case 'RESET_IDLE':
      return { status: 'idle', productId: null, updatedAt: event.ts };
    case 'HELLO':
    case 'STATE_SYNC':
    case 'HEARTBEAT':
    case 'PARTICIPATION_RESULT':
      return state;
  }
}

/** Eventos que solo sirven de keep-alive/identificacion y no cambian el estado de la sala ni se reenvian. */
export function isTransportOnlyEvent(event: PitchEvent): boolean {
  return event.type === 'HELLO' || event.type === 'HEARTBEAT';
}

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
