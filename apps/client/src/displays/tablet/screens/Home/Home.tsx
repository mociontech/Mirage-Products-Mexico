import { BrandFrame } from '../../../../components/BrandFrame/BrandFrame';
import { Button } from '../../../../components/Button/Button';
import { Logo } from '../../../../components/Logo/Logo';
import { useHiddenGesture } from '../../../../hooks/useHiddenGesture';
import styles from './Home.module.css';

interface HomeProps {
  onStart: () => void;
  onOpenSettings: () => void;
}

export function Home({ onStart, onOpenSettings }: HomeProps) {
  const handleLogoTap = useHiddenGesture(onOpenSettings);

  return (
    <BrandFrame>
      <div className={styles.center}>
        <Logo width={700} onClick={handleLogoTap} />
        <p className={styles.tagline}>CATALOGO INTERACTIVO</p>
        <p className={styles.hint}>toca y explora</p>
        <Button onClick={onStart}>Empezar</Button>
      </div>
    </BrandFrame>
  );
}
