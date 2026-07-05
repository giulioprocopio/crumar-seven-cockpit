import styles from './Toggle.module.css';

export interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}

/** An on/off switch bound to a boolean parameter. */
export function Toggle({ value, onChange, className }: ToggleProps) {
  const cls = [styles.root, value ? styles.on : '', className].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      className={cls}
      onClick={() => onChange(!value)}
    >
      <span className={styles.knob} />
    </button>
  );
}
