import type { PitchEvent } from './events';

export type SyncStatus = 'connected' | 'connecting' | 'disconnected';

/**
 * Transporte de sincronizacion entre tablet y pitch. WebSocketSync es el
 * transporte real; BroadcastChannelSync solo sirve para desarrollo (dos
 * pestanas de la misma maquina, sin servidor). Elegido en runtime via
 * VITE_SYNC_TRANSPORT para no acoplar la UI a ninguno de los dos.
 */
export interface SyncChannel {
  send(event: PitchEvent): void;
  subscribe(handler: (event: PitchEvent) => void): () => void;
  readonly status: SyncStatus;
  /** Libera el transporte (cierra el socket o el BroadcastChannel). */
  close?(): void;
}

/**
 * El receptor descarta eventos mas viejos que el ultimo aplicado (los
 * eventos pueden llegar fuera de orden tras una reconexion). Cada canal
 * mantiene su propio filtro: dos pestanas broadcast y una conexion
 * websocket no comparten nocion de "ultimo evento".
 *
 * Devuelve true si el evento es nuevo y debe aplicarse, false si es mas
 * viejo que el ultimo ya aplicado y debe descartarse.
 */
export function createEventFreshnessCheck(): (event: PitchEvent) => boolean {
  let lastAppliedTs = 0;
  return (event: PitchEvent): boolean => {
    if (event.ts < lastAppliedTs) return false;
    lastAppliedTs = event.ts;
    return true;
  };
}
