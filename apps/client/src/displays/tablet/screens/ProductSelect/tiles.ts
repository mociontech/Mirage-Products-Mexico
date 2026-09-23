import { products } from '../../../../content/products';

/**
 * Posiciones absolutas (px, lienzo 1920x1200) leidas del metadata real de
 * Figma (node 526:946, "03_Pantalla seleccion_productos" - version vigente,
 * distinta del node 224:2810 usado en una iteracion anterior de este
 * archivo). get_metadata da x/y/width/height exactos por nodo, sin pasar
 * por porcentajes de inset. 3 filas de 4 columnas: fila 1 y fila 3 sobre
 * fondo blanco, fila 2 sobre la franja roja horizontal (ver
 * ProductSelect.tsx#productCards) - misma agrupacion "Soluciones para tu
 * espacio / Alto rendimiento / Confort para cada proyecto" ya confirmada
 * con el cliente para la version movil.
 *
 * Los nombres de los assets de Figma para los 2 aires de ventana
 * ("VENTANA 1" / "VENTANA 2") son la fuente confiable para saber cual va en
 * cada columna - el file trae un texto suelto "2 tonelada" mal anidado
 * dentro del grupo del logo de VENTANA 1 que parece un resto de copia/pega,
 * se ignoro a favor del nombre del asset de foto.
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
    photo: { x: 148, y: 256, width: 296, height: 104 },
    logo: { x: 173, y: 176, width: 247, height: 44 },
  },
  {
    productId: 'x-life',
    photo: { x: 582, y: 249, width: 298, height: 117 },
    logo: { x: 628, y: 167, width: 205, height: 76 },
  },
  {
    productId: 'aire-ventana-1-ton',
    photo: { x: 1093, y: 263, width: 169, height: 117 },
    logo: { x: 1089, y: 175, width: 176, height: 52 },
    capacityLabel: { text: '1 tonelada', x: 1143, y: 275 },
  },
  {
    productId: 'aire-ventana-2-ton',
    photo: { x: 1550, y: 254, width: 150, height: 126 },
    logo: { x: 1537, y: 175, width: 175, height: 52 },
    capacityLabel: { text: '2 tonelada', x: 1574, y: 230 },
  },
  {
    productId: 'inverter-x',
    photo: { x: 163, y: 620, width: 267, height: 93 },
    logo: { x: 154, y: 518, width: 284, height: 71 },
  },
  {
    productId: 'neo-inverter',
    photo: { x: 593, y: 615, width: 275, height: 111 },
    logo: { x: 622, y: 526, width: 218, height: 61 },
  },
  {
    productId: 'xs-inverter',
    photo: { x: 1050, y: 615, width: 258, height: 116 },
    logo: { x: 1090, y: 515, width: 177, height: 91 },
  },
  {
    productId: 'x5-convencional',
    photo: { x: 1492, y: 614, width: 270, height: 122 },
    logo: { x: 1539, y: 515, width: 176, height: 91 },
  },
  {
    productId: 'flex-inverter',
    photo: { x: 144, y: 971, width: 284, height: 121 },
    logo: { x: 185, y: 872, width: 222, height: 91 },
  },
  {
    productId: 'inverter-x32',
    photo: { x: 610, y: 975, width: 259, height: 120 },
    logo: { x: 629, y: 864, width: 205, height: 84 },
  },
  {
    productId: 'magnum-22',
    photo: { x: 1031, y: 967, width: 295, height: 116 },
    logo: { x: 1025, y: 876, width: 307, height: 61 },
  },
  {
    productId: 'magnum-18',
    photo: { x: 1472, y: 974, width: 305, height: 87 },
    logo: { x: 1473, y: 876, width: 304, height: 63 },
  },
];

/**
 * Tarjeta (fondo redondeado con degradado + sombra) detras de cada tile -
 * antes ausente en la implementacion. Fila 1 y 3: blanco. Fila 2 (sobre la
 * franja roja): rojo, mismo degradado que la franja lateral de Colombia.
 * radius 33px, shadow 0px 4px 4px rgba(0,0,0,0.09) en las 12.
 */
export interface CardRect extends Rect {
  variant: 'light' | 'red';
}

export const productCards: Record<string, CardRect> = {
  'life-12-plus': { x: 111, y: 149, width: 370, height: 252, variant: 'light' },
  'x-life': { x: 546, y: 149, width: 370, height: 252, variant: 'light' },
  'aire-ventana-1-ton': { x: 993, y: 149, width: 370, height: 252, variant: 'light' },
  'aire-ventana-2-ton': { x: 1440, y: 149, width: 370, height: 252, variant: 'light' },
  'inverter-x': { x: 111, y: 499, width: 370, height: 252, variant: 'red' },
  'neo-inverter': { x: 546, y: 499, width: 370, height: 252, variant: 'red' },
  'xs-inverter': { x: 993, y: 499, width: 370, height: 252, variant: 'red' },
  'x5-convencional': { x: 1440, y: 499, width: 370, height: 252, variant: 'red' },
  'flex-inverter': { x: 111, y: 849, width: 370, height: 252, variant: 'light' },
  'inverter-x32': { x: 546, y: 849, width: 370, height: 252, variant: 'light' },
  'magnum-22': { x: 993, y: 849, width: 370, height: 252, variant: 'light' },
  'magnum-18': { x: 1440, y: 849, width: 370, height: 252, variant: 'light' },
};

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
