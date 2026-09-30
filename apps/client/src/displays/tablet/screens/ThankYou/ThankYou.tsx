import { BrandFrame } from '../../../../components/BrandFrame/BrandFrame';
import { Button } from '../../../../components/Button/Button';
import { Logo } from '../../../../components/Logo/Logo';
import styles from './ThankYou.module.css';

/**
 * Solo nombre + primer apellido en el saludo, sin importar cuantas palabras
 * haya escrito la persona - un nombre con dos nombres y dos apellidos hacia
 * que el titulo ocupara varias lineas y se solapara con el puntaje de abajo
 * (el layout esta pensado, a la Figma, para 1 nombre + 1 apellido). El
 * nombre COMPLETO sigue yendo intacto a Evius/Supabase - esto es solo
 * cosmetico, no toca la sesion.
 */
function shortGreetingName(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).join(' ');
}

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
 *
 * El puntaje de arriba es SOLO de esta experiencia (Catalogo) - se aclara
 * con el label de abajo porque el dia del evento en Mexico el cliente vio un
 * 100 aca y penso que ya habia ganado el premio, cuando el premio lo decide
 * el ranking general (promedio con Memory Match, ver ranking_combined en
 * docs/supabase-schema.sql). El puesto en ESE ranking general se muestra en
 * la siguiente pantalla (Ranking), no aca: el envio real (PARTICIPATION_RESULT)
 * recien se dispara cuando la persona toca "Finalizar" en esta pantalla, asi
 * que consultarlo aca siempre llegaria antes de que el dato exista.
 */
export function ThankYou({ name, points, onFinish }: ThankYouProps) {
  return (
    <BrandFrame>
      <div className={`${styles.logo} enterFromTop`}>
        <Logo width={496} />
      </div>
      <h1 className={`${styles.title} enterFromLeft delay1`}>
        {name ? `¡Gracias, ${shortGreetingName(name)}!` : '¡Gracias por participar!'}
      </h1>
      <div className={`${styles.scoreBox} enterScale delay2`}>{points}</div>
      <p className={`${styles.label} enterFromRight delay2`}>Acumulaste en esta experiencia</p>
      <div className={`${styles.buttonBox} enterFromBottom delay3`}>
        <Button className={styles.finishButton} onClick={onFinish}>
          Finalizar
        </Button>
      </div>
    </BrandFrame>
  );
}
