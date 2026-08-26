import idleLoopPlaceholder from '../../../../assets/video/idle-loop-placeholder.mp4';
import { VideoLayer } from '../../../../components/VideoLayer/VideoLayer';

const IDLE_SOURCES = [{ id: 'idle-loop', src: idleLoopPlaceholder }];

/**
 * Estado por defecto y fallback universal ante error/timeout/desconexion.
 * El video es un placeholder generado (ver assets-manifest.md) - falta el
 * loop institucional real de la marca.
 */
export function Idle() {
  return <VideoLayer sources={IDLE_SOURCES} activeId="idle-loop" />;
}
