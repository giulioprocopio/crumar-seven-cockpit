import styles from './Toggle.module.css';

export interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

/** An on/off switch bound to a boolean parameter. */
export function Toggle({ value, onChange }: ToggleProps) {
  const cls = [styles['toggle-switch'], value ? styles.on : '']
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      className={cls}
      onClick={() => onChange(!value)}
    >
      <span className={styles['toggle-knob']} />
    </button>
  );
}
