import { useRef } from 'react';
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from 'react';
import styles from './SevenKnob.module.css';

export type KnobMode = 'warm' | 'cool';

export interface SevenKnobProps {
  /** Knob value in the range `0..1`. */
  value: number;
  /** Called when turning the knob, with the new clamped value. */
  onChange: (value: number) => void;
  /** Whether the knob is powered (lit). */
  on: boolean;
  /** Called on a press (a tap without turning). */
  onToggle: () => void;
  /** Colour ramp: `warm` (green / yellow/ red); `cool` (blue / pink / red). */
  mode?: KnobMode;
  className?: string;
}

type Triple = readonly [number, number, number];

const MODES: Record<KnobMode, readonly [Triple, Triple, Triple]> = {
  warm: [
    [90, 210, 100],
    [250, 225, 60],
    [235, 60, 45],
  ],
  cool: [
    [80, 150, 255],
    [255, 120, 215],
    [235, 60, 80],
  ],
};

/** Total pointer travel (px) below which a drag counts as a press. */
const TAP_PX = 4;
/** Value change per pixel of vertical drag (down lowers, up raises). */
const DRAG_GAIN = 0.003;
/** Value step per wheel notch. */
const WHEEL_GAIN = 0.02;

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function mix(a: Triple, b: Triple, t: number): Triple {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/** Interpolate the mode's three stops by `value` (clamped to `0..1`). */
function colorAt(value: number, mode: KnobMode): Triple {
  const [low, mid, high] = MODES[mode];
  const t = clamp01(value);
  return t < 0.5 ? mix(low, mid, t * 2) : mix(mid, high, (t - 0.5) * 2);
}

function rgb([r, g, b]: Triple): string {
  return `rgb(${r}, ${g}, ${b})`;
}

/** Push a colour away from grey and darken it for a more intense version. */
function deepen([r, g, b]: Triple): Triple {
  const avg = (r + g + b) / 3;
  const k = 0.85; // saturation push
  const d = 0.9; // darken
  return [
    Math.min(255, Math.max(0, Math.round((r + (r - avg) * k) * d))),
    Math.min(255, Math.max(0, Math.round((g + (g - avg) * k) * d))),
    Math.min(255, Math.max(0, Math.round((b + (b - avg) * k) * d))),
  ];
}

interface DragState {
  active: boolean;
  val: number;
  travel: number;
  lastX: number;
  lastY: number;
}

/** A Crumar-style knob: press to toggle, turn as an endless encoder. */
export function SevenKnob({
  value,
  onChange,
  on,
  onToggle,
  mode = 'warm',
  className,
}: SevenKnobProps) {
  const drag = useRef<DragState>({
    active: false,
    val: 0,
    travel: 0,
    lastX: 0,
    lastY: 0,
  });

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      active: true,
      val: value,
      travel: 0,
      lastX: e.clientX,
      lastY: e.clientY,
    };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    d.travel += Math.abs(dx) + Math.abs(dy);
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    if (!on) return; // only turns when active
    d.val = clamp01(d.val + dy * DRAG_GAIN);
    onChange(d.val);
  }

  function onPointerUp() {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (d.travel < TAP_PX) onToggle();
  }

  function onWheel(e: ReactWheelEvent<HTMLDivElement>) {
    if (!on) return;
    onChange(clamp01(value - Math.sign(e.deltaY) * WHEEL_GAIN));
  }

  const led = colorAt(value, mode);
  const core: Triple = [
    Math.min(led[0] + 90, 255),
    Math.min(led[1] + 90, 255),
    Math.min(led[2] + 90, 255),
  ];
  const style = {
    '--main-color': rgb(led),
    '--core-color': rgb(core),
    '--deep-color': rgb(deepen(led)),
  } as CSSProperties;
  const cls = [styles.knob, on ? styles.on : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cls}
      style={style}
      role="slider"
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      <span className={styles.dark} />
      <span className={styles.mirror} />
      <span className={styles.reflection} />
      <span className={styles.screw} />
      <span className={styles.led} />
      <span className={styles['support-back']} />
      <span className={styles['support-front']} />
      <span className={styles['cap-back']} />
      <span className={styles['cap-middle']} />
      <span className={styles['cap-front']} />
      <span className={styles.glow} />
    </div>
  );
}
