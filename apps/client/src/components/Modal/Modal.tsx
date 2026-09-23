import type { ReactNode } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** Overlay oscuro a pantalla completa + caja de contenido centrada. Un tap en cualquier parte lo cierra. */
export function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
