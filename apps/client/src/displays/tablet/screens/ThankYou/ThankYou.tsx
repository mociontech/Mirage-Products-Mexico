import { BrandFrame } from '../../../../components/BrandFrame/BrandFrame';
import { Button } from '../../../../components/Button/Button';
import { Logo } from '../../../../components/Logo/Logo';
import { PARTICIPATION_POINTS } from '../../session';
import styles from './ThankYou.module.css';

interface ThankYouProps {
  name: string | null;
  onFinish: () => void;
}

/**
 * Positioned to match Figma exactly (node 224:3181, "04_Agradecimiento",
 * design canvas 1920x1200 - see the comment in Home.tsx for why literal px
 * work here with no unit conversion).
 */
export function ThankYou({ name, onFinish }: ThankYouProps) {
  return (
    <BrandFrame>
      <div className={styles.logo}>
        <Logo width={496} />
      </div>
      <h1 className={styles.title}>{name ? `¡Gracias, ${name}!` : '¡Gracias por participar!'}</h1>
      <div className={styles.scoreBox}>{PARTICIPATION_POINTS}</div>
      <p className={styles.label}>Acumulaste</p>
      <div className={styles.buttonBox}>
        <Button className={styles.finishButton} onClick={onFinish}>
          Finalizar
        </Button>
      </div>
    </BrandFrame>
  );
}
