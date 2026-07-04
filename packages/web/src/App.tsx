import { useState } from 'react';
import { WifiConnection } from '@crumar-seven-cockpit/core';
import { useCockpit } from './use-cockpit.js';

import { SevenToggle } from './components/SevenToggle.js';

/** Composition root: picks the transport and renders the graph editor. */
export function App() {
  const cockpit = useCockpit(() => new WifiConnection());
  const [on, setOn] = useState(false);

  const connected = cockpit.status === 'connected';
  const ready = connected && cockpit.catalog !== null;

  return (
    <div className="app">
      <SevenToggle value={on} onChange={setOn} />
    </div>
  );
}
