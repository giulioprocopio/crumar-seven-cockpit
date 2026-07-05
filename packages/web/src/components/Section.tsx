import type { ReactNode } from 'react';
import styles from './Section.module.css';

interface SectionProps {
  children: ReactNode;
  className?: string;
  /** When true, renders no background, border, or padding: content only. */
  bare?: boolean;
}

/** Generic panel shell. Use `bare` to opt out of the box chrome. */
export function Section({ children, className, bare }: SectionProps) {
  const cls = [styles.root, bare ? '' : styles.style, className]
    .filter(Boolean)
    .join(' ');
  return <section className={cls || undefined}>{children}</section>;
}
