import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { isPitchEvent, type PitchEvent, type Role } from './events.js';
import {
  checkParticipantExists,
  deliverAttendeeToEvius,
  deliverExperienceToEvius,
  deliverToRankingDb,
  fetchRanking,
} from './gateway.js';
import { log } from './logger.js';
import { Outbox } from './outbox.js';
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
const outbox = new Outbox({
  eviusAttendee: deliverAttendeeToEvius,
  eviusExperience: deliverExperienceToEvius,
  rankingDb: deliverToRankingDb,
});

/**
 * La tablet y el pitch llaman a /ranking por fetch() desde otro origen (la
 * app corre en el puerto de Vite, este server en el 7777) - sin estos
 * headers el navegador descarta la respuesta antes de que el codigo la vea,
 * asi que fetchTopRanking() en el cliente termina en su catch y muestra
 * "sin resultados" en vez de un error visible. GET-only y sin credenciales,
 * asi que "*" es seguro aca.
 */
function withCors(response: ServerResponse): void {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function handleHttpRequest(request: IncomingMessage, response: ServerResponse): void {
  const url = new URL(request.url ?? '/', 'http://localhost');
  withCors(response);

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === 'GET' && url.pathname === '/ranking') {
    const experience = url.searchParams.get('experience') ?? 'catalogo';
    fetchRanking(experience).then((result) => {
      if (result.status === 'ok') {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(result.data));
        return;
      }
      response.writeHead(503, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: `ranking_db_${result.status}` }));
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/check-participant') {
    const email = url.searchParams.get('email');
    const experience = url.searchParams.get('experience') ?? 'catalogo';
    if (!email) {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'missing_email' }));
      return;
    }
    checkParticipantExists(email, experience).then((result) => {
      if (result.status === 'ok') {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ exists: result.exists }));
        return;
      }
      response.writeHead(503, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: `ranking_db_${result.status}` }));
    });
    return;
  }

  response.writeHead(404, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify({ error: 'not_found' }));
}

const httpServer = createServer(handleHttpRequest);
const wss = new WebSocketServer({ server: httpServer });

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

    // No es un evento de UI para el pitch: se encola hacia Evius (attendee +
    // experience) y hacia la DB de rankings (Fase 7), nunca se reenvia a
    // otros clientes.
    if (parsed.type === 'PARTICIPATION_RESULT') {
      const payload = { ...parsed, experience: 'catalogo' as const, roomId };
      outbox.enqueue('eviusAttendee', parsed.idempotencyKey, payload);
      outbox.enqueue('eviusExperience', parsed.idempotencyKey, payload);
      outbox.enqueue('rankingDb', parsed.idempotencyKey, payload);
      return;
    }

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

httpServer.listen(PORT, () => {
  log({ event: 'listening', port: PORT });
  console.log(`sync-server escuchando en ws://localhost:${PORT} (HTTP en el mismo puerto para /ranking)`);
});
