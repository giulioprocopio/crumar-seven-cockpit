import { useCallback, useEffect, useState } from 'react';
import type { Preset } from '@crumar-seven-cockpit/core';

const STORAGE_KEY = 'cockpit.presets';

function load(): Preset[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Preset[];
  } catch {
    return [];
  }
}

/** A preset library persisted in the browser's local storage. */
export function usePresets() {
  const [presets, setPresets] = useState<Preset[]>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  }, [presets]);

  const add = useCallback((preset: Preset) => {
    setPresets((prev) => [...prev, preset]);
  }, []);

  const removeAt = useCallback((index: number) => {
    setPresets((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return { presets, add, removeAt };
}
