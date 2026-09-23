import { useEffect, useRef, useState } from 'react';
import logoMirage from '../../../../assets/images/logo-mirage-select.svg';
import { BrandFrame } from '../../../../components/BrandFrame/BrandFrame';
import { getProductById } from '../../../../content/products';
import styles from './ProductSelect.module.css';
import { productCards, productTiles } from './tiles';

interface ProductSelectProps {
  selectedProductId: string | null;
  onPreview: (productId: string) => void;
  onConfirm: (productId: string) => void;
}

/**
 * Layout final de seleccion de producto (Figma node 526:946,
 * "03_Pantalla seleccion_productos" - version vigente, canvas 1920x1200 -
 * ver comentario en Home.tsx sobre por que los px literales sirven de
 * coordenadas absolutas). Los 12 tiles (foto + logo real de marca, ver
 * tiles.ts) estan en 3 filas de 4 columnas; la fila del medio queda sobre
 * la franja roja horizontal. Cada tile es una tarjeta con fondo degradado
 * (ver tiles.ts#productCards, antes ausente) + foto y logo encima en su
 * posicion exacta. Cada tile es una zona tactil que emite PRODUCT_PREVIEW;
 * el pitch reacciona en vivo mientras el usuario explora.
 *
 * Al seleccionar un producto, el tile pulsa (escala + fade) - el boton
 * nunca se remonta (destruiria y redecodificaria las imagenes en cada
 * toque = lag notorio); la animacion se reinicia a mano quitando y
 * volviendo a poner la clase sobre el mismo nodo del DOM.
 */
export function ProductSelect({ selectedProductId, onPreview, onConfirm }: ProductSelectProps) {
  const [pulseNonce, setPulseNonce] = useState(0);
  const tileRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!selectedProductId) return;
    const el = tileRefs.current[selectedProductId];
    if (!el) return;
    el.classList.remove(styles.pulsing);
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    el.offsetWidth; // fuerza reflow para que el navegador "olvide" el estado anterior de la animacion
    el.classList.add(styles.pulsing);
  }, [selectedProductId, pulseNonce]);

  return (
    <BrandFrame>
      <img src={logoMirage} alt="Mirage" className={`${styles.logo} enterFromTop`} />
      <div className={styles.redBand} />

      {productTiles.map((tile, index) => {
        const product = getProductById(tile.productId);
        const card = productCards[tile.productId];
        if (!product || !card) return null;
        const isSelected = product.id === selectedProductId;

        return (
          <button
            key={product.id}
            ref={(el) => {
              tileRefs.current[product.id] = el;
            }}
            type="button"
            aria-label={product.name}
            className={`${styles.tile} ${card.variant === 'red' ? styles.tileRed : styles.tileLight} ${isSelected ? styles.selected : ''} enterScale`}
            style={{ left: card.x, top: card.y, width: card.width, height: card.height, animationDelay: `${index * 45}ms` }}
            onClick={() => {
              onPreview(product.id);
              setPulseNonce((count) => count + 1);
            }}
          >
            <img
              src={product.tileImage}
              alt=""
              className={styles.tilePhoto}
              style={{
                left: tile.photo.x - card.x,
                top: tile.photo.y - card.y,
                width: tile.photo.width,
                height: tile.photo.height,
              }}
            />
            <img
              src={product.tileLogo}
              alt={product.name}
              className={styles.tileLogo}
              style={{
                left: tile.logo.x - card.x,
                top: tile.logo.y - card.y,
                width: tile.logo.width,
                height: tile.logo.height,
              }}
            />
            {tile.capacityLabel && (
              <span
                className={styles.capacityLabel}
                style={{ left: tile.capacityLabel.x - card.x, top: tile.capacityLabel.y - card.y }}
              >
                {tile.capacityLabel.text}
              </span>
            )}
          </button>
        );
      })}

      {selectedProductId && (
        <button
          type="button"
          className={`${styles.confirmButton} enterFromRight`}
          onClick={() => onConfirm(selectedProductId)}
        >
          Continuar
        </button>
      )}
    </BrandFrame>
  );
}
