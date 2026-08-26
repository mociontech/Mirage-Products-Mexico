import type { ReactNode } from 'react';
import waveDecoration from '../../assets/images/wave-decoration.webp';
import styles from './BrandFrame.module.css';

interface BrandFrameProps {
  children: ReactNode;
}

/** Chrome de marca compartido: barras rojas arriba/abajo + ondas decorativas de fondo. */
export function BrandFrame({ children }: BrandFrameProps) {
  return (
    <div className={styles.frame}>
      <img src={waveDecoration} alt="" className={styles.waveTopRight} />
      <img src={waveDecoration} alt="" className={styles.waveBottomLeft} />
      <div className={`${styles.bar} ${styles.barTop}`} />
      <div className={`${styles.bar} ${styles.barBottom}`} />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
