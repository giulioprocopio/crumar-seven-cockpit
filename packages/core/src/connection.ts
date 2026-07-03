import type { Catalog, GlobalState, LiveUpdate } from './model.js';

/**
 * Abstract Seven transport connection. Each transport implements this interface
 * with its own connection logic.
 */

/** Lifecycle of a connection. */
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

/** Events a connection pushes to its subscribers. */
export interface ConnectionEvents {
  /** Live values / sound observed from the instrument. */
  update: (update: LiveUpdate) => void;
  /** Global settings changed (tuning, etc.). */
  global: (global: GlobalState) => void;
  /** Lifecycle state changed. */
  state: (state: ConnectionState) => void;
  /** A transport error occurred. */
  error: (error: Error) => void;
}

/** Abstract Seven transport connection. */
export interface Connection {
  /** Identifier for the transport, e.g. `"wifi"`. */
  readonly kind: string;
  /** Current lifecycle state. */
  readonly state: ConnectionState;

  /** Open the connection and begin observing the instrument. */
  connect(): Promise<void>;
  /** Close the connection and stop observing. */
  disconnect(): Promise<void>;

  /**
   * Read the current catalog: the sound list plus the parameters of the active
   * sound and the effects.
   */
  getCatalog(): Promise<Catalog>;

  /** Read a one-shot snapshot of live values and display labels. */
  getState(): Promise<LiveUpdate>;

  /** Select a sound by its catalog index. */
  setSound(index: number): Promise<void>;

  /** Set one parameter to `value`. */
  setParam(id: string, value: number): Promise<void>;

  /** Subscribe to an event; returns an unsubscribe function. */
  on<K extends keyof ConnectionEvents>(
    event: K,
    handler: ConnectionEvents[K],
  ): () => void;
}
