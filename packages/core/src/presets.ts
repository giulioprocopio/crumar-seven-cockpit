import type { ParamValues } from './model.js';
import type { Controller } from './controller.js';

/** A stable reference to a sound, resilient to index reordering. */
export interface SoundRef {
  /** Sound name as reported by the instrument. */
  name: string;
  /** Bank hint, if known. */
  bank?: number;
}

/** A saved snapshot of a sound selection and its parameter values. */
export interface Preset {
  name: string;
  sound: SoundRef;
  values: ParamValues;
}

/** Capture the controller's current sound and values as a preset. */
export function snapshot(controller: Controller, name: string): Preset {
  const current = controller.catalog?.sounds.find(
    (s) => s.index === controller.sound,
  );
  return {
    name,
    sound: { name: current?.name ?? '', bank: current?.bank },
    values: { ...controller.values },
  };
}

/** Outcome of applying a preset against a possibly-changed catalog. */
export interface ApplyResult {
  /** Whether the target sound was found and selected. */
  applied: boolean;
  /** Preset param ids not present on the current sound (skipped). */
  skipped: string[];
}

/**
 * Apply a preset, resolving its sound by name against the current catalog so
 * it survives sounds being reordered between sessions. Values whose parameter
 * is no longer present are skipped and reported rather than applied blindly.
 */
export async function applyPreset(
  controller: Controller,
  preset: Preset,
): Promise<ApplyResult> {
  const target = controller.catalog?.sounds.find(
    (s) => s.name === preset.sound.name,
  );
  if (!target) {
    return { applied: false, skipped: [] };
  }

  if (target.index !== controller.sound) {
    await controller.setSound(target.index);
  }

  const catalog = controller.catalog;
  const known = new Set([
    ...(catalog?.soundParams ?? []).map((p) => p.id),
    ...(catalog?.fxParams ?? []).map((p) => p.id),
  ]);

  const skipped: string[] = [];
  for (const [id, value] of Object.entries(preset.values)) {
    if (!known.has(id)) {
      skipped.push(id);
      continue;
    }
    await controller.setParam(id, value);
  }
  return { applied: true, skipped };
}
