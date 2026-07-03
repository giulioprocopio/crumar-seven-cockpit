/**
 * The Seven's WiFi wire format.
 *
 * The device exposes a single endpoint, `GET /p.asp?a=<action>`, and the
 * parsers below decode each action's plain-text response:
 *  - `a=set&p=<id>&v=<0..127>` sets a parameter and echoes the applied value,
 *    zero-padded (e.g. `"068"`);
 *  - `a=poll&p=0` returns global state (e.g. `";tun=440;glb=0,1,..;"`);
 *  - `a=poll&p=1` returns the current sound (e.g. `";snd=0;"`);
 *  - `a=poll&p=3` returns the full live state (e.g.
 *    `";rho_atk=64=064;...;snd=0;"`);
 *  - `a=list&b=snd` lists sounds; `a=list&b=synp` / `a=list&b=fxp` list
 *    parameter definitions;
 *  - `a=snd&n=<index>` selects a sound; `a=str&n=4` returns the firmware
 *    string.
 */

/** One selectable sound from `list&b=snd`. */
export interface SoundEntry {
  index: number;
  /** `0` if modeled, `1` if sampled. */
  bank: number;
  name: string;
}

/** One parameter definition from `list&b=synp` / `list&b=fxp`. */
export interface DeviceParam {
  index: number;
  /** Engine / effect group, e.g. `"pno_rho"` or `"efx_rev"`. */
  group: string;
  /** Parameter id used in `set`, e.g. `"rho_atk"`. */
  id: string;
  label: string;
  /** MIDI CC number, or `-1` if unassigned. */
  cc: number;
  /** Lower bound (always `0` on this device). */
  min: number;
  max: number;
  /** Current value reported by the device. */
  value: number;
  flag: number;
}

/** The full live parameter state from `poll&p=3`. */
export interface StateDump {
  /** Raw numeric values, keyed by parameter id. */
  values: Record<string, number>;
  /** Human display strings, keyed by parameter id (e.g. `"1372 Hz"`). */
  displays: Record<string, string>;
  /** Current sound index, from the trailing `snd=` token. */
  sound?: number;
  raw: string;
}

/** The global state from `poll&p=0`. */
export interface GlobalState {
  /** Master tuning in Hz. */
  tune?: number;
  /** Global-settings array; slot meanings still being mapped. */
  glb: number[];
  /** WiFi password field. */
  wifiPassword?: string;
  /** Any other `key=value` pairs, preserved. */
  extra: Record<string, string>;
  raw: string;
}

/** Split into trimmed, non-empty lines (rows may have a leading CRLF). */
function nonEmptyLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Parse the `list&b=snd` sound list response. */
export function parseSoundList(text: string): SoundEntry[] {
  const sounds: SoundEntry[] = [];
  for (const line of nonEmptyLines(text)) {
    const parts = line.split('|');
    if (parts.length < 3) continue;
    const index = Number(parts[0]);
    if (Number.isNaN(index)) continue;
    sounds.push({
      index,
      bank: Number(parts[1]),
      name: parts.slice(2).join('|'),
    });
  }
  return sounds;
}

/** Parse the `list&b=synp` / `list&b=fxp` parameter-definition responses. */
export function parseParamList(text: string): DeviceParam[] {
  const params: DeviceParam[] = [];
  for (const line of nonEmptyLines(text)) {
    const p = line.split('|');
    if (p.length < 8) continue;
    const index = Number(p[0]);
    if (Number.isNaN(index)) continue;
    params.push({
      index,
      group: p[1] ?? '',
      id: p[2] ?? '',
      label: p[3] ?? '',
      cc: Number(p[4]),
      min: 0,
      max: Number(p[5]),
      value: Number(p[6]),
      flag: Number(p[7]),
    });
  }
  return params;
}

/** Parse the `poll&p=3` live state response. */
export function parseStateDump(text: string): StateDump {
  const values: Record<string, number> = {};
  const displays: Record<string, string> = {};
  let sound: number | undefined;
  for (const token of text.split(';')) {
    const s = token.trim();
    if (!s) continue;
    const parts = s.split('=');
    if (parts.length < 2) continue;
    const id = parts[0]!;
    if (id === 'snd') {
      sound = Number(parts[1]);
      continue;
    }
    // Guard against the global-format keys ever appearing here.
    if (id === 'tun' || id === 'glb' || id === 'wfp') continue;
    const raw = Number(parts[1]);
    if (Number.isNaN(raw)) continue;
    values[id] = raw;
    displays[id] =
      parts.length >= 3 ? parts.slice(2).join('=') : String(parts[1]);
  }
  return { values, displays, sound, raw: text };
}

/** Parse the `poll&p=0` global state response. */
export function parsePoll(text: string): GlobalState {
  const extra: Record<string, string> = {};
  let tune: number | undefined;
  let glb: number[] = [];
  let wifiPassword: string | undefined;
  for (const segment of text.split(';')) {
    const s = segment.trim();
    if (!s) continue;
    const eq = s.indexOf('=');
    if (eq === -1) continue;
    const key = s.slice(0, eq);
    const val = s.slice(eq + 1);
    if (key === 'tun') tune = Number(val);
    else if (key === 'glb') glb = val.split(',').map(Number);
    else if (key === 'wfp') wifiPassword = val;
    else extra[key] = val;
  }
  return { tune, glb, wifiPassword, extra, raw: text };
}

/** `set` echoes the applied value, zero-padded, e.g. `"068"`. */
export function parseSetResponse(text: string): number {
  return Number(text.trim());
}

/** Firmware string endpoint (`str&n=4`). */
export function parseFirmware(text: string): string {
  return text.trim();
}

/** A single changed slot in the `glb` array. */
export interface GlbChange {
  index: number;
  from: number;
  to: number;
}

/** Which `glb` slots changed between two poll snapshots. */
export function diffGlb(prev: number[], next: number[]): GlbChange[] {
  const changes: GlbChange[] = [];
  const len = Math.max(prev.length, next.length);
  for (let i = 0; i < len; i++) {
    const from = prev[i] ?? 0;
    const to = next[i] ?? 0;
    if (from !== to) changes.push({ index: i, from, to });
  }
  return changes;
}
