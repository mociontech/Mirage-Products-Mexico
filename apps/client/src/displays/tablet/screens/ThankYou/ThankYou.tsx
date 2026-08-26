import { BrandFrame } from '../../../../components/BrandFrame/BrandFrame';
import { Button } from '../../../../components/Button/Button';
import { Logo } from '../../../../components/Logo/Logo';
import { PARTICIPATION_POINTS } from '../../session';
import styles from './ThankYou.module.css';

interface ThankYouProps {
  name: string | null;
  onFinish: () => void;
}

export function ThankYou({ name, onFinish }: ThankYouProps) {
  return (
    <BrandFrame>
      <div className={styles.center}>
        <Logo width={300} />
        <h1 className={styles.title}>{name ? `GRACIAS, ${name.toUpperCase()}` : 'GRACIAS POR PARTICIPAR'}</h1>
        <p className={styles.points}>ACUMULASTE {PARTICIPATION_POINTS} PUNTOS</p>
        <Button onClick={onFinish}>Finalizar</Button>
      </div>
    </BrandFrame>
  );
}
