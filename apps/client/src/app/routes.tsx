import { Navigate, Route, Routes } from 'react-router-dom';
import { SyncDebugPage } from '../debug/SyncDebugPage';
import { TabletApp } from '../displays/tablet/TabletApp';
import { PitchApp } from '../displays/pitch/PitchApp';

/**
 * /tablet y /pitch son puntos de entrada independientes: la tablet (APK) y
 * el equipo del pitch nunca cargan la misma ruta ni comparten navegacion.
 * /debug/sync es una herramienta interna para validar el sync-server, no
 * parte del flujo real.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/tablet" element={<TabletApp />} />
      <Route path="/pitch" element={<PitchApp />} />
      <Route path="/debug/sync" element={<SyncDebugPage />} />
      <Route path="/" element={<Navigate to="/tablet" replace />} />
    </Routes>
  );
}
