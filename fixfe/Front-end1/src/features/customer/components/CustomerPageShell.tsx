import React from 'react';
import styles from '../styles/CustomerPageShell.module.css';

export interface CustomerShellStat {
  label: string;
  value: string;
  helper?: string;
}

export interface CustomerShellAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

interface CustomerPageShellProps {
  eyebrow?: string;
  title: string;
  description: string;
  stats?: CustomerShellStat[];
  actions?: CustomerShellAction[];
  aside?: React.ReactNode;
  children: React.ReactNode;
}

interface CustomerPageSectionProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const CustomerPageShell: React.FC<CustomerPageShellProps> = ({
  eyebrow = 'Customer experience',
  title,
  description,
  stats = [],
  actions = [],
  aside,
  children,
}) => {
  return (
    <div className={styles.pageShell}>
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>

          {actions.length > 0 && (
            <div className={styles.actions}>
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className={action.variant === 'secondary' ? styles.secondaryAction : styles.primaryAction}
                  onClick={action.onClick}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {aside && <aside className={styles.heroAside}>{aside}</aside>}
      </section>

      {stats.length > 0 && (
        <section className={styles.statsGrid}>
          {stats.map((stat) => (
            <article key={`${stat.label}-${stat.value}`} className={styles.statCard}>
              <span className={styles.statLabel}>{stat.label}</span>
              <strong className={styles.statValue}>{stat.value}</strong>
              {stat.helper && <span className={styles.statHelper}>{stat.helper}</span>}
            </article>
          ))}
        </section>
      )}

      <div className={styles.content}>{children}</div>
    </div>
  );
};

export const CustomerPageSection: React.FC<CustomerPageSectionProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  children,
  className = '',
}) => {
  return (
    <section className={`${styles.sectionCard} ${className}`.trim()}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>{title}</h2>
          {description && <p className={styles.sectionDescription}>{description}</p>}
        </div>

        {actionLabel && onAction && (
          <button type="button" className={styles.sectionAction} onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>

      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
};
