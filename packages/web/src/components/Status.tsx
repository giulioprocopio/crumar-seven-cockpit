import styles from './Status.module.css';

export type StatusVariant = 'idle' | 'pending' | 'active' | 'error';

export interface StatusProps {
  label: string;
  variant: StatusVariant;
  className?: string;
}

/** A status dot and label. The caller maps its own state to a variant. */
export function Status({ label, variant, className }: StatusProps) {
  const dotCls = [styles.dot, variant !== 'idle' ? styles[variant] : '']
    .filter(Boolean)
    .join(' ');
  const cls = [styles.root, className].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <span className={dotCls} />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
