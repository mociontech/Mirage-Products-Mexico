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
 * los lee de storage persistente, configurable desde Settings (gesto oculto
 * para reabrirla en cualquier momento) para el caso en que el sync-server
 * viva en otra maquina/IP.
 *
 * Sin ese valor guardado, en vez de no conectar nada (WebSocket y el
 * ranking silenciosamente inactivos, sin ningun error visible), se usa
 * como default el mismo host desde el que se sirvio la pagina
 * (window.location.hostname). Cubre el caso mas comun: sync-server y
 * cliente corriendo en la misma maquina o publicados bajo el mismo host de
 * LAN. Settings sigue pudiendo sobreescribirlo para topologias distintas.
 */
export function getSyncConfig(): SyncConnectionConfig {
  const host = localStorage.getItem(HOST_KEY) || window.location.hostname;
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
