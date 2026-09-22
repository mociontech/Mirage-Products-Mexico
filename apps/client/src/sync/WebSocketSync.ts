import { createEventFreshnessCheck, type SyncChannel, type SyncStatus } from './SyncChannel';
import { isPitchEvent, type PitchEvent, type Role } from './events';

const HEARTBEAT_INTERVAL_MS = 5000;
const RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000];

/**
 * Transporte real de produccion. Reconecta solo con backoff (1s, 2s, 4s, 8s,
 * tope 8s, infinito) y manda HEARTBEAT cada 5s para que el servidor pueda
 * detectar una tablet caida sin esperar al cierre del socket.
 */
export class WebSocketSync implements SyncChannel {
  private socket: WebSocket | null = null;
  private _status: SyncStatus = 'connecting';
  private readonly handlers = new Set<(event: PitchEvent) => void>();
  private readonly isFresh = createEventFreshnessCheck();
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private closedByCaller = false;
  private readonly url: string;
  private readonly role: Role;
  /**
   * Cola de eventos mandados antes de que el socket llegue a OPEN (al cargar
   * la pantalla, o mientras reconecta) - antes se descartaban en silencio,
   * asi que un tap justo en ese instante (el primero al entrar a
   * ProductSelect, tipicamente) nunca le llegaba al pitch y habia que tocar
   * el producto una segunda vez para que "funcionara". Se vacia entera en
   * cuanto abre, en el mismo orden en que se encolo.
   */
  private readonly pendingQueue: PitchEvent[] = [];

  constructor(url: string, role: Role) {
    this.url = url;
    this.role = role;
    this.connect();
  }

  get status(): SyncStatus {
    return this._status;
  }

  send(event: PitchEvent): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(event));
    } else {
      this.pendingQueue.push(event);
    }
  }

  private flushPendingQueue(): void {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    while (this.pendingQueue.length > 0) {
      const event = this.pendingQueue.shift();
      if (event) this.socket.send(JSON.stringify(event));
    }
  }

  subscribe(handler: (event: PitchEvent) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  close(): void {
    this.closedByCaller = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.socket?.close();
  }

  private connect(): void {
    this._status = 'connecting';
    const socket = new WebSocket(this.url);
    this.socket = socket;

    socket.addEventListener('open', () => {
      this._status = 'connected';
      this.reconnectAttempt = 0;
      // HELLO primero (el servidor necesita saber el rol antes que nada),
      // despues lo que se haya encolado mientras el socket no estaba listo.
      socket.send(JSON.stringify({ type: 'HELLO', role: this.role, ts: Date.now() }));
      this.flushPendingQueue();
      this.startHeartbeat();
    });

    socket.addEventListener('message', (message) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(message.data as string);
      } catch {
        return;
      }
      if (!isPitchEvent(parsed) || !this.isFresh(parsed)) return;
      for (const handler of this.handlers) handler(parsed);
    });

    // Un intento fallido puede disparar 'error', 'close', o ambos segun el
    // runtime (probado: en Node, un ECONNREFUSED dispara 'error' pero jamas
    // 'close'; en un navegador tipicamente disparan los dos). onSettled se
    // ejecuta una sola vez por socket pase lo que pase, y nunca llama
    // socket.close() el mismo - hacerlo desde dentro de un handler de
    // 'error' mientras el socket ya esta fallando revienta el stack en la
    // implementacion de WebSocket de Node (visto en pruebas reales matando
    // el sync-server a mitad de sesion).
    let settled = false;
    const onSettled = () => {
      if (settled) return;
      settled = true;
      this.handleDisconnect();
    };
    socket.addEventListener('close', onSettled);
    socket.addEventListener('error', onSettled);
  }

  private handleDisconnect(): void {
    this._status = 'disconnected';
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.closedByCaller) return;

    const delay = RECONNECT_DELAYS_MS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)];
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'HEARTBEAT', ts: Date.now() });
    }, HEARTBEAT_INTERVAL_MS);
  }
}
