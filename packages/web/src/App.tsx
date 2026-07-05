import { useRef } from 'react';
import { WifiConnection } from '@crumar-seven-cockpit/core';
import { useCockpit } from './hooks/use-cockpit.js';
import { ConnectionSection } from './features/ConnectionSection.js';
import { HeaderSection } from './features/HeaderSection.js';
import { SoundSection } from './features/SoundSection.js';

/** Composition root: picks the transport and renders the graph editor. */
export function App() {
  const cockpit = useCockpit(() => new WifiConnection());

  const connected = cockpit.status === 'connected';
  const ready = connected && !cockpit.initializing;

  // Once ready, keep sections mounted for as long as we stay connected so
  // components preserve their animation state across sound-change reloads.
  const everReadyRef = useRef(false);
  if (ready) everReadyRef.current = true;
  if (!connected) everReadyRef.current = false;
  const showSections = everReadyRef.current;

  return (
    <div className="app">
      <div className="grid">
        <HeaderSection />
        <ConnectionSection cockpit={cockpit} className="col-start-3" />
        {showSections && <SoundSection cockpit={cockpit} className="col-span-3" />}
      </div>
    </div>
  );
}
