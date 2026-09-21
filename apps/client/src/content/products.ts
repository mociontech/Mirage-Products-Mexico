import photoLife12 from '../assets/images/products/photo-life12.webp';
import photoXlife from '../assets/images/products/photo-xlife.webp';
import photoMacc1211n from '../assets/images/products/photo-macc1211n.webp';
import photoMacc2421n from '../assets/images/products/photo-macc2421n.webp';
import photoFlexinverter from '../assets/images/products/photo-flexinverter.webp';
import photoX32 from '../assets/images/products/photo-x32.webp';
import photoM22Colombia from '../assets/images/products/photo-m22colombia.webp';
import photoX5Onoff from '../assets/images/products/photo-x5onoff.webp';
import photoX5Inverter from '../assets/images/products/photo-x5inverter.webp';
import photoInverterx from '../assets/images/products/photo-inverterx.webp';
import photoNeo from '../assets/images/products/photo-neo.webp';
import photoGeneric from '../assets/images/products/photo-generic.webp';

import logoLife12 from '../assets/images/products/logo-life12.svg';
import logoXlife from '../assets/images/products/logo-xlife.svg';
import logoMacc1211n from '../assets/images/products/logo-macc1211n.svg';
import logoMacc2421n from '../assets/images/products/logo-macc2421n.svg';
import logoFlexinverter from '../assets/images/products/logo-flexinverter.svg';
import logoX32 from '../assets/images/products/logo-x32.svg';
import logoM22Colombia from '../assets/images/products/logo-m22colombia.png';
import logoX5Onoff from '../assets/images/products/logo-x5onoff.svg';
import logoX5Inverter from '../assets/images/products/logo-x5inverter.svg';
import logoInverterx from '../assets/images/products/logo-inverterx.svg';
import logoNeo from '../assets/images/products/logo-neo.svg';
import logoGeneric from '../assets/images/products/logo-generic.png';

import pitchLife12 from '../assets/images/pitch/pitch-life12.webp';
import pitchXlife from '../assets/images/pitch/pitch-xlife.webp';
import pitchMacc1211n from '../assets/images/pitch/pitch-macc1211n.webp';
import pitchMacc2421n from '../assets/images/pitch/pitch-macc2421n.webp';
import pitchFlexinverter from '../assets/images/pitch/pitch-flexinverter.webp';
import pitchX32 from '../assets/images/pitch/pitch-x32.webp';
import pitchMagnum22 from '../assets/images/pitch/pitch-magnum22.webp';
import pitchX5Convencional from '../assets/images/pitch/pitch-x5convencional.webp';
import pitchX5Inverter from '../assets/images/pitch/pitch-x5inverter.webp';
import pitchInverterx from '../assets/images/pitch/pitch-inverterx.webp';
import pitchNeo from '../assets/images/pitch/pitch-neo.webp';
import pitchMagnum18 from '../assets/images/pitch/pitch-magnum18.webp';

/**
 * Catalogo de producto. Agregar un producto nuevo es sumar una entrada aqui
 * y soltar sus assets en assets/images - nunca hardcodear contenido de
 * producto en un componente.
 *
 * Las fotos y logos del tile de seleccion vienen del frame de Figma "03_Pantalla
 * seleccion_productos" (node 224:2810). El pitchImage de cada producto viene
 * de las 12 pantallas verticales completas de Figma (nodes 433:368-379,
 * "Productos pantallas vertical_MX-01" a "MX-12"): cada una es un banner ya
 * armado por la marca (logo + foto + copy + iconos de features), asi que el
 * pitch solo necesita mostrar esa imagen completa, sin recomponer el layout.
 */
export interface Product {
  id: string;
  /** Nombre real de marca, confirmado desde el logo exportado de Figma. */
  name: string;
  /** Foto de producto para el tile de seleccion (ProductSelect). */
  tileImage: string;
  /** Logo de marca para el tile de seleccion (ProductSelect). */
  tileLogo: string;
  /** Banner vertical completo (logo + foto + copy + features) para el pitch. */
  pitchImage: string;
}

export const products: Product[] = [
  {
    id: 'life-12-plus',
    name: 'Life 12+',
    tileImage: photoLife12,
    tileLogo: logoLife12,
    pitchImage: pitchLife12,
  },
  {
    id: 'x-life',
    name: 'XLife',
    tileImage: photoXlife,
    tileLogo: logoXlife,
    pitchImage: pitchXlife,
  },
  {
    // El muro fisico y el codigo de modelo dicen "MACC1211N", pero el logo
    // real exportado de Figma es la marca "Blu Efficient".
    id: 'aire-ventana-1-ton',
    name: 'Blu Efficient (1 tonelada)',
    tileImage: photoMacc1211n,
    tileLogo: logoMacc1211n,
    pitchImage: pitchMacc1211n,
  },
  {
    id: 'aire-ventana-2-ton',
    name: 'Blu Efficient (2 toneladas)',
    tileImage: photoMacc2421n,
    tileLogo: logoMacc2421n,
    pitchImage: pitchMacc2421n,
  },
  {
    id: 'flex-inverter',
    name: 'Flex Inverter',
    tileImage: photoFlexinverter,
    tileLogo: logoFlexinverter,
    pitchImage: pitchFlexinverter,
  },
  {
    id: 'inverter-x32',
    name: 'X32',
    tileImage: photoX32,
    tileLogo: logoX32,
    pitchImage: pitchX32,
  },
  {
    // Renombrado de "magnum-12": el muro fisico decia "Magnum 12" pero el
    // logo real exportado de Figma dice "Magnum Inverter 22" - inconsistencia
    // ya reportada, se deja el nombre real confirmado por el asset.
    id: 'magnum-22',
    name: 'Magnum Inverter 22',
    tileImage: photoM22Colombia,
    tileLogo: logoM22Colombia,
    pitchImage: pitchMagnum22,
  },
  {
    id: 'x5-convencional',
    name: 'X5',
    tileImage: photoX5Onoff,
    tileLogo: logoX5Onoff,
    pitchImage: pitchX5Convencional,
  },
  {
    id: 'xs-inverter',
    name: 'X5 Inverter',
    tileImage: photoX5Inverter,
    tileLogo: logoX5Inverter,
    pitchImage: pitchX5Inverter,
  },
  {
    // Renombrado de "inverter-s": el layer de Figma y el logo exportado
    // confirman "Inverter X" (no "Inverter S").
    id: 'inverter-x',
    name: 'Inverter X',
    tileImage: photoInverterx,
    tileLogo: logoInverterx,
    pitchImage: pitchInverterx,
  },
  {
    // Renombrado de "ms-inverter": el logo exportado confirma "Neo Inverter"
    // (no "M&S Inverter").
    id: 'neo-inverter',
    name: 'Neo Inverter',
    tileImage: photoNeo,
    tileLogo: logoNeo,
    pitchImage: pitchNeo,
  },
  {
    // Renombrado de "magnum-32": este logo no tenia etiqueta clara en el
    // muro fisico; el asset exportado de Figma dice "Magnum Inverter 18".
    // Igual que con Magnum 22, se prioriza el nombre leido del logo real.
    id: 'magnum-18',
    name: 'Magnum Inverter 18',
    tileImage: photoGeneric,
    tileLogo: logoGeneric,
    pitchImage: pitchMagnum18,
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}
