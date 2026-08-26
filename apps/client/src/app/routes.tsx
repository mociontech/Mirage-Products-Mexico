import { Navigate, Route, Routes } from 'react-router-dom';
import { TabletApp } from '../displays/tablet/TabletApp';
import { PitchApp } from '../displays/pitch/PitchApp';

/**
 * /tablet y /pitch son puntos de entrada independientes: la tablet (APK) y
 * el equipo del pitch nunca cargan la misma ruta ni comparten navegacion.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/tablet" element={<TabletApp />} />
      <Route path="/pitch" element={<PitchApp />} />
      <Route path="/" element={<Navigate to="/tablet" replace />} />
    </Routes>
  );
}
