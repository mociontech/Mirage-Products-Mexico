import { createStaleEventFilter, type SyncChannel, type SyncStatus } from './SyncChannel';
import { isPitchEvent, type PitchEvent, type Role } from './events';

/**
 * Transporte de desarrollo unicamente: dos pestanas de la misma maquina se
 * sincronizan via BroadcastChannel, sin sync-server. No hay conexion real
 * que gestionar, asi que el status queda 'connected' desde el arranque.
 */
export class BroadcastChannelSync implements SyncChannel {
  private readonly channel: BroadcastChannel;
  private readonly role: Role;
  private readonly handlers = new Set<(event: PitchEvent) => void>();
  private readonly isStale = createStaleEventFilter();

  constructor(room: string, role: Role) {
    this.role = role;
    this.channel = new BroadcastChannel(`mirage-sync-${room}`);
    this.channel.addEventListener('message', (message) => {
      const parsed: unknown = message.data;
      if (!isPitchEvent(parsed) || this.isStale(parsed)) return;
      for (const handler of this.handlers) handler(parsed);
    });
    this.send({ type: 'HELLO', role: this.role, ts: Date.now() });
  }

  readonly status: SyncStatus = 'connected';

  send(event: PitchEvent): void {
    this.channel.postMessage(event);
  }

  subscribe(handler: (event: PitchEvent) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  close(): void {
    this.channel.close();
  }
}
