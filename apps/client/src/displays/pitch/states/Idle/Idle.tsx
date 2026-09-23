import idleLoopPlaceholder from '../../../../assets/video/idle-loop-placeholder.mp4';
import { ParticlesLayer } from '../../../../components/ParticlesLayer/ParticlesLayer';
import { VideoLayer } from '../../../../components/VideoLayer/VideoLayer';
import styles from './Idle.module.css';

const IDLE_SOURCES = [{ id: 'idle-loop', src: idleLoopPlaceholder }];

/**
 * Estado por defecto y fallback universal ante error/timeout/desconexion.
 * El video es un placeholder generado (ver assets-manifest.md) - falta el
 * loop institucional real de la marca. Particulas encima como capa
 * decorativa, igual que en la version Colombia.
 */
export function Idle() {
  return (
    <div className={styles.wrapper}>
      <VideoLayer sources={IDLE_SOURCES} activeId="idle-loop" />
      <ParticlesLayer />
    </div>
  );
}
