import type { Param } from '@crumar-seven-cockpit/core';
import { Knob } from '../components/Knob.js';
import { Toggle } from '../components/Toggle.js';
import { Select } from '../components/Select.js';

export interface ParamControlProps {
  param: Param;
  value: number;
  onChange: (id: string, value: number) => void;
}

/**
 * Pick the widget for a parameter: dropdown for enums, switch for booleans,
 * else a knob.
 */
export function ParamControl({ param, value, onChange }: ParamControlProps) {
  if (param.options && param.options.length > 0) {
    return (
      <Select
        value={value}
        options={param.options}
        onChange={(v) => onChange(param.id, v)}
      />
    );
  }
  if (param.min === 0 && param.max === 1) {
    return (
      <Toggle
        value={value >= 1}
        onChange={(on) => onChange(param.id, on ? 1 : 0)}
      />
    );
  }
  return (
    <Knob
      value={value}
      min={param.min}
      max={param.max}
      onChange={(v) => onChange(param.id, v)}
    />
  );
}
