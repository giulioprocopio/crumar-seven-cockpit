/**
 * Public surface of `@crumar-seven-cockpit/core`.
 *
 * Core Seven communication logic, including the domain model, `Connection`
 * abstract and concrete implementations, `Controller`, and presets.
 */

export * from './model.js';
export * from './connection.js';
export * from './controller.js';
export * from './presets.js';

export {
  WifiConnection,
  type WifiConnectionOptions,
} from './connections/wifi/wifi-connection.js';
