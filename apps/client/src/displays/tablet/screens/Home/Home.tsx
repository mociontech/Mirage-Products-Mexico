import { BrandFrame } from '../../../../components/BrandFrame/BrandFrame';
import { Button } from '../../../../components/Button/Button';
import { Logo } from '../../../../components/Logo/Logo';
import styles from './Home.module.css';

interface HomeProps {
  onStart: () => void;
  onOpenSettings: () => void;
}

/**
 * Positioned to match Figma exactly (node 224:3257, "01_Inicio", design
 * canvas 1920x1200 - ScaleViewport scales this whole canvas uniformly to
 * fit the real screen, so literal Figma px work as absolute coordinates
 * with no unit conversion needed, unlike Memory Match's vh-based screens).
 */
export function Home({ onStart, onOpenSettings }: HomeProps) {
  return (
    <BrandFrame>
      <div className={styles.logo}>
        <Logo width={1371} />
      </div>
      <p className={styles.title}>PRODUCTO INTERACTIVO</p>
      <p className={styles.hint}>Toca y explora</p>
      <div className={styles.buttonBox}>
        <Button className={styles.ctaButton} onClick={onStart}>
          Empezar
        </Button>
      </div>
      {/* TODO: quitar antes de evento - boton temporal de pruebas, reemplaza el gesto oculto */}
      <button className={styles.settingsLink} onClick={onOpenSettings}>
        Configuracion
      </button>
    </BrandFrame>
  );
}
