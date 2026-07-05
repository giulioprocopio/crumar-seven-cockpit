import { useEffect, useRef, useState } from 'react';
import {
  Controller,
  type Catalog,
  type Connection,
  type ConnectionState,
  type GlobalState,
  type ParamValues,
} from '@crumar-seven-cockpit/core';

/** Live snapshot of the controller, mirrored into React state. */
export interface CockpitState {
  status: ConnectionState;
  catalog: Catalog | null;
  values: ParamValues;
  sound: number;
  global: GlobalState | null;
  error: string | null;
  /** True once the catalog has been fetched at least once since connecting. */
  loaded: boolean;
}

/** Everything a component needs: current state plus the actions. */
export interface Cockpit extends CockpitState {
  initializing: boolean;
  controller: Controller;
  connect: () => void;
  disconnect: () => void;
  setParam: (id: string, value: number) => void;
  setSound: (index: number) => void;
}

/**
 * Bind a core `Controller` to React state. The caller supplies the connection,
 * so the hook stays transport-agnostic.
 */
export function useCockpit(createConnection: () => Connection): Cockpit {
  const controllerRef = useRef<Controller | null>(null);
  if (controllerRef.current === null) {
    controllerRef.current = new Controller(createConnection());
  }
  const controller = controllerRef.current;

  const [state, setState] = useState<CockpitState>({
    status: controller.state,
    catalog: controller.catalog,
    values: controller.values,
    sound: controller.sound,
    global: controller.global,
    error: null,
    loaded: false,
  });

  useEffect(() => {
    const offChange = controller.on('change', () => {
      setState((prev) => ({
        ...prev,
        status: controller.state,
        catalog: controller.catalog,
        values: controller.values,
        sound: controller.sound,
        global: controller.global,
        loaded: prev.loaded || controller.catalog !== null,
      }));
    });

    const offState = controller.on('state', (newState) => {
      setState((prev) => ({
        ...prev,
        status: newState,
        // Reset loaded on disconnect so the next connect shows "Initializing..." again.
        loaded: newState === 'connected' ? prev.loaded : false,
      }));
    });

    const offError = controller.on('error', (e) =>
      setState((prev) => ({ ...prev, error: e.message })),
    );

    return () => {
      offChange();
      offState();
      offError();
    };
  }, [controller]);

  return {
    ...state,
    initializing: state.status === 'connected' && !state.loaded,
    controller,
    connect: () => {
      setState((prev) => ({ ...prev, error: null }));
      void controller.connect();
    },
    disconnect: () => void controller.disconnect(),
    setParam: (id, value) => void controller.setParam(id, value),
    setSound: (index) => {
      setState((prev) => ({ ...prev, sound: index }));
      void controller.setSound(index);
    },
  };
}
