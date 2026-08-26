import { WebSocket } from 'ws';
import { INITIAL_ROOM_STATE, isTransportOnlyEvent, reduceRoomState, type PitchEvent, type RoomState } from './events.js';

/**
 * Una sala = un stand. Mantiene el estado actual en memoria y la lista de
 * sockets conectados, para poder reenviar eventos y dar un snapshot a quien
 * se conecte despues (recuperacion tras reinicio del pitch).
 */
export class Room {
  readonly id: string;
  private state: RoomState = INITIAL_ROOM_STATE;
  private readonly clients = new Set<WebSocket>();

  constructor(id: string) {
    this.id = id;
  }

  join(ws: WebSocket): void {
    this.clients.add(ws);
  }

  leave(ws: WebSocket): void {
    this.clients.delete(ws);
  }

  get size(): number {
    return this.clients.size;
  }

  snapshot(): PitchEvent {
    return { type: 'STATE_SYNC', state: this.state, ts: Date.now() };
  }

  /** Aplica el evento al estado de la sala y lo reenvia a todos salvo al emisor. */
  applyAndBroadcast(event: PitchEvent, sender: WebSocket): void {
    if (!isTransportOnlyEvent(event)) {
      this.state = reduceRoomState(this.state, event);
    }

    const payload = JSON.stringify(event);
    for (const client of this.clients) {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }
}

export class RoomRegistry {
  private readonly rooms = new Map<string, Room>();

  get(id: string): Room {
    let room = this.rooms.get(id);
    if (!room) {
      room = new Room(id);
      this.rooms.set(id, room);
    }
    return room;
  }
}
