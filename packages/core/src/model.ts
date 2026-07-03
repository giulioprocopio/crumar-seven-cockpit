/**
 * These types describe the Seven's inner state as an abstract model, without
 * any reference to how we talk to it.
 */

/** A selectable sound / patch on the instrument. */
export interface Sound {
  index: number;
  name: string;
  /** Optional grouping hint (modeled or sampled); set by the connection. */
  bank?: number;
}

/** One editable parameter's definition (its shape, not its current value). */
export interface Param {
  /** Stable id used to read / write the value (e.g. `"rho_atk"`). */
  id: string;
  /** Grouping id for related parameters (e.g. `"reverb"`). */
  group: string;
  label: string;
  min: number;
  max: number;
  /** MIDI CC the instrument maps to this parameter, if any. */
  cc?: number;
}

/**
 * The instrument's self-described catalog: which sounds exist and which
 * parameters are currently editable. Rebuilt when the selected sound changes.
 */
export interface Catalog {
  sounds: Sound[];
  /** Parameters of the currently selected sound. */
  soundParams: Param[];
  /** Effect / pedal parameters (stable across sounds). */
  fxParams: Param[];
}

/** A set of parameter values, keyed by parameter id. */
export type ParamValues = Record<string, number>;

/**
 * A live update observed from the instrument, e.g. someone turned a physical
 * knob. Connections emit these; the controller applies them to its state.
 */
export interface LiveUpdate {
  values: ParamValues;
  /** Optional human-readable display strings, keyed by param id. */
  displays?: Record<string, string>;
  /** Current sound index, if the instrument reported one. */
  sound?: number;
}

/** Global instrument settings a connection can observe. */
export interface GlobalState {
  /** Master tuning in Hz, if known. */
  tune?: number;
  /** Opaque global-settings slots (semantics still being mapped). */
  slots: number[];
  /** Any extra fields a connection wants to surface. */
  extra?: Record<string, string>;
}
