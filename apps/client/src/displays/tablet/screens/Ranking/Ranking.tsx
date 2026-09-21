import { useEffect, useState } from 'react';
import { BrandFrame } from '../../../../components/BrandFrame/BrandFrame';
import { Button } from '../../../../components/Button/Button';
import { Logo } from '../../../../components/Logo/Logo';
import { fetchTopRanking, type RankingEntry } from '../../../../services/ranking';
import styles from './Ranking.module.css';

interface RankingProps {
  onFinish: () => void;
}

/**
 * Positioned to match Figma exactly (node 423:178, "¡TOP 5!", design canvas
 * 1920x1200 - see the comment in Home.tsx for why literal px work here with
 * no unit conversion). El top 10 llega de fetchTopRanking (sync-server ->
 * Supabase, experience "catalogo") y se reparte en dos columnas de 5, igual
 * que el diseno.
 */
export function Ranking({ onFinish }: RankingProps) {
  const [entries, setEntries] = useState<RankingEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchTopRanking().then((rows) => {
      if (!cancelled) setEntries(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const leftColumn = entries.slice(0, 5);
  const rightColumn = entries.slice(5, 10);

  return (
    <BrandFrame>
      <div className={styles.logo}>
        <Logo width={496} />
      </div>
      <h1 className={styles.title}>¡Top 5!</h1>

      <div className={styles.card}>
        {entries.length === 0 ? (
          <p className={styles.empty}>Aun no hay resultados</p>
        ) : (
          <>
            <RankingColumn entries={leftColumn} />
            <RankingColumn entries={rightColumn} />
          </>
        )}
      </div>

      <div className={styles.buttonBox}>
        <Button className={styles.finishButton} onClick={onFinish}>
          Finalizar
        </Button>
      </div>
    </BrandFrame>
  );
}

function RankingColumn({ entries }: { entries: RankingEntry[] }) {
  return (
    <div className={styles.column}>
      {entries.map((entry) => (
        <p key={entry.position} className={styles.row}>
          {entry.participant_name ?? 'Anonimo'} <span className={styles.score}>{Math.round(entry.score)}pt</span>
        </p>
      ))}
    </div>
  );
}
