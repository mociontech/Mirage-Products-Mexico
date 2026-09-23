import { useEffect, useRef, useState } from 'react';
import { BrandFrame } from '../../../../components/BrandFrame/BrandFrame';
import { Logo } from '../../../../components/Logo/Logo';
import { fetchTopRanking, type RankingEntry } from '../../../../services/ranking';
import styles from './Ranking.module.css';

const AUTO_RETURN_MS = 5000;

interface RankingProps {
  /** Se dispara solo, 5s despues de montar la pantalla - vuelve a Home y (via
   * el SESSION_END que dispara el caller) hace que el pitch vuelva a su loop. */
  onFinish: () => void;
}

/**
 * Positioned to match Figma exactly (node 423:178, "¡TOP 5!", design canvas
 * 1920x1200 - see the comment in Home.tsx for why literal px work here with
 * no unit conversion). Top 5 real (no top 10 partido en dos columnas),
 * centrado - sin boton de "Finalizar": el regreso a Home es automatico,
 * a los AUTO_RETURN_MS, no un tap explicito.
 */
export function Ranking({ onFinish }: RankingProps) {
  const [entries, setEntries] = useState<RankingEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchTopRanking().then((rows) => {
      if (!cancelled) setEntries(rows.slice(0, 5));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Ref para leer siempre el ultimo onFinish sin que su identidad (recreada
  // en cada render de TabletApp, p.ej. por los HEARTBEAT que llegan por el
  // socket) reinicie este timer - antes dependia de [onFinish] y el timer
  // nunca llegaba a dispararse porque se cancelaba y volvia a armar en cada
  // heartbeat.
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    const timer = setTimeout(() => onFinishRef.current(), AUTO_RETURN_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <BrandFrame>
      <div className={`${styles.logo} enterFromTop`}>
        <Logo width={496} />
      </div>
      <h1 className={`${styles.title} enterFromLeft delay1`}>¡Top 5!</h1>

      <div className={`${styles.card} enterFromBottom delay2`}>
        {entries.length === 0 ? (
          <p className={styles.empty}>Aun no hay resultados</p>
        ) : (
          <div className={styles.column}>
            {entries.map((entry, index) => (
              <p
                key={entry.position}
                className={`${styles.row} enterFromRight`}
                style={{ animationDelay: `${240 + index * 70}ms` }}
              >
                {entry.participant_name ?? 'Anonimo'} <span className={styles.score}>{Math.round(entry.score)}pt</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </BrandFrame>
  );
}
