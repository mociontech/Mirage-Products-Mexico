import { useEffect, useRef } from 'react';
import styles from './VideoLayer.module.css';

export interface VideoSource {
  id: string;
  src: string;
}

interface VideoLayerProps {
  sources: VideoSource[];
  activeId: string;
}

/**
 * Pool de <video>: todos los sources se montan una sola vez y siguen
 * reproduciendo de fondo aunque no esten visibles, para que el crossfade sea
 * un simple cambio de opacity y nunca un remount que reinicie o haga
 * buffering (ver seccion 7/11 del brief).
 */
export function VideoLayer({ sources, activeId }: VideoLayerProps) {
  return (
    <div className={styles.stack}>
      {sources.map((source) => (
        <PooledVideo key={source.id} src={source.src} active={source.id === activeId} />
      ))}
    </div>
  );
}

function PooledVideo({ src, active }: { src: string; active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const attemptPlay = () => {
      video.play().catch(() => {
        // Autoplay rechazado (politica del navegador): reintenta en la
        // primera interaccion del usuario, como pide la restriccion dura #4.
        const retryOnInteraction = () => {
          video.play().catch(() => {});
        };
        document.addEventListener('pointerdown', retryOnInteraction, { once: true });
      });
    };

    attemptPlay();
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      className={styles.video}
      style={{ opacity: active ? 1 : 0 }}
      muted
      loop
      playsInline
      preload="auto"
    />
  );
}
