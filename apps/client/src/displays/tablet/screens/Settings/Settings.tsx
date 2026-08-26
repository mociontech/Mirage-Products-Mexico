import { useState } from 'react';
import { BrandFrame } from '../../../../components/BrandFrame/BrandFrame';
import { Button } from '../../../../components/Button/Button';
import { ConnectionDot } from '../../../../components/ConnectionDot/ConnectionDot';
import { Logo } from '../../../../components/Logo/Logo';
import { TextField } from '../../../../components/TextField/TextField';
import { getSyncConfig, setSyncConfig } from '../../../../sync/connection.config';
import { useSync } from '../../../../sync/useSync';
import styles from './Settings.module.css';

interface SettingsProps {
  onClose: () => void;
}

/**
 * IP/puerto del sync-server nunca van hardcodeados en el bundle - se leen y
 * escriben aca. Se llega por el gesto oculto de 5 taps en el logo (seccion
 * 4 del brief), asi que se puede reconfigurar en sitio sin reinstalar el APK.
 */
export function Settings({ onClose }: SettingsProps) {
  const existing = getSyncConfig();
  const [host, setHost] = useState(existing?.host ?? '');
  const [port, setPort] = useState(String(existing?.port ?? 7777));
  const [room, setRoom] = useState(existing?.room ?? 'stand-01');
  const { status } = useSync('tablet');

  const save = () => {
    setSyncConfig({ host, port: Number(port), room });
    window.location.reload();
  };

  return (
    <BrandFrame>
      <div className={styles.center}>
        <Logo width={220} />
        <h1 className={styles.title}>Configuracion de conexion</h1>

        <div className={styles.status}>
          <ConnectionDot status={status} />
          <span>{status}</span>
        </div>

        <div className={styles.form}>
          <TextField placeholder="IP del sync-server" value={host} onChange={(event) => setHost(event.target.value)} />
          <TextField placeholder="Puerto" value={port} onChange={(event) => setPort(event.target.value)} />
          <TextField placeholder="Room / stand" value={room} onChange={(event) => setRoom(event.target.value)} />
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>
            Volver
          </Button>
          <Button onClick={save}>Guardar y reiniciar</Button>
        </div>
      </div>
    </BrandFrame>
  );
}
