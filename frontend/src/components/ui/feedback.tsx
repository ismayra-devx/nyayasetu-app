import * as React from 'react';
import { motion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as const;

// ── PROGRESS BAR ──
export interface ProgressBarProps {
  value: number; // 0 to 100
  variant?: 'primary' | 'danger' | 'warning';
  isThin?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  variant = 'primary',
  isThin = false,
  className = '',
  style,
}) => {
  const roundedValue = Math.min(Math.max(value, 0), 100);
  const sizeClass = isThin ? 'ns-progress--thin' : '';
  const variantClass = variant !== 'primary' ? `ns-progress--${variant}` : '';

  return (
    <div className={`ns-progress ${sizeClass} ${variantClass} ${className}`.trim()} style={style}>
      <motion.div
        className="ns-progress-bar"
        initial={{ width: 0 }}
        animate={{ width: `${roundedValue}%` }}
        transition={{ duration: 0.4, ease: EASE }}
      />
    </div>
  );
};

// ── LOADING SPINNER ──
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  isInverse?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  isInverse = false,
  className = '',
}) => {
  const sizeClass = size !== 'md' ? `ns-spinner--${size}` : '';
  const colorClass = isInverse ? 'ns-spinner--white' : '';
  
  return (
    <div 
      className={`ns-spinner ${sizeClass} ${colorClass} ${className}`.trim()} 
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// ── ALERT BANNER ──
export interface AlertProps {
  title?: string;
  variant?: 'success' | 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  title,
  variant = 'info',
  icon,
  children,
  className = '',
}) => {
  const alertClass = `ns-alert ns-alert--${variant}`;

  // Default fallback icons matching Lucide styling
  const getDefaultIcon = () => {
    switch (variant) {
      case 'success':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
      case 'danger':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
      case 'warning':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

  return (
    <div className={`${alertClass} ${className}`.trim()} role="alert">
      <span className="ns-alert-icon" aria-hidden="true">
        {icon || getDefaultIcon()}
      </span>
      <div className="ns-alert-body">
        {title && <h4 className="ns-alert-title">{title}</h4>}
        <div className="ns-alert-text">{children}</div>
      </div>
    </div>
  );
};

// ── EMPTY STATE ──
export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionButton?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionButton,
  className = '',
}) => {
  return (
    <div className={`ns-empty ${className}`.trim()}>
      <div className="ns-empty-icon" aria-hidden="true">
        {icon || (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8" />
          </svg>
        )}
      </div>
      <h3 className="ns-empty-title">{title}</h3>
      <p className="ns-empty-description">{description}</p>
      {actionButton && <div style={{ marginTop: '8px' }}>{actionButton}</div>}
    </div>
  );
};

// ── GUIDED CHECKLIST STEP ──
export interface GuidedChecklistStep {
  label: string;
  status: 'done' | 'active' | 'pending' | 'error';
  sublabel?: string;
}

export interface GuidedChecklistProps {
  steps: GuidedChecklistStep[];
  className?: string;
}

export const GuidedChecklist: React.FC<GuidedChecklistProps> = ({ steps, className = '' }) => {
  return (
    <div className={`ns-step-list ${className}`.trim()}>
      {steps.map((step, idx) => {
        let stepState: 'complete' | 'active' | 'pending' | 'error' = 'pending';
        if (step.status === 'done') stepState = 'complete';
        else if (step.status === 'active') stepState = 'active';
        else if (step.status === 'error') stepState = 'error';

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.35, ease: EASE }}
            className={`ns-step ns-step--${stepState}`}
          >
            <div className="ns-step-indicator">
              {step.status === 'done' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : step.status === 'active' ? (
                <span className="ns-chip-dot animate-pulse-ring" style={{ width: 8, height: 8, background: 'var(--color-primary)' }} />
              ) : step.status === 'error' ? (
                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>!</span>
              ) : (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-border-strong)' }} />
              )}
            </div>
            <div className="ns-step-content">
              <div className="ns-step-label">{step.label}</div>
              {step.sublabel && <div className="ns-step-sublabel">{step.sublabel}</div>}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
