import boardReference from '../../../../assets/images/product-select-board-reference.webp';
import { Button } from '../../../../components/Button/Button';
import { getProductById } from '../../../../content/products';
import styles from './ProductSelect.module.css';
import { productSelectHotspots } from './hotspots';

interface ProductSelectProps {
  selectedProductId: string | null;
  onPreview: (productId: string) => void;
  onConfirm: (productId: string) => void;
}

/**
 * Fondo = foto de referencia del muro fisico (ver assets-manifest.md, es
 * provisional). Los 12 hotspots son zonas tactiles invisibles superpuestas,
 * cada toque emite PRODUCT_PREVIEW para que el pitch reaccione en vivo
 * mientras el usuario explora; "Continuar" confirma con PRODUCT_SELECTED.
 */
export function ProductSelect({ selectedProductId, onPreview, onConfirm }: ProductSelectProps) {
  return (
    <div className={styles.screen}>
      <p className={styles.hint}>toca y explora</p>

      <div className={styles.stage}>
        <div className={styles.imageWrap}>
          <img src={boardReference} alt="Catalogo de productos Mirage" className={styles.boardImage} />

          {productSelectHotspots.map((hotspot) => {
            const product = getProductById(hotspot.productId);
            return (
              <button
                key={hotspot.productId}
                type="button"
                aria-label={product?.name ?? hotspot.productId}
                className={`${styles.hotspot} ${hotspot.productId === selectedProductId ? styles.selected : ''}`}
                style={{
                  top: `${hotspot.top}%`,
                  left: `${hotspot.left}%`,
                  width: `${hotspot.width}%`,
                  height: `${hotspot.height}%`,
                }}
                onClick={() => onPreview(hotspot.productId)}
              />
            );
          })}
        </div>
      </div>

      {selectedProductId && (
        <div className={styles.confirmRow}>
          <Button onClick={() => onConfirm(selectedProductId)}>Continuar</Button>
        </div>
      )}
    </div>
  );
}
