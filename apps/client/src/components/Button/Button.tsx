import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

/** Boton solido (primario) o con borde (secundario), tokens del UI kit. */
export function Button({ variant = 'primary', className, type = 'button', ...rest }: ButtonProps) {
  const variantClass = variant === 'primary' ? styles.primary : styles.secondary;
  return <button type={type} className={`${styles.button} ${variantClass} ${className ?? ''}`} {...rest} />;
}
