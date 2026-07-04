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
}

/** Everything a component needs: current state plus the actions. */
export interface Cockpit extends CockpitState {
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
  });

  useEffect(() => {
    const sync = () =>
      setState((prev) => ({
        ...prev,
        status: controller.state,
        catalog: controller.catalog,
        values: controller.values,
        sound: controller.sound,
        global: controller.global,
      }));
    const offChange = controller.on('change', sync);
    const offState = controller.on('state', sync);
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
    controller,
    connect: () => void controller.connect(),
    disconnect: () => void controller.disconnect(),
    setParam: (id, value) => void controller.setParam(id, value),
    setSound: (index) => void controller.setSound(index),
  };
}
