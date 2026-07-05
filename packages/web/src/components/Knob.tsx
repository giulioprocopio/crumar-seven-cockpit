import { useRef, type PointerEvent, type WheelEvent } from 'react';
import styles from './Knob.module.css';

export interface KnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  unit?: string;
  className?: string;
}

/** Total rotation arc in degrees, centred at 12 o'clock. */
const SWEEP_DEG = 270;
/** Angle of the minimum-value position, measured from 12 o'clock (degrees). */
const START_DEG = -(SWEEP_DEG / 2);
/** Pixels of upward drag that span the full parameter range. */
const DRAG_PX = 150;
/** Speed multiplier applied while the shift key is held (fine-adjust mode). */
const FINE_SPEED = 0.25;
/** Value steps per wheel notch. */
const WHEEL_STEP = 1;

/** SVG viewport centre and geometry (all in user units). */
const CX = 24;
const CY = 24;
const FACE_R = 20;
const ARM = 15;

/** A rotary control bound to a numeric parameter. */
export function Knob({ value, min, max, onChange, unit, className }: KnobProps) {
  const drag = useRef<{ startY: number; startValue: number } | null>(null);

  const range = max - min || 1;
  const fraction = (value - min) / range;
  const angle = START_DEG + fraction * SWEEP_DEG;
  const radians = (angle * Math.PI) / 180;
  const clamp = (v: number) => Math.max(min, Math.min(max, Math.round(v)));

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, startValue: value };
  };

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    const dy = d.startY - e.clientY;
    const speed = e.shiftKey ? FINE_SPEED : 1;
    onChange(clamp(d.startValue + (dy / DRAG_PX) * range * speed));
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  const onWheel = (e: WheelEvent<SVGSVGElement>) => {
    onChange(clamp(value - Math.sign(e.deltaY) * WHEEL_STEP));
  };

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <svg
        className={styles.dial}
        viewBox={`0 0 ${CX * 2} ${CY * 2}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      >
        <circle className={styles.face} cx={CX} cy={CY} r={FACE_R} />
        <line
          className={styles.pointer}
          x1={CX}
          y1={CY}
          x2={CX + ARM * Math.sin(radians)}
          y2={CY - ARM * Math.cos(radians)}
        />
      </svg>
      <div className={styles.value}>
        {value}
        {unit ? <span className={styles.unit}> {unit}</span> : null}
      </div>
    </div>
  );
}
