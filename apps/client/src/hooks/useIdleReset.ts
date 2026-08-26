import { useEffect, useRef } from 'react';

const DEFAULT_IDLE_MS = 60_000;
const ACTIVITY_EVENTS = ['pointerdown', 'touchstart', 'keydown'] as const;

/**
 * Sin interaccion durante idleMs, llama a onIdle (la tablet vuelve a Inicio
 * y emite SESSION_END - ver seccion 8 del brief). Se reinicia con cualquier
 * toque o tecla en el documento completo, no solo dentro de un elemento.
 */
export function useIdleReset(onIdle: () => void, idleMs: number = DEFAULT_IDLE_MS): void {
  const onIdleRef = useRef(onIdle);
  useEffect(() => {
    onIdleRef.current = onIdle;
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => onIdleRef.current(), idleMs);
    };

    reset();
    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, reset);
    }

    return () => {
      clearTimeout(timer);
      for (const event of ACTIVITY_EVENTS) {
        document.removeEventListener(event, reset);
      }
    };
  }, [idleMs]);
}
