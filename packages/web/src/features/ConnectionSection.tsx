import { useState } from 'react';
import type { ConnectionState } from '@crumar-seven-cockpit/core';
import { Button } from '../components/Button.js';
import { Section } from '../components/Section.js';
import { Select } from '../components/Select.js';
import { Status, type StatusVariant } from '../components/Status.js';
import type { Cockpit } from '../hooks/use-cockpit.js';
import styles from './ConnectionSection.module.css';

export type ConnectionType = 'wifi' | 'usb';

const CONNECTION_OPTIONS = [
  { value: 0, label: 'WiFi' },
  { value: 1, label: 'USB' },
];

function toLabel(status: ConnectionState): string {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting...';
    case 'error':
      return 'Error';
    case 'disconnected':
      return 'Disconnected';
  }
}

function toVariant(status: ConnectionState): StatusVariant {
  switch (status) {
    case 'connected':
      return 'active';
    case 'connecting':
      return 'pending';
    case 'error':
      return 'error';
    case 'disconnected':
      return 'idle';
  }
}

interface ConnectionSectionProps {
  cockpit: Cockpit;
  className?: string;
}

/**
 * Connection type selector, status indicator, and connect / disconnect action.
 */
export function ConnectionSection({ cockpit, className }: ConnectionSectionProps) {
  const { status, error, connect, disconnect } = cockpit;
  const [connType, setConnType] = useState<ConnectionType>('wifi');

  const canSwitch = status === 'disconnected' || status === 'error';

  return (
    <Section className={className}>
      <div className={styles.root}>
        <div className={styles.select}>
          <Select
            value={connType === 'wifi' ? 0 : 1}
            options={CONNECTION_OPTIONS}
            onChange={(v) => setConnType(v === 0 ? 'wifi' : 'usb')}
            disabled={!canSwitch}
          />
        </div>
        <div className={styles.action}>
          {status === 'connected' ? (
            <Button onClick={disconnect}>Disconnect</Button>
          ) : (
            <Button variant="primary" onClick={connect}>
              Connect
            </Button>
          )}
        </div>
        <div className={styles.feedback}>
          <Status label={toLabel(status)} variant={toVariant(status)} />
          <span className={styles.space} aria-hidden="true">
            {' '}
          </span>
          <p className={styles.error}>{error ?? ''}</p>
        </div>
      </div>
    </Section>
  );
}
