import { useRef } from 'react';

const DEFAULT_TAPS = 5;
const DEFAULT_WINDOW_MS = 3000;

/**
 * Devuelve un onClick para el logo: N taps seguidos (dentro de windowMs)
 * abren la pantalla de Settings sin dejar rastro visible en la UI normal
 * (seccion 4 del brief).
 */
export function useHiddenGesture(onActivate: () => void, taps: number = DEFAULT_TAPS, windowMs: number = DEFAULT_WINDOW_MS) {
  const countRef = useRef(0);
  const lastTapRef = useRef(0);

  return () => {
    const now = Date.now();
    if (now - lastTapRef.current > windowMs) {
      countRef.current = 0;
    }
    lastTapRef.current = now;
    countRef.current += 1;

    if (countRef.current >= taps) {
      countRef.current = 0;
      onActivate();
    }
  };
}
