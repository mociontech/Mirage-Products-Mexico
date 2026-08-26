import { Logo } from '../../../../components/Logo/Logo';
import type { Product } from '../../../../content/products';
import styles from './ProductContent.module.css';

interface ProductContentProps {
  product: Product;
}

/** Espejo del producto que el usuario esta explorando/selecciono en la tablet. */
export function ProductContent({ product }: ProductContentProps) {
  return (
    <div className={styles.screen}>
      <Logo width={900} />
      <img src={product.heroImage} alt={product.name} className={styles.hero} />
      <div className={styles.feature}>
        <img src={product.featureIcon} alt="" className={styles.featureIcon} />
        <span className={styles.featureLabel}>{product.featureLabel}</span>
      </div>
      <p className={styles.description}>{product.description}</p>
      {product.isPlaceholder && <p className={styles.placeholderBadge}>Contenido de muestra - pendiente de la marca</p>}
    </div>
  );
}
