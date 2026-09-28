import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './ScaleViewport.module.css';

interface ScaleViewportProps {
  /** Ancho del lienzo de diseno (viewport de referencia en Figma), en px. */
  designWidth: number;
  /** Alto del lienzo de diseno (viewport de referencia en Figma), en px. */
  designHeight: number;
  children: ReactNode;
  /**
   * true = estira el lienzo para llenar ancho Y alto reales por separado
   * (escala X y Y independientes, deforma el contenido si la proporcion de
   * la pantalla real no coincide con la del diseno) en vez del fit-to-screen
   * normal (una sola escala, misma para X e Y, con barras si no coincide la
   * proporcion). Pedido puntual para la pitch de Mexico: prefieren que la
   * imagen ocupe todo el ancho real de la pantalla, aunque eso implique
   * deformar el video/los productos, a que queden barras negras a los
   * costados.
   */
  stretch?: boolean;
}

/**
 * Escala un lienzo de tamano fijo (el viewport de diseno de Figma) para que
 * quepa completo en cualquier resolucion real de tablet o pantalla de pitch,
 * sin recortar ni deformar. No sabemos aun el modelo/resolucion exacta de
 * ninguno de los dos dispositivos, asi que todo el layout se construye contra
 * un lienzo fijo y esta capa hace el fit-to-screen en tiempo real.
 */
export function ScaleViewport({ designWidth, designHeight, children, stretch = false }: ScaleViewportProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(() => {
    const scaleX = window.innerWidth / designWidth;
    const scaleY = window.innerHeight / designHeight;
    return stretch ? { x: scaleX, y: scaleY } : { x: Math.min(scaleX, scaleY), y: Math.min(scaleX, scaleY) };
  });

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    const updateScale = () => {
      const { clientWidth, clientHeight } = outer;
      const scaleX = clientWidth / designWidth;
      const scaleY = clientHeight / designHeight;
      const uniform = Math.min(scaleX, scaleY);
      const next = stretch ? { x: scaleX, y: scaleY } : { x: uniform, y: uniform };
      setScale({ x: next.x > 0 ? next.x : 1, y: next.y > 0 ? next.y : 1 });
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(outer);
    return () => observer.disconnect();
  }, [designWidth, designHeight, stretch]);

  return (
    <div ref={outerRef} className={styles.outer}>
      <div
        className={styles.inner}
        style={{
          width: designWidth,
          height: designHeight,
          transform: `scale(${scale.x}, ${scale.y})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
