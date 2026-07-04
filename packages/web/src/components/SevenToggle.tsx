import styles from './SevenToggle.module.css';

export interface SevenToggleProps {
  /** Boolean toggle value. */
  value: boolean;
  /** Called when the toggle is pressed, with the new value. */
  onChange: (value: boolean) => void;
  className?: string;
}

/** A Crumar-style led button. */
export function SevenToggle({ value, onChange, className }: SevenToggleProps) {
  const cls = [styles.toggle, value ? styles.on : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  return (
    <button
      type="button"
      role="switch"
      aria-pressed={value}
      className={cls}
      onClick={() => onChange(!value)}
    >
      <span className={styles.led} />
      <span className={styles.cap} />
    </button>
  );
}
