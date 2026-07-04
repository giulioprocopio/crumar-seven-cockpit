import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'default' | 'primary';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

/** A push button. Extends all native button attributes. */
export function Button({
  variant = 'default',
  className,
  children,
  ...props
}: ButtonProps) {
  const cls = [
    styles.root,
    variant === 'primary' ? styles.primary : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
