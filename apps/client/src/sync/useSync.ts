import { useEffect, useRef, useState } from 'react';
import { BroadcastChannelSync } from './BroadcastChannelSync';
import { buildWebSocketUrl, getSyncConfig } from './connection.config';
import type { PitchEvent, Role } from './events';
import type { SyncChannel, SyncStatus } from './SyncChannel';
import { WebSocketSync } from './WebSocketSync';

const TRANSPORT: 'websocket' | 'broadcast' =
  import.meta.env.VITE_SYNC_TRANSPORT === 'websocket' ? 'websocket' : 'broadcast';

function createChannel(role: Role): SyncChannel | null {
  const config = getSyncConfig();

  if (TRANSPORT === 'broadcast') {
    return new BroadcastChannelSync(config?.room ?? 'stand-01', role);
  }

  // Sin host/puerto configurado todavia: la tablet necesita pasar primero
  // por la pantalla de Settings (Fase 4). Sin eso no hay a donde conectar.
  if (!config) return null;
  return new WebSocketSync(buildWebSocketUrl(config), role);
}

export interface UseSyncResult {
  send: (event: PitchEvent) => void;
  status: SyncStatus;
  lastEvent: PitchEvent | null;
}

/** Punto unico de acceso al canal de sincronizacion desde componentes React. */
export function useSync(role: Role): UseSyncResult {
  const channelRef = useRef<SyncChannel | null>(null);
  const [status, setStatus] = useState<SyncStatus>('disconnected');
  const [lastEvent, setLastEvent] = useState<PitchEvent | null>(null);

  useEffect(() => {
    const channel = createChannel(role);
    channelRef.current = channel;

    if (!channel) {
      setStatus('disconnected');
      return;
    }

    setStatus(channel.status);
    const unsubscribe = channel.subscribe(setLastEvent);
    const statusPoll = setInterval(() => setStatus(channel.status), 1000);

    return () => {
      unsubscribe();
      clearInterval(statusPoll);
      channel.close?.();
      channelRef.current = null;
    };
  }, [role]);

  return {
    send: (event) => channelRef.current?.send(event),
    status,
    lastEvent,
  };
}
