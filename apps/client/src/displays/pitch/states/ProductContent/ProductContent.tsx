import type { Product } from '../../../../content/products';
import styles from './ProductContent.module.css';

interface ProductContentProps {
  product: Product;
}

/**
 * Espejo del producto que el usuario esta explorando/selecciono en la
 * tablet. Cada producto trae su propio banner vertical ya armado por la
 * marca (logo + foto + copy + features, ver product.pitchImage en
 * content/products.ts) - el pitch solo lo muestra a pantalla completa, no
 * recompone el layout.
 */
export function ProductContent({ product }: ProductContentProps) {
  return (
    <div className={styles.screen}>
      <img src={product.pitchImage} alt={product.name} className={styles.banner} />
    </div>
  );
}
