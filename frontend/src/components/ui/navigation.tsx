import * as React from 'react';
import { motion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as const;

// ── BOTTOM NAVIGATION CONTAINER ──
export interface BottomNavProps {
  children: React.ReactNode;
  className?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ children, className = '' }) => {
  return (
    <nav className={`ns-bottom-nav ${className}`.trim()}>
      {children}
    </nav>
  );
};

// ── BOTTOM NAVIGATION ITEM ──
export interface BottomNavItemProps {
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const BottomNavItem: React.FC<BottomNavItemProps> = ({
  label,
  icon,
  isActive = false,
  onClick,
  className = '',
}) => {
  const activeClass = isActive ? 'ns-nav-item--active' : '';

  return (
    <button
      onClick={onClick}
      className={`ns-nav-item ${activeClass} ${className}`.trim()}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="ns-nav-icon" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
};

// ── BOTTOM STICKY CTA (with layout shift protection) ──
export interface BottomCtaProps {
  children: React.ReactNode;
  isVisible?: boolean;
  className?: string;
}

export const BottomCta: React.FC<BottomCtaProps> = ({
  children,
  isVisible = true,
  className = '',
}) => {
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '430px',
        zIndex: 100,
      }}
      className={className}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ delay: 0.2, duration: 0.35, ease: EASE }}
        style={{
          width: '100%',
          padding: '16px 24px calc(16px + env(safe-area-inset-bottom))',
          background: 'linear-gradient(to top, var(--color-bg) 60%, transparent)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

// ── APP BAR / HEADER ──
export interface AppHeaderProps {
  title?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  onBack,
  rightAction,
  className = '',
}) => {
  return (
    <header className={`ns-header ${className}`.trim()}>
      {onBack && (
        <button
          onClick={onBack}
          className="ns-header-back"
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
      )}
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        {title ? (
          <h1 className="ns-header-title">{title}</h1>
        ) : (
          <div className="ns-wordmark">
            <div className="ns-wordmark-icon" aria-hidden="true">
              <span style={{ fontSize: '14px', lineHeight: 1 }}>⚖</span>
            </div>
            <div>
              <div className="ns-wordmark-text">न्यायसेतु</div>
              <div className="ns-wordmark-sub">NyayaSetu</div>
            </div>
          </div>
        )}
      </div>

      {rightAction && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {rightAction}
        </div>
      )}
    </header>
  );
};
