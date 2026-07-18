import * as React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

// ── CARD COMPONENT ──
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'accented' | 'danger' | 'interactive';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ variant = 'default', className = '', children, ...props }) => {
  let variantClass = 'ns-card';
  if (variant === 'accented') variantClass = 'ns-card--accented';
  else if (variant === 'danger') variantClass = 'ns-card--danger';
  else if (variant === 'interactive') variantClass = 'ns-card--interactive';

  if (variant === 'interactive') {
    const motionProps = props as HTMLMotionProps<'div'>;
    return (
      <motion.div
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.99 }}
        className={`${variantClass} ${className}`.trim()}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${variantClass} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};

// ── STAT CARD (Apple / Stripe dashboard style) ──
export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  hint?: string;
  badge?: React.ReactNode;
  isDanger?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  hint,
  badge,
  isDanger = false,
  className = '',
  ...props
}) => {
  const statusClass = isDanger ? 'ns-card--stat-danger' : 'ns-card--stat-success';
  const combinedClass = `ns-card--stat ${statusClass} ${className}`.trim();

  return (
    <div
      className={combinedClass}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        ...props.style
      }}
      {...props}
    >
      {badge && <div style={{ alignSelf: 'flex-start' }}>{badge}</div>}
      <div>
        <p className="type-label" style={{ color: 'var(--color-text-muted)', marginBottom: '4px' }}>
          {label}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          {value}
        </div>
        {hint && (
          <p className="type-caption" style={{ marginTop: '8px' }}>
            {hint}
          </p>
        )}
      </div>
    </div>
  );
};

// ── BADGE COMPONENT ──
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'danger' | 'warning' | 'info' | 'neutral';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', className = '', children, ...props }) => {
  const badgeClass = `ns-badge ns-badge--${variant}`;
  return (
    <span className={`${badgeClass} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
};

// ── STATUS DOT CHIP ──
export interface StatusChipProps extends React.HTMLAttributes<HTMLDivElement> {
  state?: 'active' | 'error' | 'warning' | 'neutral';
  children: React.ReactNode;
}

export const StatusChip: React.FC<StatusChipProps> = ({ state = 'neutral', className = '', children, ...props }) => {
  const chipClass = `ns-chip ns-chip--${state}`;
  return (
    <div className={`${chipClass} ${className}`.trim()} {...props}>
      <span className="ns-chip-dot" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
};
