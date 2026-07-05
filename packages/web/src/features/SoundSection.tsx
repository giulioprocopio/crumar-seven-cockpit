import { useRef } from 'react';
import { Section } from '../components/Section.js';
import { Select } from '../components/Select.js';
import { Title } from '../components/Title.js';
import type { Cockpit } from '../hooks/use-cockpit.js';

interface SoundSectionProps {
  cockpit: Cockpit;
  className?: string;
}

/** Segmented selector for the active sound from the device catalog. */
export function SoundSection({ cockpit, className }: SoundSectionProps) {
  const { catalog, sound, setSound } = cockpit;

  // Retain last known options so the list doesn't flicker empty while the
  // catalog rebuilds after a sound change (catalog is null mid-transition).
  const optionsRef = useRef<Array<{ value: number; label: string }>>([]);
  if (catalog && catalog.sounds.length > 0) {
    optionsRef.current = catalog.sounds.map((s) => ({
      value: s.index,
      label: s.name,
    }));
  }
  const options = optionsRef.current;

  return (
    <Section className={className}>
      <Title>Sound</Title>
      <Select
        value={sound}
        options={options}
        onChange={setSound}
        disabled={options.length === 0}
      />
    </Section>
  );
}
