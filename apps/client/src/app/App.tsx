import { BrowserRouter } from 'react-router-dom';
import { FullscreenToggle } from '../components/FullscreenToggle/FullscreenToggle';
import { useKioskGuards } from '../hooks/useKioskGuards';
import { AppRoutes } from './routes';

export function App() {
  useKioskGuards();

  return (
    <BrowserRouter>
      <AppRoutes />
      <FullscreenToggle />
    </BrowserRouter>
  );
}
