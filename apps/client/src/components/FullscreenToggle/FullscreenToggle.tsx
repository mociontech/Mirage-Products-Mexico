import { useEffect, useState } from 'react';
import styles from './FullscreenToggle.module.css';

/**
 * Boton discreto, fijo en la esquina, para entrar/salir de pantalla completa
 * - el kiosco (tablet o pitch) corre en un navegador, no en una app nativa,
 * asi que no hay otra forma de ocultar la barra del navegador ni de volver
 * a salir de fullscreen sin un atajo de teclado. Vive en App.tsx (no en
 * TabletApp/PitchApp) para no duplicarlo entre displays.
 */
export function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement));

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen();
    }
  };

  return (
    <button
      type="button"
      className={styles.button}
      onClick={toggle}
      aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
      title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
    >
      {isFullscreen ? (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M9 21H5a2 2 0 0 1-2-2v-4M15 21h4a2 2 0 0 0 2-2v-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M3 9V5a2 2 0 0 1 2-2h4M21 9V5a2 2 0 0 0-2-2h-4M3 15v4a2 2 0 0 0 2 2h4M21 15v4a2 2 0 0 1-2 2h-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
