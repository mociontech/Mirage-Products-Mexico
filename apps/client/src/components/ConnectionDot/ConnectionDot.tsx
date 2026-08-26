import type { SyncStatus } from '../../sync/SyncChannel';
import styles from './ConnectionDot.module.css';

interface ConnectionDotProps {
  status: SyncStatus;
}

/** Indicador discreto de conexion. Visible solo en modo debug (ver Fase 4). */
export function ConnectionDot({ status }: ConnectionDotProps) {
  return <span className={`${styles.dot} ${styles[status]}`} title={status} />;
}
