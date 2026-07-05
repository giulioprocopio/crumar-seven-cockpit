import { Section } from '../components/Section.js';
import styles from './HeaderSection.module.css';

interface HeaderSectionProps {
  className?: string;
}

export function HeaderSection({ className }: HeaderSectionProps) {
  return (
    <Section bare className={className}>
      <span className={styles.name}>Crumar Seven Cockpit</span>
    </Section>
  );
}
