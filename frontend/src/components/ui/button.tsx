import * as React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  isFullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'lg',
      isLoading = false,
      isFullWidth = true,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Generate corresponding CSS classes from globals.css design system
    const baseClass = 'ns-btn';
    const variantClass = `ns-btn-${variant}`;
    const sizeClass = `ns-btn--${size}`;
    const widthClass = isFullWidth ? 'ns-btn--full' : '';

    const combinedClassName = `${baseClass} ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim();

    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        whileTap={disabled || isLoading ? undefined : { scale: 0.98 }}
        className={combinedClassName}
        style={{ ...props.style }}
        {...props}
      >
        {isLoading ? (
          <span className="ns-btn-spinner" aria-hidden="true" />
        ) : null}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          {children}
        </span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export interface IconButtonProps extends HTMLMotionProps<'button'> {
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = 'md', className = '', disabled, children, ...props }, ref) => {
    const baseClass = 'ns-btn-icon';
    const sizeClass = size !== 'md' ? `ns-btn-icon--${size}` : '';
    const combinedClassName = `${baseClass} ${sizeClass} ${className}`.trim();

    return (
      <motion.button
        ref={ref}
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.97 }}
        className={combinedClassName}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';

export interface FABProps extends HTMLMotionProps<'button'> {
  isActive?: boolean;
  children: React.ReactNode;
}

export const FAB = React.forwardRef<HTMLButtonElement, FABProps>(
  ({ isActive = false, className = '', children, ...props }, ref) => {
    const baseClass = 'ns-fab';
    const activeClass = isActive ? 'ns-btn-danger' : '';
    const combinedClassName = `${baseClass} ${activeClass} ${className}`.trim();

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className={combinedClassName}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

FAB.displayName = 'FAB';
