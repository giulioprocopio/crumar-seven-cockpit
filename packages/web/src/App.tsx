import { WifiConnection } from '@crumar-seven-cockpit/core';
import { useCockpit } from './hooks/use-cockpit.js';
import { ConnectionSection } from './features/ConnectionSection.js';
import { HeaderSection } from './features/HeaderSection.js';

/** Composition root: picks the transport and renders the graph editor. */
export function App() {
  const cockpit = useCockpit(() => new WifiConnection());

  const connected = cockpit.status === 'connected';
  const ready = connected && cockpit.catalog !== null;

  return (
    <div className="app">
      <div style={{ display: 'flex', gap: 8 }}>
        <HeaderSection />
        <ConnectionSection cockpit={cockpit} />
      </div>
    </div>
  );
}
