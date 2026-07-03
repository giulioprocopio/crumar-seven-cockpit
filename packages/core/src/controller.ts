import type {
  Catalog,
  GlobalState,
  LiveUpdate,
  Param,
  ParamOption,
  ParamValues,
} from './model.js';
import type { Connection, ConnectionState } from './connection.js';
import { Emitter } from './emitter.js';

/** Events the controller emits to its subscribers. */
export interface ControllerEvents {
  /** Catalog, values, current sound, or global state changed. */
  change: () => void;
  /** Connection lifecycle changed. */
  state: (state: ConnectionState) => void;
  /** An error occurred. */
  error: (error: Error) => void;
}

/** How long a locally-set value is protected from a stale poll (ms). */
const RECENTLY_SET_MS = 800;

/**
 * The connection-agnostic brain. Holds the catalog and live values, applies
 * updates observed from the instrument, and forwards edits to the connection.
 */
export class Controller {
  private readonly connection: Connection;
  private readonly events = new Emitter<ControllerEvents>();
  private readonly unsubscribes: Array<() => void> = [];
  private readonly recentlySet = new Map<string, number>();
  private readonly optionCache = new Map<string, ParamOption[]>();

  private currentCatalog: Catalog | null = null;
  private currentValues: ParamValues = {};
  private currentSoundIndex = 0;
  private currentGlobal: GlobalState | null = null;

  constructor(connection: Connection) {
    this.connection = connection;
    this.unsubscribes.push(
      connection.on('update', (update) => this.applyUpdate(update)),
      connection.on('global', (global) => this.applyGlobal(global)),
      connection.on('state', (state) => this.events.emit('state', state)),
      connection.on('error', (error) => this.events.emit('error', error)),
    );
  }

  get state(): ConnectionState {
    return this.connection.state;
  }

  get catalog(): Catalog | null {
    return this.currentCatalog;
  }

  get values(): ParamValues {
    return this.currentValues;
  }

  get sound(): number {
    return this.currentSoundIndex;
  }

  get global(): GlobalState | null {
    return this.currentGlobal;
  }

  /** Subscribe to a controller event; returns an unsubscribe function. */
  on<K extends keyof ControllerEvents>(
    event: K,
    handler: ControllerEvents[K],
  ): () => void {
    return this.events.on(event, handler);
  }

  /** Connect and load the initial catalog. */
  async connect(): Promise<void> {
    await this.connection.connect();
    await this.reloadCatalog();
  }

  /** Disconnect from the instrument. */
  async disconnect(): Promise<void> {
    await this.connection.disconnect();
  }

  /** Unsubscribe from the connection; call when discarding the controller. */
  dispose(): void {
    for (const off of this.unsubscribes) off();
    this.unsubscribes.length = 0;
  }

  /** Set one parameter, optimistically here and on the device. */
  async setParam(id: string, value: number): Promise<void> {
    this.currentValues = { ...this.currentValues, [id]: value };
    this.recentlySet.set(id, Date.now());
    this.events.emit('change');
    await this.connection.setParam(id, value);
  }

  /** Select a sound and reload its parameters. */
  async setSound(index: number): Promise<void> {
    await this.connection.setSound(index);
    this.currentSoundIndex = index;
    await this.reloadCatalog();
  }

  private async reloadCatalog(): Promise<void> {
    this.currentCatalog = null; // show a "learning" state while we enrich
    this.events.emit('change');
    const catalog = await this.connection.getCatalog();
    await this.learnOptions(catalog);
    this.currentCatalog = catalog;
    this.events.emit('change');
  }

  /**
   * Enrich enum parameters with option labels. Steps each candidate through its
   * values, reading the label the connection reports, then restores the value.
   * Uses `setParam` so the recently-set guard keeps the poll loop from
   * clobbering the sweep. Cached per id.
   */
  private async learnOptions(catalog: Catalog): Promise<void> {
    const params = [...catalog.soundParams, ...catalog.fxParams];
    const state = await this.connection.getState();
    const displays = state.displays ?? {};
    const toSweep: Param[] = [];
    for (const param of params) {
      const cached = this.optionCache.get(param.id);
      if (cached) {
        param.options = cached;
      } else if (isEnumCandidate(param, displays)) {
        toSweep.push(param);
      }
    }
    for (const param of toSweep) {
      const original = state.values[param.id] ?? param.min;
      const options = await this.sweepOptions(param, original);
      this.optionCache.set(param.id, options);
      param.options = options;
    }
  }

  /** Step a parameter through its range, reading each value's label. */
  private async sweepOptions(
    param: Param,
    original: number,
  ): Promise<ParamOption[]> {
    const options: ParamOption[] = [];
    for (let value = param.min; value <= param.max; value++) {
      await this.setParam(param.id, value);
      const state = await this.connection.getState();
      const label = state.displays?.[param.id] ?? String(value);
      options.push({ value, label });
    }
    await this.setParam(param.id, original);
    return options;
  }

  private applyUpdate(update: LiveUpdate): void {
    const now = Date.now();
    const next = { ...this.currentValues };
    for (const [id, value] of Object.entries(update.values)) {
      const setAt = this.recentlySet.get(id);
      if (setAt !== undefined && now - setAt < RECENTLY_SET_MS) continue;
      next[id] = value;
    }
    this.currentValues = next;

    if (update.sound !== undefined && update.sound !== this.currentSoundIndex) {
      this.currentSoundIndex = update.sound;
      void this.reloadCatalog();
    }
    this.events.emit('change');
  }

  private applyGlobal(global: GlobalState): void {
    this.currentGlobal = global;
    this.events.emit('change');
  }
}

/** A small-range param whose live display is a name (not a number). */
function isEnumCandidate(
  param: Param,
  displays: Record<string, string>,
): boolean {
  if (param.max - param.min < 2 || param.max > 12) return false;
  const display = displays[param.id];
  if (display === undefined || display === '') return false;
  return Number.isNaN(Number(display));
}
