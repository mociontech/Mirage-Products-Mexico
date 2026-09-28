import { useEffect, useRef, useState } from 'react';
import { BrandFrame } from '../../../../components/BrandFrame/BrandFrame';
import { Logo } from '../../../../components/Logo/Logo';
import { MarqueeText } from '../../../../components/MarqueeText/MarqueeText';
import { fetchTopRanking, getCachedTopRanking, type RankingEntry } from '../../../../services/ranking';
import styles from './Ranking.module.css';

const AUTO_RETURN_MS = 5000;
/**
 * Cada cuanto reintenta mientras la pantalla siga montada. El envio del
 * puntaje de ESTA sesion viaja al sync-server (PARTICIPATION_RESULT) y de
 * ahi a Supabase via su propio outbox, de forma asincrona - casi nunca llega
 * a tiempo para el primer fetch (que corre apenas monta la pantalla, unos
 * milisegundos despues de tocar "Finalizar"). Sin este reintento, el
 * puntaje propio simplemente nunca aparecia: un solo fetch que llega antes
 * de que el insert exista se queda con la lista vieja para siempre. Mismo
 * patron que Ranking.tsx en Products Mobile/Memory Match.
 */
const POLL_INTERVAL_MS = 1500;

interface RankingProps {
  /** Se dispara solo, 5s despues de montar la pantalla - vuelve a Home y (via
   * el SESSION_END que dispara el caller) hace que el pitch vuelva a su loop. */
  onFinish: () => void;
}

/**
 * Positioned to match Figma exactly (node 423:178, "¡TOP 5!", design canvas
 * 1920x1200 - see the comment in Home.tsx for why literal px work here with
 * no unit conversion). Tarjeta unica de 1497px con las 5 posiciones
 * partidas en 2 columnas (3 + 2), igual que el mockup - sin boton de
 * "Finalizar" (aparece en el archivo como texto suelto sin fondo, oculto
 * detras de la tarjeta - mismo tipo de resto de copia/pega que otros
 * textos huerfanos ya vistos en este mismo archivo de Figma, no es parte
 * visible del diseño): el regreso a Home es automatico, a los
 * AUTO_RETURN_MS, no un tap explicito.
 */
const COLUMN_SPLIT = 3;

/** El nombre corre hacia la izquierda y de vuelta si no cabe (MarqueeText) en vez de cortarse - el puntaje nunca se corta. */
function RankingRow({ entry, delayMs }: { entry: RankingEntry; delayMs: number }) {
  return (
    <p className={`${styles.row} enterFromRight`} style={{ animationDelay: `${delayMs}ms` }}>
      <span className={styles.name}>
        <MarqueeText text={entry.participant_name ?? 'Anonimo'} />
      </span>{' '}
      <span className={styles.score}>{Math.round(entry.score)}pt</span>
    </p>
  );
}

export function Ranking({ onFinish }: RankingProps) {
  // Arranca con lo que TabletApp.tsx ya haya prefeteado (prefetchTopRanking)
  // al confirmar el producto - evita el parpadeo inicial mientras se repite
  // el fetch por si el cache quedo desactualizado.
  const [entries, setEntries] = useState<RankingEntry[]>(() => getCachedTopRanking() ?? []);

  useEffect(() => {
    let cancelled = false;

    const poll = () => {
      fetchTopRanking().then((rows) => {
        if (!cancelled) setEntries(rows.slice(0, 5));
      });
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
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
        <div className={styles.cardAccentTop} />
        <div className={styles.cardAccentBottom} />
        {entries.length === 0 ? (
          <p className={styles.empty}>Aun no hay resultados</p>
        ) : (
          <>
            <div className={styles.column}>
              {entries.slice(0, COLUMN_SPLIT).map((entry, index) => (
                <RankingRow key={entry.position} entry={entry} delayMs={240 + index * 70} />
              ))}
            </div>
            <div className={styles.column}>
              {entries.slice(COLUMN_SPLIT).map((entry, index) => (
                <RankingRow key={entry.position} entry={entry} delayMs={240 + (COLUMN_SPLIT + index) * 70} />
              ))}
            </div>
          </>
        )}
      </div>
    </BrandFrame>
  );
}
