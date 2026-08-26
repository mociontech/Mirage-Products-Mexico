import { useEffect } from 'react';

/**
 * Bloquea los gestos e interacciones del navegador/WebView que rompen la
 * sensacion de kiosco: menu contextual, seleccion de texto fuera de campos
 * editables, arrastre de imagenes, pinch-zoom y doble-tap-zoom.
 *
 * El resto del endurecimiento visual (scrollbars, tap highlight, user-select)
 * vive en styles/reset.css; este hook cubre lo que solo se puede prevenir
 * interceptando eventos.
 */
export function useKioskGuards(): void {
  useEffect(() => {
    const preventDefault = (event: Event) => event.preventDefault();

    const preventMultiTouch = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    };

    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (event: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('gesturestart', preventDefault);
    document.addEventListener('dragstart', preventDefault);
    document.addEventListener('touchstart', preventMultiTouch, { passive: false });
    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });

    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('gesturestart', preventDefault);
      document.removeEventListener('dragstart', preventDefault);
      document.removeEventListener('touchstart', preventMultiTouch);
      document.removeEventListener('touchend', preventDoubleTapZoom);
    };
  }, []);
}
