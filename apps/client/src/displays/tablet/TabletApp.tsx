import { useState } from 'react';
import { ScaleViewport } from '../../components/ScaleViewport/ScaleViewport';
import { useIdleReset } from '../../hooks/useIdleReset';
import { useSync } from '../../sync/useSync';
import { Home } from './screens/Home/Home';
import { ProductSelect } from './screens/ProductSelect/ProductSelect';
import { Ranking } from './screens/Ranking/Ranking';
import { Register } from './screens/Register/Register';
import { Settings } from './screens/Settings/Settings';
import { ThankYou } from './screens/ThankYou/ThankYou';
import { EMPTY_SESSION, generateIdempotencyKey, PARTICIPATION_POINTS, type TabletSession } from './session';

const TABLET_DESIGN_WIDTH = 1920;
const TABLET_DESIGN_HEIGHT = 1200;

type TabletScreen = 'home' | 'register' | 'productSelect' | 'thankYou' | 'ranking' | 'settings';

/**
 * Punto de entrada de la tablet. Controla la pantalla activa del flujo
 * Inicio -> Registro -> Seleccion de producto -> Agradecimiento -> Inicio
 * con estado local; no usa sub-rutas porque el modo kiosco no navega con el
 * historial del navegador.
 */
export function TabletApp() {
  const [screen, setScreen] = useState<TabletScreen>('home');
  const [screenBeforeSettings, setScreenBeforeSettings] = useState<TabletScreen>('home');
  const [session, setSession] = useState<TabletSession>(EMPTY_SESSION);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const { send } = useSync('tablet');

  const goHome = () => {
    setScreen('home');
    setSession(EMPTY_SESSION);
    setSelectedProductId(null);
  };

  useIdleReset(() => {
    if (screen === 'home' || screen === 'settings') return;
    send({ type: 'SESSION_END', ts: Date.now() });
    goHome();
  });

  const openSettings = () => {
    setScreenBeforeSettings(screen);
    setScreen('settings');
  };

  return (
    <ScaleViewport designWidth={TABLET_DESIGN_WIDTH} designHeight={TABLET_DESIGN_HEIGHT}>
      {screen === 'home' && (
        <Home
          onStart={() => {
            send({ type: 'SESSION_START', ts: Date.now() });
            setScreen('register');
          }}
          onOpenSettings={openSettings}
        />
      )}

      {screen === 'register' && (
        <Register
          onComplete={(nextSession) => {
            setSession(nextSession);
            setScreen('productSelect');
          }}
        />
      )}

      {screen === 'productSelect' && (
        <ProductSelect
          selectedProductId={selectedProductId}
          onPreview={(productId) => {
            setSelectedProductId(productId);
            send({ type: 'PRODUCT_PREVIEW', productId, ts: Date.now() });
          }}
          onConfirm={(productId) => {
            send({ type: 'PRODUCT_SELECTED', productId, ts: Date.now() });
            setScreen('thankYou');
          }}
        />
      )}

      {screen === 'thankYou' && (
        <ThankYou
          name={session.name}
          onFinish={() => {
            // El resultado de la sesion viaja aparte de los eventos de UI del
            // pitch: el sync-server lo encola hacia el data hub y la DB de
            // rankings (Fase 7), nunca hacia la pantalla del pitch.
            send({
              type: 'PARTICIPATION_RESULT',
              ts: Date.now(),
              idempotencyKey: generateIdempotencyKey(),
              name: session.name,
              email: session.email,
              code: session.code,
              productId: selectedProductId,
              points: PARTICIPATION_POINTS,
            });
            setScreen('ranking');
          }}
        />
      )}

      {screen === 'ranking' && (
        <Ranking
          onFinish={() => {
            send({ type: 'SESSION_END', ts: Date.now() });
            goHome();
          }}
        />
      )}

      {screen === 'settings' && <Settings onClose={() => setScreen(screenBeforeSettings)} />}
    </ScaleViewport>
  );
}
