/**
 * Zonas tactiles sobre product-select-board-reference.webp, en porcentaje
 * del propio recuadro de la imagen (no del lienzo completo). Calibradas a
 * ojo contra la foto de referencia - son provisionales: en cuanto la marca
 * entregue arte final del muro (o del layout que sea), esto se recalibra o,
 * mejor, se reemplaza por tarjetas reales en vez de hotspots sobre una foto.
 */
export interface Hotspot {
  productId: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

export const productSelectHotspots: Hotspot[] = [
  { productId: 'life-12-plus', top: 6, left: 12, width: 23, height: 10 },
  { productId: 'x-life', top: 6, left: 36, width: 17, height: 10 },
  { productId: 'x5-convencional', top: 26, left: 26, width: 19, height: 11 },
  { productId: 'aire-ventana-1-ton', top: 24, left: 59, width: 11, height: 10 },
  { productId: 'aire-ventana-2-ton', top: 24, left: 74, width: 11, height: 10 },
  { productId: 'flex-inverter', top: 45, left: 13, width: 20, height: 10 },
  { productId: 'inverter-x32', top: 44, left: 34, width: 12, height: 11 },
  { productId: 'magnum-12', top: 45, left: 60, width: 25, height: 10 },
  { productId: 'xs-inverter', top: 63, left: 13, width: 20, height: 10 },
  { productId: 'ms-inverter', top: 63, left: 34, width: 21, height: 10 },
  { productId: 'inverter-s', top: 63, left: 56, width: 19, height: 10 },
  { productId: 'magnum-32', top: 63, left: 76, width: 19, height: 10 },
];
