import { useEffect, useState } from 'react';
import { ConnectionDot } from '../components/ConnectionDot/ConnectionDot';
import { getSyncConfig, setSyncConfig } from '../sync/connection.config';
import type { PitchEvent, Role } from '../sync/events';
import { useSync } from '../sync/useSync';
import styles from './SyncDebugPage.module.css';

/**
 * Pantalla de prueba para validar el sync-server entre dos maquinas reales:
 * dispara eventos a mano, muestra el estado de conexion y el log de lo
 * recibido. No es parte del flujo real de tablet ni pitch (Fase 4/5).
 */
export function SyncDebugPage() {
  const [role, setRole] = useState<Role>('tablet');
  const [host, setHost] = useState(() => getSyncConfig()?.host ?? '');
  const [port, setPort] = useState(() => String(getSyncConfig()?.port ?? 7777));
  const [room, setRoom] = useState(() => getSyncConfig()?.room ?? 'stand-01');
  const [log, setLog] = useState<string[]>([]);

  const { send, status, lastEvent } = useSync(role);

  useEffect(() => {
    if (!lastEvent) return;
    setLog((prev) => [...prev, `<- ${JSON.stringify(lastEvent)}`].slice(-200));
  }, [lastEvent]);

  const saveConfig = () => {
    setSyncConfig({ host, port: Number(port), room });
    window.location.reload();
  };

  const emit = (event: PitchEvent) => {
    send(event);
    setLog((prev) => [...prev, `-> ${JSON.stringify(event)}`].slice(-200));
  };

  return (
    <div className={styles.page}>
      <h1>Sync debug</h1>

      <div className={styles.row}>
        <ConnectionDot status={status} />
        <span>{status}</span>
        <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
          <option value="tablet">tablet</option>
          <option value="pitch">pitch</option>
        </select>
      </div>

      <div className={styles.row}>
        <input placeholder="host" value={host} onChange={(event) => setHost(event.target.value)} />
        <input placeholder="port" value={port} onChange={(event) => setPort(event.target.value)} />
        <input placeholder="room" value={room} onChange={(event) => setRoom(event.target.value)} />
        <button type="button" onClick={saveConfig}>
          Guardar (recarga)
        </button>
      </div>

      <div className={styles.row}>
        <button type="button" onClick={() => emit({ type: 'SESSION_START', ts: Date.now() })}>
          SESSION_START
        </button>
        <button
          type="button"
          onClick={() => emit({ type: 'PRODUCT_PREVIEW', productId: 'magnum-inverter-22', ts: Date.now() })}
        >
          PRODUCT_PREVIEW
        </button>
        <button
          type="button"
          onClick={() => emit({ type: 'PRODUCT_SELECTED', productId: 'magnum-inverter-22', ts: Date.now() })}
        >
          PRODUCT_SELECTED
        </button>
        <button type="button" onClick={() => emit({ type: 'SESSION_END', ts: Date.now() })}>
          SESSION_END
        </button>
        <button type="button" onClick={() => emit({ type: 'RESET_IDLE', ts: Date.now() })}>
          RESET_IDLE
        </button>
      </div>

      <div className={styles.log}>{log.join('\n')}</div>
    </div>
  );
}
