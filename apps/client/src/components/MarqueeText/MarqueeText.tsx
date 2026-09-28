import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./MarqueeText.module.css";

interface MarqueeTextProps {
  text: string;
}

/**
 * Corre el texto hacia la izquierda y de vuelta cuando no cabe en su
 * contenedor (nombres largos en el Top 5), en vez de cortarlo con "..." -
 * el nombre completo siempre termina siendo visible. Si cabe sin recortar,
 * se queda quieto (no anima nada). Vuelve a medir cada vez que cambia el
 * texto, asi el mismo elemento sirve para filas cuyo contenido rota (poll).
 */
export function MarqueeText({ text }: MarqueeTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const inner = textRef.current;
    if (!container || !inner) return;
    const overflow = inner.scrollWidth - container.clientWidth;
    setDistance(overflow > 2 ? overflow + 6 : 0);
  }, [text]);

  return (
    <span ref={containerRef} className={styles.container}>
      <span
        ref={textRef}
        className={`${styles.text} ${distance > 0 ? styles.animate : ""}`}
        style={distance > 0 ? ({ "--marquee-distance": `-${distance}px` } as CSSProperties) : undefined}
      >
        {text}
      </span>
    </span>
  );
}
