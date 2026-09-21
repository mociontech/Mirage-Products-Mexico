import { BrandFrame } from '../../../../components/BrandFrame/BrandFrame';
import { Button } from '../../../../components/Button/Button';
import { getProductById } from '../../../../content/products';
import styles from './ProductSelect.module.css';
import { productTiles } from './tiles';

interface ProductSelectProps {
  selectedProductId: string | null;
  onPreview: (productId: string) => void;
  onConfirm: (productId: string) => void;
}

/**
 * Layout final de seleccion de producto (Figma node 224:2810,
 * "03_Pantalla seleccion_productos", canvas 1920x1200 - ver comentario en
 * Home.tsx sobre por que los px literales sirven de coordenadas absolutas).
 * Los 12 tiles (foto + logo real de marca, ver tiles.ts) estan repartidos en
 * tres filas separadas por la franja roja horizontal a la mitad de la
 * pantalla. Cada tile es una zona tactil que emite PRODUCT_PREVIEW; el pitch
 * reacciona en vivo mientras el usuario explora.
 */
export function ProductSelect({ selectedProductId, onPreview, onConfirm }: ProductSelectProps) {
  return (
    <BrandFrame>
      <p className={styles.hint}>Toca y explora</p>
      <div className={styles.redBand} />

      {productTiles.map((tile) => {
        const product = getProductById(tile.productId);
        if (!product) return null;
        const left = Math.min(tile.photo.x, tile.logo.x);
        const top = Math.min(tile.photo.y, tile.logo.y);
        const right = Math.max(tile.photo.x + tile.photo.width, tile.logo.x + tile.logo.width);
        const bottom = Math.max(tile.photo.y + tile.photo.height, tile.logo.y + tile.logo.height);

        return (
          <button
            key={product.id}
            type="button"
            aria-label={product.name}
            className={`${styles.tile} ${product.id === selectedProductId ? styles.selected : ''}`}
            style={{ left, top, width: right - left, height: bottom - top }}
            onClick={() => onPreview(product.id)}
          >
            <img
              src={product.tileImage}
              alt=""
              className={styles.tilePhoto}
              style={{
                left: tile.photo.x - left,
                top: tile.photo.y - top,
                width: tile.photo.width,
                height: tile.photo.height,
              }}
            />
            <img
              src={product.tileLogo}
              alt={product.name}
              className={styles.tileLogo}
              style={{
                left: tile.logo.x - left,
                top: tile.logo.y - top,
                width: tile.logo.width,
                height: tile.logo.height,
              }}
            />
            {tile.capacityLabel && (
              <span
                className={styles.capacityLabel}
                style={{ left: tile.capacityLabel.x - left, top: tile.capacityLabel.y - top }}
              >
                {tile.capacityLabel.text}
              </span>
            )}
          </button>
        );
      })}

      {selectedProductId && (
        <div className={styles.confirmRow}>
          <Button onClick={() => onConfirm(selectedProductId)}>Continuar</Button>
        </div>
      )}
    </BrandFrame>
  );
}
