import { useState } from 'react';
import { ScaleViewport } from '../../components/ScaleViewport/ScaleViewport';
import { Home } from './screens/Home/Home';
import { Register } from './screens/Register/Register';
import { ProductSelect } from './screens/ProductSelect/ProductSelect';
import { ThankYou } from './screens/ThankYou/ThankYou';
import { Settings } from './screens/Settings/Settings';

const TABLET_DESIGN_WIDTH = 1920;
const TABLET_DESIGN_HEIGHT = 1200;

type TabletScreen = 'home' | 'register' | 'productSelect' | 'thankYou' | 'settings';

/**
 * Punto de entrada de la tablet. Controla la pantalla activa del flujo
 * Inicio -> Registro -> Seleccion de producto -> Agradecimiento -> Inicio
 * con estado local; no usa sub-rutas porque el modo kiosco no navega con el
 * historial del navegador.
 */
export function TabletApp() {
  const [screen] = useState<TabletScreen>('home');

  return (
    <ScaleViewport designWidth={TABLET_DESIGN_WIDTH} designHeight={TABLET_DESIGN_HEIGHT}>
      {screen === 'home' && <Home />}
      {screen === 'register' && <Register />}
      {screen === 'productSelect' && <ProductSelect />}
      {screen === 'thankYou' && <ThankYou />}
      {screen === 'settings' && <Settings />}
    </ScaleViewport>
  );
}
