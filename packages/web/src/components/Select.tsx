import { useRef, useLayoutEffect, useState } from 'react';
import type { ParamOption } from '@crumar-seven-cockpit/core';
import styles from './Select.module.css';

export interface SelectProps {
  value: number;
  options: ParamOption[];
  onChange: (value: number) => void;
  disabled?: boolean;
}

interface IndicatorRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** A segmented control with a sliding selection indicator. */
export function Select({ value, options, onChange, disabled }: SelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<IndicatorRect | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) return;
    setIndicator({
      left: active.offsetLeft,
      top: active.offsetTop,
      width: active.offsetWidth,
      height: active.offsetHeight,
    });
  }, [value, options]);

  return (
    <div ref={containerRef} className={styles.select}>
      {indicator && (
        <span
          className={styles.indicator}
          style={{
            transform: `translate(${indicator.left}px, ${indicator.top}px)`,
            width: indicator.width,
            height: indicator.height,
          }}
        />
      )}
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          data-active={option.value === value}
          className={[
            styles.option,
            option.value === value ? styles.active : '',
          ]
            .filter(Boolean)
            .join(' ')}
          disabled={disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
