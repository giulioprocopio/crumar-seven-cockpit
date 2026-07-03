import type {
  Catalog,
  GlobalState,
  LiveUpdate,
  Param,
  Sound,
} from '../../model.js';
import type {
  Connection,
  ConnectionEvents,
  ConnectionState,
} from '../../connection.js';
import { Emitter } from '../../emitter.js';
import {
  parseParamList,
  parsePoll,
  parseSoundList,
  parseStateDump,
  type DeviceParam,
  type GlobalState as WifiGlobalState,
  type SoundEntry,
  type StateDump,
} from './protocol.js';

/**
 * `Connection` WiFi API implementation that wraps the protocol.ts parsers with
 * `fetch and a poll loop, translating the wire format to and from the abstract
 * `model.ts` types.
 */

/** Options for a `WifiConnection`. */
export interface WifiConnectionOptions {
  /** Base URL for device requests. Default `"/device"` (dev-server proxy). */
  baseUrl?: string;
  /** Poll interval in ms. Default `500`. */
  pollIntervalMs?: number;
}

export class WifiConnection implements Connection {
  readonly kind = 'wifi';

  private readonly baseUrl: string;
  private readonly pollIntervalMs: number;
  private readonly events = new Emitter<ConnectionEvents>();
  private currentState: ConnectionState = 'disconnected';
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private polling = false;

  constructor(options: WifiConnectionOptions = {}) {
    this.baseUrl = options.baseUrl ?? '/device';
    this.pollIntervalMs = options.pollIntervalMs ?? 500;
  }

  get state(): ConnectionState {
    return this.currentState;
  }

  on<K extends keyof ConnectionEvents>(
    event: K,
    handler: ConnectionEvents[K],
  ): () => void {
    return this.events.on(event, handler);
  }

  async connect(): Promise<void> {
    this.setState('connecting');
    try {
      await this.request('str', { n: 4 }); // reachability check
      this.setState('connected');
      this.startPolling();
    } catch (error) {
      this.setState('error');
      this.fail(error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.stopPolling();
    this.setState('disconnected');
  }

  async getCatalog(): Promise<Catalog> {
    const [sounds, soundParams, fxParams] = await Promise.all([
      this.request('list', { b: 'snd' }).then(parseSoundList),
      this.request('list', { b: 'synp' }).then(parseParamList),
      this.request('list', { b: 'fxp' }).then(parseParamList),
    ]);
    return {
      sounds: sounds.map(toSound),
      soundParams: soundParams.map(toParam),
      fxParams: fxParams.map(toParam),
    };
  }

  /** One-shot read of live values and display labels (poll channel 3). */
  async getState(): Promise<LiveUpdate> {
    return toLiveUpdate(parseStateDump(await this.request('poll', { p: 3 })));
  }

  async setSound(index: number): Promise<void> {
    await this.request('snd', { n: index });
  }

  async setParam(id: string, value: number): Promise<void> {
    await this.request('set', { p: id, v: clamp(value, 0, 127) });
  }

  private setState(state: ConnectionState): void {
    this.currentState = state;
    this.events.emit('state', state);
  }

  private fail(error: unknown): void {
    const err = error instanceof Error ? error : new Error(String(error));
    this.events.emit('error', err);
  }

  /** Issue one `GET /p.asp` request and return the response text. */
  private async request(
    action: string,
    params: Record<string, string | number>,
  ): Promise<string> {
    const query = new URLSearchParams({ a: action });
    for (const [key, val] of Object.entries(params)) {
      query.set(key, String(val));
    }
    const response = await fetch(`${this.baseUrl}/p.asp?${query}`);
    if (!response.ok) {
      throw new Error(`Device request failed: ${response.status}`);
    }
    return response.text();
  }

  private startPolling(): void {
    this.stopPolling();
    void this.poll(); // load the current state immediately
    this.pollTimer = setInterval(() => void this.poll(), this.pollIntervalMs);
  }

  private stopPolling(): void {
    if (this.pollTimer !== null) clearInterval(this.pollTimer);
    this.pollTimer = null;
  }

  /** One poll cycle: live values and global state. */
  private async poll(): Promise<void> {
    if (this.polling) return; // skip if the previous cycle is still running
    this.polling = true;
    try {
      const dump = parseStateDump(await this.request('poll', { p: 3 }));
      this.events.emit('update', toLiveUpdate(dump));

      const global = parsePoll(await this.request('poll', { p: 0 }));
      if (global.raw.trim()) this.events.emit('global', toGlobal(global));
    } catch (error) {
      this.fail(error);
    } finally {
      this.polling = false;
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/** Map a WiFi sound entry to the abstract `Sound`. */
function toSound(s: SoundEntry): Sound {
  return { index: s.index, name: s.name, bank: s.bank };
}

/** Map a WiFi `DeviceParam` to the abstract `Param`. */
function toParam(p: DeviceParam): Param {
  return {
    id: p.id,
    group: p.group,
    label: p.label,
    min: p.min,
    max: p.max,
    cc: p.cc >= 0 ? p.cc : undefined,
  };
}

/** Map a WiFi state dump to the abstract `LiveUpdate`. */
function toLiveUpdate(dump: StateDump): LiveUpdate {
  return { values: dump.values, displays: dump.displays, sound: dump.sound };
}

/** Map WiFi global state to the abstract `GlobalState`. */
function toGlobal(g: WifiGlobalState): GlobalState {
  return { tune: g.tune, slots: g.glb, extra: g.extra };
}
