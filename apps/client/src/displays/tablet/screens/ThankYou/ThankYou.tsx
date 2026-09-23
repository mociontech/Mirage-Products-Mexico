import { BrandFrame } from '../../../../components/BrandFrame/BrandFrame';
import { Button } from '../../../../components/Button/Button';
import { Logo } from '../../../../components/Logo/Logo';
import styles from './ThankYou.module.css';

interface ThankYouProps {
  name: string | null;
  /** round(productos distintos vistos / total) * 100 - calculado en TabletApp.tsx. */
  points: number;
  onFinish: () => void;
}

/**
 * Positioned to match Figma exactly (node 224:3181, "04_Agradecimiento",
 * design canvas 1920x1200 - see the comment in Home.tsx for why literal px
 * work here with no unit conversion).
 */
export function ThankYou({ name, points, onFinish }: ThankYouProps) {
  return (
    <BrandFrame>
      <div className={`${styles.logo} enterFromTop`}>
        <Logo width={496} />
      </div>
      <h1 className={`${styles.title} enterFromLeft delay1`}>{name ? `¡Gracias, ${name}!` : '¡Gracias por participar!'}</h1>
      <div className={`${styles.scoreBox} enterScale delay2`}>{points}</div>
      <p className={`${styles.label} enterFromRight delay2`}>Acumulaste</p>
      <div className={`${styles.buttonBox} enterFromBottom delay3`}>
        <Button className={styles.finishButton} onClick={onFinish}>
          Finalizar
        </Button>
      </div>
    </BrandFrame>
  );
}
