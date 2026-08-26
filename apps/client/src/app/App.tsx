import { BrowserRouter } from 'react-router-dom';
import { useKioskGuards } from '../hooks/useKioskGuards';
import { AppRoutes } from './routes';

export function App() {
  useKioskGuards();

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
