import featureInverterTechnology from '../assets/images/feature-inverter-technology.webp';
import placeholderProduct from '../assets/images/placeholder-product.webp';
import magnumInverter22 from '../assets/images/product-magnum-inverter-22.webp';

/**
 * Catalogo de producto. Agregar un producto nuevo es sumar una entrada aqui
 * y soltar sus assets en assets/images - nunca hardcodear contenido de
 * producto en un componente.
 */
export interface Product {
  id: string;
  /** Nombre tal como aparece en el muro fisico del stand. */
  name: string;
  heroImage: string;
  featureLabel: string;
  featureIcon: string;
  description: string;
  /** true mientras no tengamos foto y copy reales de la marca para este producto. */
  isPlaceholder: boolean;
}

const GENERIC_FEATURE = 'Tecnologia Mirage';
const GENERIC_DESCRIPTION = 'Contenido pendiente de la marca para este equipo.';

function placeholderProductEntry(id: string, name: string): Product {
  return {
    id,
    name,
    heroImage: placeholderProduct,
    featureLabel: GENERIC_FEATURE,
    featureIcon: placeholderProduct,
    description: GENERIC_DESCRIPTION,
    isPlaceholder: true,
  };
}

/**
 * 12 productos, en el mismo orden que la foto de referencia del muro fisico
 * (ver assets-manifest.md). Ninguno tiene copy ni foto real todavia salvo
 * "magnum-12": ese usa el unico ejemplo de contenido real que existe en
 * Figma ("Magnum Inverter 22"), cuyo nombre no calza exactamente con la
 * etiqueta "Magnum 12" del muro - inconsistencia ya reportada, pendiente de
 * que la marca confirme cual es el nombre correcto.
 */
export const products: Product[] = [
  placeholderProductEntry('life-12-plus', 'Life 12+'),
  placeholderProductEntry('x-life', 'X Life'),
  placeholderProductEntry('x5-convencional', 'X5 Convencional'),
  placeholderProductEntry('aire-ventana-1-ton', 'Aire de Ventana 1 Ton'),
  placeholderProductEntry('aire-ventana-2-ton', 'Aire de Ventana 2 Ton'),
  placeholderProductEntry('flex-inverter', 'Flex Inverter'),
  placeholderProductEntry('inverter-x32', 'Inverter X32'),
  {
    id: 'magnum-12',
    name: 'Magnum 12',
    heroImage: magnumInverter22,
    featureLabel: 'Tecnologia Inverter',
    featureIcon: featureInverterTechnology,
    description: 'Su funcion de velocidad variable minimiza considerablemente el consumo de energia.',
    isPlaceholder: false,
  },
  placeholderProductEntry('xs-inverter', 'xS Inverter'),
  placeholderProductEntry('ms-inverter', 'M&S Inverter'),
  placeholderProductEntry('inverter-s', 'Inverter S'),
  placeholderProductEntry('magnum-32', 'Magnum 32'),
];

export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}
