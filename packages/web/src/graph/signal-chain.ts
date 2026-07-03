import type { Catalog, Param, ParamValues } from '@crumar-seven-cockpit/core';

export type StageKind =
  | 'source'
  | 'inline'
  | 'mixin'
  | 'modulator'
  | 'output';

/** One stage in the Seven's signal path. */
export interface Stage {
  id: string;
  label: string;
  /** Fx param groups in this stage (ignored for the engine stage). */
  groups: string[];
  /** `*_sw` param id that turns the stage on (on non-zero value), if any. */
  bypass?: string;
  kind: StageKind;
}

/**
 * The Seven's signal path. We assume the AMP is always before FX2. Pads mix in
 * into the final stage after reverb.
 */
export const CHAIN: Stage[] = [
  { id: 'engine', label: 'Engine', groups: [], kind: 'source' },
  {
    id: 'fx1',
    label: 'FX1',
    groups: ['efx_fx1'],
    bypass: 'fx1_sw',
    kind: 'inline',
  },
  {
    id: 'amp',
    label: 'Amp',
    groups: ['efx_amp'],
    bypass: 'amp_sw',
    kind: 'inline',
  },
  {
    id: 'fx2',
    label: 'FX2',
    groups: ['efx_fx2', 'efx_pha', 'efx_dly'],
    bypass: 'fx2_sw',
    kind: 'inline',
  },
  {
    id: 'reverb',
    label: 'Reverb',
    groups: ['efx_rev'],
    bypass: 'rev_sw',
    kind: 'inline',
  },
  {
    id: 'pad',
    label: 'Pad',
    groups: ['efx_pad'],
    bypass: 'pad_sw',
    kind: 'mixin',
  },
  { id: 'master', label: 'EQ / Volume', groups: ['efx_veq'], kind: 'output' },
  { id: 'expr', label: 'Expression', groups: ['pdl_exp'], kind: 'modulator' },
];

/**
 * Groups shown only when a mode parameter's active label matches. FX2's phaser
 * and delay controls only apply when FX2 is set to that mode.
 */
const CONDITIONAL_GROUPS: Record<string, { param: string; match: string }> = {
  efx_pha: { param: 'fx2_md', match: 'Phaser' },
  efx_dly: { param: 'fx2_md', match: 'Delay' },
};

/** The active label of a mode parameter, via its learned options. */
function activeLabel(
  id: string,
  catalog: Catalog,
  values: ParamValues,
): string {
  const param = catalog.fxParams.find((p) => p.id === id);
  const value = values[id];
  return param?.options?.find((o) => o.value === value)?.label ?? '';
}

/** Whether a group is visible, given the current catalog and values. */
function groupVisible(
  group: string,
  catalog: Catalog,
  values: ParamValues,
): boolean {
  const cond = CONDITIONAL_GROUPS[group];
  if (!cond) return true;
  return activeLabel(cond.param, catalog, values).includes(cond.match);
}

/** The params that belong to a stage, given the current catalog and values. */
export function stageParams(
  stage: Stage,
  catalog: Catalog,
  values: ParamValues,
): Param[] {
  if (stage.id === 'engine') return catalog.soundParams;
  return catalog.fxParams.filter(
    (p) =>
      stage.groups.includes(p.group) &&
      groupVisible(p.group, catalog, values),
  );
}
