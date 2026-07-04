import type { ParamOption } from '@crumar-seven-cockpit/core';
import styles from './Select.module.css';

export interface SelectProps {
  value: number;
  options: ParamOption[];
  onChange: (value: number) => void;
}

/** A dropdown bound to an enumerated parameter. */
export function Select({ value, options, onChange }: SelectProps) {
  return (
    <div className={styles['control-select']}>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
