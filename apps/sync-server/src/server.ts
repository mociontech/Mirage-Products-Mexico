import { WebSocket, WebSocketServer } from 'ws';
import { isPitchEvent, type PitchEvent, type Role } from './events.js';
import { log } from './logger.js';
import { RoomRegistry } from './room.js';

const PORT = Number(process.env.PORT ?? 7777);
const HEARTBEAT_INTERVAL_MS = 5000;
const HEARTBEAT_TIMEOUT_MS = HEARTBEAT_INTERVAL_MS * 3;

interface ClientMeta {
  roomId: string;
  role: Role | null;
  lastSeen: number;
}

const registry = new RoomRegistry();
const clientMeta = new Map<WebSocket, ClientMeta>();

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws, request) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const roomId = url.searchParams.get('room') ?? 'default';
  const room = registry.get(roomId);

  clientMeta.set(ws, { roomId, role: null, lastSeen: Date.now() });
  room.join(ws);
  log({ event: 'connect', roomId });

  ws.send(JSON.stringify(room.snapshot()));

  ws.on('message', (raw) => {
    const meta = clientMeta.get(ws);
    if (meta) meta.lastSeen = Date.now();

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.toString());
    } catch {
      log({ event: 'parse_error', roomId });
      return;
    }

    if (!isPitchEvent(parsed)) {
      log({ event: 'invalid_event', roomId, payload: parsed });
      return;
    }

    if (parsed.type === 'HELLO' && meta) {
      meta.role = parsed.role;
    }

    log({ event: 'message', roomId, type: parsed.type });
    room.applyAndBroadcast(parsed, ws);
  });

  ws.on('close', () => {
    room.leave(ws);
    clientMeta.delete(ws);
    log({ event: 'disconnect', roomId });
  });

  ws.on('error', (error) => {
    log({ event: 'socket_error', roomId, message: error.message });
  });
});

/** Keep-alive bidireccional: manda HEARTBEAT y cierra sockets que llevan mas de 3 ciclos sin dar senales de vida. */
const heartbeatInterval = setInterval(() => {
  const now = Date.now();
  for (const [ws, meta] of clientMeta) {
    if (now - meta.lastSeen > HEARTBEAT_TIMEOUT_MS) {
      log({ event: 'heartbeat_timeout', roomId: meta.roomId });
      ws.terminate();
      continue;
    }
    if (ws.readyState === WebSocket.OPEN) {
      const heartbeat: PitchEvent = { type: 'HEARTBEAT', ts: now };
      ws.send(JSON.stringify(heartbeat));
    }
  }
}, HEARTBEAT_INTERVAL_MS);

wss.on('close', () => clearInterval(heartbeatInterval));

log({ event: 'listening', port: PORT });
console.log(`sync-server escuchando en ws://localhost:${PORT}`);
