const HOST_KEY = 'mirage:sync:host';
const PORT_KEY = 'mirage:sync:port';
const ROOM_KEY = 'mirage:sync:room';

const DEFAULT_PORT = 7777;
const DEFAULT_ROOM = 'stand-01';

export interface SyncConnectionConfig {
  host: string;
  port: number;
  room: string;
}

/**
 * Host y puerto del sync-server nunca se hardcodean en el bundle: la tablet
 * los lee de storage persistente y, si no hay valor, la pantalla de
 * Settings los pide (gesto oculto para reabrirla en cualquier momento).
 */
export function getSyncConfig(): SyncConnectionConfig | null {
  const host = localStorage.getItem(HOST_KEY);
  if (!host) return null;

  const portRaw = localStorage.getItem(PORT_KEY);
  const port = portRaw ? Number(portRaw) : DEFAULT_PORT;
  const room = localStorage.getItem(ROOM_KEY) ?? DEFAULT_ROOM;

  return { host, port: Number.isFinite(port) ? port : DEFAULT_PORT, room };
}

export function setSyncConfig(config: SyncConnectionConfig): void {
  localStorage.setItem(HOST_KEY, config.host);
  localStorage.setItem(PORT_KEY, String(config.port));
  localStorage.setItem(ROOM_KEY, config.room);
}

export function buildWebSocketUrl(config: SyncConnectionConfig): string {
  return `ws://${config.host}:${config.port}/?room=${encodeURIComponent(config.room)}`;
}
