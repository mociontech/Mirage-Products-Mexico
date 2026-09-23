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
 * El receptor descarta snapshots STATE_SYNC mas viejos que el ultimo
 * aplicado (pueden llegar fuera de orden tras una reconexion). Solo se
 * filtra STATE_SYNC - su `ts` sale siempre del reloj del SERVIDOR
 * (room.snapshot()), asi que comparar dos snapshots entre si es valido.
 *
 * El resto de eventos (PRODUCT_PREVIEW, SESSION_START, etc.) NUNCA se
 * descartan por ts: viajan sobre una unica conexion WebSocket, que ya
 * garantiza orden de entrega, y su `ts` lo pone el dispositivo que los
 * origina (tablet o pitch) - si esos dos relojes no estan sincronizados
 * entre si (comun: dos tablets/equipos distintos, sin NTP), comparar sus
 * ts entre dispositivos distintos podia descartar en falso el primer
 * evento real de una sesion (el reloj de la tablet un poco atras bastaba
 * para que un solo tap nunca le llegara a la pitch).
 *
 * Devuelve true si el evento debe aplicarse, false si debe descartarse.
 */
export function createEventFreshnessCheck(): (event: PitchEvent) => boolean {
  let lastAppliedSnapshotTs = 0;
  return (event: PitchEvent): boolean => {
    if (event.type !== 'STATE_SYNC') return true;
    if (event.ts < lastAppliedSnapshotTs) return false;
    lastAppliedSnapshotTs = event.ts;
    return true;
  };
}
