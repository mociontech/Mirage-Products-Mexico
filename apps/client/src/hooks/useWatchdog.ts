import { useEffect, useRef } from 'react';

const DEFAULT_TIMEOUT_MS = 90_000;

/**
 * Si el pitch no recibe evento ni heartbeat en timeoutMs, vuelve solo a
 * reposo (seccion 4 del brief) - protege contra una tablet caida o una
 * particion de red silenciosa que deje al canal "conectado" sin trafico.
 * signal es cualquier valor que cambie con cada evento entrante (p.ej. una
 * referencia al ultimo evento recibido).
 */
export function useWatchdog(signal: unknown, onTimeout: () => void, timeoutMs: number = DEFAULT_TIMEOUT_MS): void {
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  });

  useEffect(() => {
    const timer = setTimeout(() => onTimeoutRef.current(), timeoutMs);
    return () => clearTimeout(timer);
  }, [signal, timeoutMs]);
}
