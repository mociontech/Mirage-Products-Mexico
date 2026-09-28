import { VideoLayer, type VideoSource } from '../../../../components/VideoLayer/VideoLayer';
import attractLogoLoop from '../../../../assets/video/attract-logo-loop.mp4';

/**
 * Transicion breve entre IDLE/Loop y el contenido de producto, mientras el
 * usuario recien empieza en la tablet y todavia no toca ningun producto.
 * Antes era un logo + texto estatico ("Bienvenido, explora el catalogo");
 * ahora es el loop de video del logo que dio el cliente. No hay pantalla
 * propia en Figma para este estado (ver Fase 0).
 */
const SOURCES: VideoSource[] = [{ id: 'attract', src: attractLogoLoop }];

export function Attract() {
  return <VideoLayer sources={SOURCES} activeId="attract" />;
}
