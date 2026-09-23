import { useEffect, useState } from 'react';
import type { Product } from '../../../../content/products';
import styles from './ProductContent.module.css';

interface ProductContentProps {
  product: Product;
}

const FADE_MS = 260;

/**
 * Espejo del producto que el usuario esta explorando/selecciono en la
 * tablet. Cada producto trae su propio banner vertical ya armado por la
 * marca (logo + foto + copy + features, ver product.pitchImage en
 * content/products.ts) - el pitch solo lo muestra a pantalla completa, no
 * recompone el layout.
 *
 * Cambiar de un producto a otro (mismo estado, product.id distinto) antes
 * simplemente reemplazaba el src de golpe - ahora hace un fade: opacity a 0,
 * cambia el banner mostrado, opacity de vuelta a 1. displayedProduct se
 * actualiza a la mitad del fade (no de una), asi el banner viejo nunca
 * desaparece antes de que el nuevo este listo para entrar.
 */
export function ProductContent({ product }: ProductContentProps) {
  const [displayedProduct, setDisplayedProduct] = useState(product);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (product.id === displayedProduct.id) return;
    setVisible(false);
    const timer = setTimeout(() => {
      setDisplayedProduct(product);
      setVisible(true);
    }, FADE_MS);
    return () => clearTimeout(timer);
  }, [product, displayedProduct.id]);

  return (
    <div className={styles.screen}>
      <img
        src={displayedProduct.pitchImage}
        alt={displayedProduct.name}
        className={styles.banner}
        style={{ opacity: visible ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
      />
    </div>
  );
}
