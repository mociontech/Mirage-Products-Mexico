import { useEffect, useState } from 'react';
import { ScaleViewport } from '../../components/ScaleViewport/ScaleViewport';
import { getProductById, products } from '../../content/products';
import { useWatchdog } from '../../hooks/useWatchdog';
import { useSync } from '../../sync/useSync';
import styles from './PitchApp.module.css';
import { persistPitchState, readPersistedPitchState, type PitchScreenState } from './pitchStateStorage';
import { Attract } from './states/Attract/Attract';
import { Idle } from './states/Idle/Idle';
import { ProductContent } from './states/ProductContent/ProductContent';

const PITCH_DESIGN_WIDTH = 2147;
const PITCH_DESIGN_HEIGHT = 4224;

/**
 * Punto de entrada de la pantalla de pitch. IDLE es el estado inicial y el
 * fallback universal ante error, timeout o desconexion: lo maneja el
 * watchdog (90s sin evento/heartbeat) ademas de los eventos SESSION_END y
 * RESET_IDLE. Las tres capas quedan siempre montadas y solo cambian de
 * opacity, para que el video de IDLE nunca se recargue.
 */
export function PitchApp() {
  const [state, setState] = useState<PitchScreenState>(() => readPersistedPitchState().state);
  const [productId, setProductId] = useState<string | null>(() => readPersistedPitchState().productId);
  const { lastEvent } = useSync('pitch');

  useEffect(() => {
    persistPitchState({ state, productId });
  }, [state, productId]);

  // Precarga (fetch + decode) los 12 banners de producto apenas monta la
  // pitch, mientras esta en IDLE - antes cada uno se pedia recien al
  // tocarlo en la tablet, y el fade de ProductContent (260ms) casi nunca
  // le alcanzaba a la imagen para llegar a tiempo: se veia el banner
  // aparecer a medias o en blanco un instante. Con esto ya estan en cache
  // del navegador para cuando el visitante empieza a explorar.
  useEffect(() => {
    for (const p of products) {
      const img = new Image();
      img.src = p.pitchImage;
      // decode() fuerza el decode real del bitmap (no solo la descarga de
      // bytes) para que quede listo para pintar sin costo la primera vez
      // que un <img> use esta misma URL - decode() puede no existir en
      // navegadores viejos, de ahi el optional chaining + catch mudo (no
      // es fatal, solo se pierde el adelanto).
      img.decode?.().catch(() => {});
    }
  }, []);

  useWatchdog(lastEvent, () => {
    setState('idle');
    setProductId(null);
  });

  useEffect(() => {
    if (!lastEvent) return;

    switch (lastEvent.type) {
      case 'STATE_SYNC':
        if (lastEvent.state.status === 'active') {
          setProductId(lastEvent.state.productId);
          setState(lastEvent.state.productId ? 'productContent' : 'attract');
        } else {
          setState('idle');
          setProductId(null);
        }
        break;
      case 'SESSION_START':
        setState('attract');
        setProductId(null);
        break;
      case 'PRODUCT_PREVIEW':
      case 'PRODUCT_SELECTED':
        setProductId(lastEvent.productId);
        setState('productContent');
        break;
      case 'SESSION_END':
      case 'RESET_IDLE':
        setState('idle');
        setProductId(null);
        break;
      case 'HELLO':
      case 'HEARTBEAT':
        break;
    }
  }, [lastEvent]);

  const product = productId ? getProductById(productId) : undefined;
  // Un productId desconocido (catalogo desincronizado, id viejo en
  // sessionStorage) nunca debe dejar las tres capas en opacity 0 - cae a
  // IDLE en vez de una pantalla en blanco.
  const effectiveState: PitchScreenState = state === 'productContent' && !product ? 'idle' : state;

  return (
    <div className="hide-cursor" style={{ width: '100%', height: '100%' }}>
      <ScaleViewport designWidth={PITCH_DESIGN_WIDTH} designHeight={PITCH_DESIGN_HEIGHT}>
        <div className={styles.stack}>
          <div className={styles.layer} style={{ opacity: effectiveState === 'idle' ? 1 : 0 }}>
            <Idle />
          </div>
          <div className={styles.layer} style={{ opacity: effectiveState === 'attract' ? 1 : 0 }}>
            <Attract />
          </div>
          <div className={styles.layer} style={{ opacity: effectiveState === 'productContent' && product ? 1 : 0 }}>
            {product && <ProductContent product={product} />}
          </div>
        </div>
      </ScaleViewport>
    </div>
  );
}
