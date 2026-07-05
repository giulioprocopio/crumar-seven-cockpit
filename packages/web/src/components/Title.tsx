import styles from './Title.module.css';

interface TitleProps {
  children: string;
  className?: string;
}

/** Section label — a small dim uppercase heading placed above section content. */
export function Title({ children, className }: TitleProps) {
  return (
    <p className={[styles.title, className].filter(Boolean).join(' ')}>
      {children}
    </p>
  );
}
