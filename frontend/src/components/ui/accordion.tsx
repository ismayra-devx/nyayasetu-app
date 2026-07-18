import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as const;

export interface AccordionProps {
  children: React.ReactNode;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({ children, className = '' }) => {
  return (
    <div className={`ns-accordion ${className}`.trim()}>
      {children}
    </div>
  );
};

export interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  isInitiallyOpen?: boolean;
  className?: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  children,
  isInitiallyOpen = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = React.useState(isInitiallyOpen);
  const contentId = React.useId();

  return (
    <div className={`ns-accordion-item ${isOpen ? 'ns-accordion-item--open' : ''} ${className}`.trim()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="ns-accordion-trigger"
      >
        <span className="ns-accordion-title">{title}</span>
        <span className="ns-accordion-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={contentId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: 'auto', 
              opacity: 1,
              transition: { height: { duration: 0.25, ease: EASE }, opacity: { duration: 0.2, ease: EASE } }
            }}
            exit={{ 
              height: 0, 
              opacity: 0,
              transition: { height: { duration: 0.2, ease: EASE }, opacity: { duration: 0.15, ease: EASE } }
            }}
            style={{ overflow: 'hidden' }}
          >
            <div className="ns-accordion-content">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
