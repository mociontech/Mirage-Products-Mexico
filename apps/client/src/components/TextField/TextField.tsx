import type { InputHTMLAttributes } from 'react';
import styles from './TextField.module.css';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement>;

/** Campo de formulario en pildora, como Nombre/Empresa/Celular en Registro. */
export function TextField({ className, ...rest }: TextFieldProps) {
  return <input className={`${styles.field} ${className ?? ''}`} {...rest} />;
}
