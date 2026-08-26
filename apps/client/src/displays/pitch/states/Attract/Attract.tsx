import { Logo } from '../../../../components/Logo/Logo';
import styles from './Attract.module.css';

/**
 * Transicion breve entre IDLE y el contenido de producto, mientras el
 * usuario recien empieza en la tablet y todavia no toca ningun producto.
 * No hay pantalla propia en Figma para este estado (ver Fase 0); esta es
 * una implementacion razonable, no una traduccion de un mock.
 */
export function Attract() {
  return (
    <div className={styles.screen}>
      <Logo width={900} />
      <p className={styles.message}>Bienvenido, explora el catalogo en la tablet</p>
    </div>
  );
}
