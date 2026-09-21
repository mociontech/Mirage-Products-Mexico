import { products } from '../../../../content/products';

/**
 * Posiciones absolutas (px, lienzo 1920x1200) leidas directo del frame de
 * Figma "03_Pantalla seleccion_productos" (node 224:2810) - el layout final
 * con la franja roja al medio. Las otras dos pantallas de distribucion que
 * existen en Figma NO son el layout final, solo se usaron de referencia para
 * saber que va debajo de los nombres.
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProductTile {
  productId: string;
  photo: Rect;
  logo: Rect;
  /** Etiqueta de capacidad opcional (solo los dos aires de ventana). */
  capacityLabel?: { text: string; x: number; y: number };
}

export const productTiles: ProductTile[] = [
  {
    productId: 'life-12-plus',
    photo: { x: 172, y: 301, width: 335, height: 111 },
    logo: { x: 222, y: 217, width: 246.87, height: 44.17 },
  },
  {
    productId: 'x-life',
    photo: { x: 611, y: 290, width: 272, height: 106 },
    logo: { x: 635, y: 205, width: 205.07, height: 75.92 },
  },
  {
    productId: 'aire-ventana-1-ton',
    photo: { x: 1110, y: 295, width: 166.77, height: 114.91 },
    logo: { x: 1099, y: 209, width: 202.2, height: 59.84 },
    capacityLabel: { text: '1 tonelada', x: 1143, y: 275 },
  },
  {
    productId: 'aire-ventana-2-ton',
    photo: { x: 1512, y: 295, width: 144.17, height: 121.92 },
    logo: { x: 1481, y: 208, width: 201.2, height: 59.55 },
    capacityLabel: { text: '2 toneladas', x: 1524, y: 275 },
  },
  {
    productId: 'flex-inverter',
    photo: { x: 335, y: 761, width: 266, height: 113 },
    logo: { x: 383.64, y: 670, width: 222.4, height: 91 },
  },
  {
    productId: 'inverter-x32',
    photo: { x: 807, y: 756, width: 259, height: 120 },
    logo: { x: 823.01, y: 659, width: 204.99, height: 84 },
  },
  {
    productId: 'magnum-22',
    photo: { x: 805, y: 518, width: 274, height: 106 },
    logo: { x: 780, y: 430, width: 347.22, height: 68.73 },
  },
  {
    productId: 'inverter-x',
    photo: { x: 126, y: 911, width: 267, height: 93 },
    logo: { x: 133, y: 1032, width: 284.14, height: 70.63 },
  },
  {
    productId: 'xs-inverter',
    photo: { x: 1090, y: 906, width: 258, height: 116 },
    logo: { x: 1123, y: 1013, width: 177.19, height: 91.45 },
  },
  {
    productId: 'neo-inverter',
    photo: { x: 633, y: 906, width: 275.09, height: 111 },
    logo: { x: 652, y: 1035, width: 217.55, height: 61.37 },
  },
  {
    productId: 'x5-convencional',
    photo: { x: 1529, y: 905, width: 270.04, height: 122 },
    logo: { x: 1560.57, y: 1017, width: 176.43, height: 91.05 },
  },
  {
    productId: 'magnum-18',
    photo: { x: 1261, y: 756, width: 295, height: 85 },
    logo: { x: 1285, y: 673, width: 263.76, height: 54.52 },
  },
];

/** Falla temprano en dev si un producto de products.ts no tiene tile o viceversa. */
if (import.meta.env.DEV) {
  const productIds = new Set(products.map((p) => p.id));
  const tileIds = new Set(productTiles.map((t) => t.productId));
  for (const id of productIds) {
    if (!tileIds.has(id)) console.warn(`[ProductSelect] falta tile para el producto "${id}"`);
  }
  for (const id of tileIds) {
    if (!productIds.has(id)) console.warn(`[ProductSelect] tile "${id}" no tiene producto asociado`);
  }
}
