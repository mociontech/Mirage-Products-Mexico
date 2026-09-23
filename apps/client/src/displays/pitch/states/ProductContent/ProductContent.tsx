import { useEffect, useState } from 'react';
import pitchBackground from '../../../../assets/images/pitch/Fondo_MEX_PANTALLA VERTICAL.png';
import type { Product } from '../../../../content/products';
import styles from './ProductContent.module.css';

interface ProductContentProps {
  product: Product;
}

const FADE_MS = 150;

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
 *
 * pitchBackground (dado por el cliente) va SIEMPRE detras del banner del
 * producto, a pantalla completa - es el mismo marco de marca (logo, ondas,
 * franja roja, dominio) sin el producto especifico. Al ser un solo asset
 * compartido entre todos los productos, el navegador ya lo tiene cacheado
 * practicamente de inmediato, asi que la pantalla nunca se ve vacia/gris
 * mientras el banner pesado de cada producto individual todavia esta
 * cargando - se ve la marca de una, el producto aparece encima apenas esta
 * listo.
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
      <img src={pitchBackground} alt="" className={styles.background} />
      <img
        src={displayedProduct.pitchImage}
        alt={displayedProduct.name}
        className={styles.banner}
        style={{ opacity: visible ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
      />
    </div>
  );
}
