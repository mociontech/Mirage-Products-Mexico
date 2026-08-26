import { useState } from 'react';
import { ScaleViewport } from '../../components/ScaleViewport/ScaleViewport';
import { Idle } from './states/Idle/Idle';
import { Attract } from './states/Attract/Attract';
import { ProductContent } from './states/ProductContent/ProductContent';

const PITCH_DESIGN_WIDTH = 2147;
const PITCH_DESIGN_HEIGHT = 4224;

type PitchState = 'idle' | 'attract' | 'productContent';

/**
 * Punto de entrada de la pantalla de pitch. IDLE es el estado inicial y el
 * fallback universal ante error, timeout o desconexion (ver watchdog en
 * useSync, Fase 2/5).
 */
export function PitchApp() {
  const [state] = useState<PitchState>('idle');

  return (
    <div className="hide-cursor" style={{ width: '100%', height: '100%' }}>
      <ScaleViewport designWidth={PITCH_DESIGN_WIDTH} designHeight={PITCH_DESIGN_HEIGHT}>
        {state === 'idle' && <Idle />}
        {state === 'attract' && <Attract />}
        {state === 'productContent' && <ProductContent />}
      </ScaleViewport>
    </div>
  );
}
