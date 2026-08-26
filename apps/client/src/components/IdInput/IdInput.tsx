import { useRef, type KeyboardEvent } from 'react';
import styles from './IdInput.module.css';

const GROUP_LENGTH = 3;

interface IdInputProps {
  /** Codigo completo, hasta 6 digitos (ej. "128207"). */
  value: string;
  onChange: (value: string) => void;
  /** Se dispara cuando el codigo llega a 6 digitos. */
  onComplete?: (value: string) => void;
  /** true para solo mostrar un codigo ya generado (pantalla de confirmacion). */
  readOnly?: boolean;
}

function onlyDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

/**
 * Entrada de CODIGO ID en dos grupos de 3 digitos (ej. 128-207), como en la
 * pantalla de Figma. Usa inputs numericos nativos para que el teclado del
 * sistema aparezca solo - no se replica un teclado a mano.
 */
export function IdInput({ value, onChange, onComplete, readOnly = false }: IdInputProps) {
  const firstRef = useRef<HTMLInputElement>(null);
  const secondRef = useRef<HTMLInputElement>(null);
  const firstGroup = value.slice(0, GROUP_LENGTH);
  const secondGroup = value.slice(GROUP_LENGTH, GROUP_LENGTH * 2);

  const handleFirstChange = (raw: string) => {
    const digits = onlyDigits(raw).slice(0, GROUP_LENGTH);
    const next = digits + secondGroup;
    onChange(next);
    if (digits.length === GROUP_LENGTH) {
      secondRef.current?.focus();
    }
  };

  const handleSecondChange = (raw: string) => {
    const digits = onlyDigits(raw).slice(0, GROUP_LENGTH);
    const next = firstGroup + digits;
    onChange(next);
    if (firstGroup.length === GROUP_LENGTH && digits.length === GROUP_LENGTH) {
      onComplete?.(next);
    }
  };

  const handleSecondKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && secondGroup.length === 0) {
      firstRef.current?.focus();
    }
  };

  return (
    <div className={styles.row}>
      <input
        ref={firstRef}
        className={styles.group}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={GROUP_LENGTH}
        value={firstGroup}
        onChange={(event) => handleFirstChange(event.target.value)}
        placeholder="000"
        aria-label="Primeros 3 digitos del codigo"
        readOnly={readOnly}
      />
      <span className={styles.separator}>-</span>
      <input
        ref={secondRef}
        className={styles.group}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={GROUP_LENGTH}
        value={secondGroup}
        onChange={(event) => handleSecondChange(event.target.value)}
        onKeyDown={handleSecondKeyDown}
        placeholder="000"
        aria-label="Ultimos 3 digitos del codigo"
        readOnly={readOnly}
      />
    </div>
  );
}
