import fondoPitch from '../../../../assets/images/pitch/FondoPitch.webp';
import { ParticlesLayer } from '../../../../components/ParticlesLayer/ParticlesLayer';
import styles from './Idle.module.css';

/**
 * Estado por defecto y fallback universal ante error/timeout/desconexion,
 * cuando no hay interaccion. Mismo fondo que usa Colombia para este mismo
 * estado (FondoPitch.webp - logo Mirage centrado sobre las cintas rojas, sin
 * texto de pais, asi que se reutiliza tal cual en vez de duplicarlo) + una
 * capa de particulas encima para que no se sienta completamente quieta. No
 * confundir con Fondo_MEX_PANTALLA VERTICAL.png (el marco especifico de
 * Mexico que va detras del banner de cada producto en ProductContent, con
 * el logo arriba en vez de al centro) - son dos fondos distintos para dos
 * pantallas distintas. Reemplaza al placeholder de video anterior (VideoLayer
 * con idle-loop-placeholder.mp4), que no es contenido real de marca.
 */
export function Idle() {
  return (
    <div className={styles.background}>
      <img src={fondoPitch} alt="" className={styles.backgroundImage} />
      <ParticlesLayer />
    </div>
  );
}
