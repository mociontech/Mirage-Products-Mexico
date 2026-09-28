/**
 * 'loop' es la pantalla de reposo normal (video ACAIRE en loop) cuando no
 * hay sesion activa. 'idle' quedo reservado solo para el fallback de
 * error/timeout/desconexion del watchdog - ya no es el estado de reposo
 * por defecto (ver PitchApp.tsx).
 */
export type PitchScreenState = 'idle' | 'loop' | 'attract' | 'productContent';

interface PersistedPitchState {
  state: PitchScreenState;
  productId: string | null;
}

const STORAGE_KEY = 'mirage:pitch:state';
const DEFAULT_STATE: PersistedPitchState = { state: 'loop', productId: null };

/**
 * El pitch persiste su ultimo estado en sessionStorage para sobrevivir a un
 * refresh sin parpadear (seccion 4 del brief) - antes de que llegue el
 * STATE_SYNC del servidor, ya sabemos que mostrar.
 */
export function readPersistedPitchState(): PersistedPitchState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedPitchState) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function persistPitchState(next: PersistedPitchState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // sessionStorage puede no estar disponible (modo privado); no es critico.
  }
}
