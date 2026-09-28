import { useRef } from "react";
import styles from "./SecretResetZone.module.css";

const TAPS_TO_TRIGGER = 5;
const WINDOW_MS = 2500;

interface SecretResetZoneProps {
  onTrigger: () => void;
}

/**
 * Zona invisible en la esquina superior derecha: 5 toques seguidos ahi (en
 * menos de WINDOW_MS) vuelven al inicio, sin ningun boton visible en el
 * diseño. Pedido de ultimo momento (un dia antes del evento) para que el
 * staff pueda sacar a alguien de una pantalla trabada sin esperar el
 * timeout de inactividad ni tocar el diseño aprobado.
 *
 * Antes estaba en la esquina superior IZQUIERDA - se movio aca porque
 * tapaba (con z-index mas alto) la flecha de "volver" que agregamos despues
 * en ScreenShell, en esa misma esquina: el toque nunca le llegaba al boton,
 * solo a esta zona invisible que esta encima.
 */
export function SecretResetZone({ onTrigger }: SecretResetZoneProps) {
  const tapsRef = useRef<number[]>([]);

  const handleTap = () => {
    const now = Date.now();
    const recentTaps = tapsRef.current.filter((tapTime) => now - tapTime < WINDOW_MS);
    recentTaps.push(now);
    tapsRef.current = recentTaps;

    if (recentTaps.length >= TAPS_TO_TRIGGER) {
      tapsRef.current = [];
      onTrigger();
    }
  };

  return <div className={styles.zone} onClick={handleTap} aria-hidden="true" />;
}
