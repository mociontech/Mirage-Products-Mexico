import { products } from '../../../../content/products';

/**
 * Posiciones absolutas (px, lienzo 1920x1200) leidas del metadata real de
 * Figma (node 591:446, "03_Pantalla seleccion_productos" - version vigente,
 * reemplaza al node 526:946 usado en una iteracion anterior: el cliente
 * reordeno/reajusto las tarjetas). get_metadata da x/y/width/height exactos
 * por nodo, sin pasar por porcentajes de inset. 3 filas de 4 columnas -
 * ya NO son todas del mismo ancho/alto (antes 370x252 uniforme, ahora cada
 * tarjeta trae su propio tamano) - fila 1 y fila 3 sobre fondo blanco, fila
 * 2 sobre la franja roja horizontal (ver ProductSelect.tsx#productCards).
 *
 * xs-inverter e inverter-x intercambiaron de columna en la fila 2 respecto
 * a la version anterior (526:946) - el resto del orden se mantuvo igual.
 *
 * Los nombres de los assets de Figma para los 2 aires de ventana
 * ("VENTANA 1" / "VENTANA 2") siguen siendo la fuente confiable para saber
 * cual va en cada columna - el file trae un texto suelto "2 tonelada" mal
 * anidado dentro del grupo del logo de VENTANA 1 (mismo resto de
 * copia/pega de la version anterior), se ignoro a favor del nombre del
 * asset de foto.
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
    photo: { x: 49, y: 280, width: 347, height: 122 },
    logo: { x: 111, y: 168, width: 247, height: 44 },
  },
  {
    productId: 'x-life',
    photo: { x: 521, y: 270, width: 365, height: 143 },
    logo: { x: 607, y: 159, width: 205, height: 76 },
  },
  {
    productId: 'aire-ventana-1-ton',
    photo: { x: 1045, y: 242, width: 234, height: 161 },
    logo: { x: 1078, y: 167, width: 176, height: 70 },
    capacityLabel: { text: '1 tonelada', x: 1143, y: 275 },
  },
  {
    productId: 'aire-ventana-2-ton',
    photo: { x: 1567, y: 242, width: 206, height: 174 },
    logo: { x: 1581, y: 167, width: 175, height: 71 },
    capacityLabel: { text: '2 tonelada', x: 1608, y: 223 },
  },
  {
    productId: 'xs-inverter',
    photo: { x: 46, y: 592, width: 361, height: 162 },
    logo: { x: 167, y: 530, width: 116, height: 60 },
  },
  {
    productId: 'neo-inverter',
    photo: { x: 526, y: 596, width: 368, height: 148 },
    logo: { x: 633, y: 546, width: 143, height: 40 },
  },
  {
    productId: 'inverter-x',
    photo: { x: 1005, y: 605, width: 369, height: 128 },
    logo: { x: 1097, y: 541, width: 187, height: 46 },
  },
  {
    productId: 'x5-convencional',
    photo: { x: 1467, y: 592, width: 358, height: 162 },
    logo: { x: 1588, y: 532, width: 116, height: 60 },
  },
  {
    productId: 'flex-inverter',
    photo: { x: 34, y: 910, width: 373, height: 159 },
    logo: { x: 155, y: 848, width: 145, height: 59 },
  },
  {
    productId: 'inverter-x32',
    photo: { x: 453, y: 910, width: 365, height: 169 },
    logo: { x: 569, y: 850, width: 135, height: 55 },
  },
  {
    productId: 'magnum-22',
    photo: { x: 878, y: 919, width: 356, height: 140 },
    logo: { x: 917, y: 852, width: 279, height: 55 },
  },
  {
    productId: 'magnum-18',
    photo: { x: 1293, y: 931, width: 550, height: 158 },
    logo: { x: 1430, y: 855, width: 276, height: 57 },
  },
];

/**
 * Tarjeta (fondo redondeado con degradado + sombra) detras de cada tile.
 * Ya NO son todas 370x252 - cada fila (y cada columna dentro de la fila)
 * trae su propio tamano segun Figma. Fila 1 y 3: blanco. Fila 2 (sobre la
 * franja roja): rojo, mismo degradado que la franja lateral de Colombia.
 * radius 33px, shadow 0px 4px 4px rgba(0,0,0,0.09) en las 12.
 */
export interface CardRect extends Rect {
  variant: 'light' | 'red';
}

export const productCards: Record<string, CardRect> = {
  'life-12-plus': { x: 30, y: 141, width: 389, height: 288, variant: 'light' },
  'x-life': { x: 515, y: 141, width: 383, height: 288, variant: 'light' },
  'aire-ventana-1-ton': { x: 982, y: 141, width: 370, height: 288, variant: 'light' },
  'aire-ventana-2-ton': { x: 1484, y: 141, width: 370, height: 288, variant: 'light' },
  'xs-inverter': { x: 30, y: 520, width: 393, height: 241, variant: 'red' },
  'neo-inverter': { x: 505, y: 520, width: 404, height: 241, variant: 'red' },
  'inverter-x': { x: 984, y: 520, width: 402, height: 241, variant: 'red' },
  'x5-convencional': { x: 1454, y: 520, width: 389, height: 241, variant: 'red' },
  'flex-inverter': { x: 39, y: 838, width: 376, height: 278, variant: 'light' },
  'inverter-x32': { x: 446, y: 838, width: 382, height: 278, variant: 'light' },
  'magnum-22': { x: 865, y: 838, width: 380, height: 278, variant: 'light' },
  'magnum-18': { x: 1275, y: 838, width: 586, height: 278, variant: 'light' },
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
