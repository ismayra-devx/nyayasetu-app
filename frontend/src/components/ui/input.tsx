import * as React from 'react';

// ── TEXT INPUT ──
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  prefixElement?: React.ReactNode;
  suffixElement?: React.ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      prefixElement,
      suffixElement,
      inputSize = 'md',
      className = '',
      id,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    
    // Compute input classes
    const sizeClass = inputSize !== 'md' ? `ns-input--${inputSize}` : '';
    const errorClass = error ? 'ns-input--error' : '';
    const successClass = success ? 'ns-input--success' : '';
    const baseClass = 'ns-input';
    
    const combinedInputClass = `${baseClass} ${sizeClass} ${errorClass} ${successClass} ${className}`.trim();

    return (
      <div className="ns-field">
        {label && (
          <label htmlFor={inputId} className={`ns-label ${required ? 'ns-label--required' : ''}`}>
            {label}
          </label>
        )}
        
        <div className="ns-input-group">
          {prefixElement && (
            <div className="ns-input-icon-left" aria-hidden="true">
              {prefixElement}
            </div>
          )}
          
          <input
            id={inputId}
            ref={ref}
            required={required}
            className={combinedInputClass}
            style={{
              paddingLeft: prefixElement ? 'var(--space-10)' : undefined,
              paddingRight: suffixElement ? 'var(--space-10)' : undefined,
            }}
            {...props}
          />
          
          {suffixElement && (
            <div className="ns-input-icon-right" aria-hidden="true">
              {suffixElement}
            </div>
          )}
        </div>

        {error && (
          <span className="ns-field-error" role="alert">
            <span style={{ fontSize: '12px' }}>⚠️</span> {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ── TEXTAREA (Auto-expanding) ──
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  maxHeight?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, maxHeight = 300, className = '', id, onChange, ...props }, ref) => {
    const textareaId = id || React.useId();
    const localRef = React.useRef<HTMLTextAreaElement>(null);
    
    // Combine refs
    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        (localRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }
      },
      [ref]
    );

    const adjustHeight = React.useCallback(() => {
      const textarea = localRef.current;
      if (!textarea) return;
      
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      
      if (scrollHeight > maxHeight) {
        textarea.style.height = `${maxHeight}px`;
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.height = `${scrollHeight}px`;
        textarea.style.overflowY = 'hidden';
      }
    }, [maxHeight]);

    React.useEffect(() => {
      adjustHeight();
    }, [adjustHeight, props.value]);

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      if (onChange) {
        onChange(e);
      }
    };

    const errorClass = error ? 'ns-input--error' : '';
    const combinedClass = `ns-textarea ${errorClass} ${className}`.trim();

    return (
      <div className="ns-field">
        {label && (
          <label htmlFor={textareaId} className="ns-label">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={setRefs}
          onChange={handleTextareaChange}
          className={combinedClass}
          {...props}
        />
        {error && (
          <span className="ns-field-error" role="alert">
            ⚠️ {error}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ── SELECT ──
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', id, ...props }, ref) => {
    const selectId = id || React.useId();
    const errorClass = error ? 'ns-input--error' : '';
    const combinedClass = `ns-select ${errorClass} ${className}`.trim();

    return (
      <div className="ns-field">
        {label && (
          <label htmlFor={selectId} className="ns-label">
            {label}
          </label>
        )}
        <select id={selectId} ref={ref} className={combinedClass} {...props}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="ns-field-error" role="alert">⚠️ {error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';

// ── CHECKBOX ──
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const checkId = id || React.useId();
    return (
      <label htmlFor={checkId} className={`ns-checkbox ${className}`.trim()}>
        <input id={checkId} type="checkbox" ref={ref} {...props} />
        <span className="type-body" style={{ userSelect: 'none' }}>{label}</span>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// ── RADIO ──
export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const radioId = id || React.useId();
    return (
      <label htmlFor={radioId} className={`ns-radio ${className}`.trim()}>
        <input id={radioId} type="radio" ref={ref} {...props} />
        <span className="type-body" style={{ userSelect: 'none' }}>{label}</span>
      </label>
    );
  }
);

Radio.displayName = 'Radio';

// ── PIN / OTP INPUT ──
export interface PinInputProps {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  label?: string;
  error?: string;
}

export const PinInput: React.FC<PinInputProps> = ({
  length = 6,
  value,
  onChange,
  label,
  error,
}) => {
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);

  const setInputRef = (el: HTMLInputElement | null, idx: number) => {
    inputsRef.current[idx] = el;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const val = e.target.value.replace(/\D/g, ''); // digit only
    if (!val) return;

    const valChar = val[val.length - 1]; // get last character entered
    const currentPin = value.split('');
    currentPin[idx] = valChar;
    
    const nextPinVal = currentPin.join('');
    onChange(nextPinVal);

    // Auto focus next box
    if (idx < length - 1 && valChar) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace') {
      const currentPin = value.split('');
      if (currentPin[idx]) {
        currentPin[idx] = '';
        onChange(currentPin.join(''));
      } else if (idx > 0) {
        currentPin[idx - 1] = '';
        onChange(currentPin.join(''));
        inputsRef.current[idx - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const nextFocusIdx = Math.min(pastedData.length, length - 1);
      inputsRef.current[nextFocusIdx]?.focus();
    }
  };

  const pinChars = value.padEnd(length, ' ').split('').slice(0, length);

  return (
    <div className="ns-field">
      {label && <span className="ns-label">{label}</span>}
      
      <div className="ns-pin-group">
        {Array.from({ length }).map((_, idx) => (
          <input
            key={idx}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            ref={(el) => setInputRef(el, idx)}
            value={pinChars[idx] === ' ' ? '' : pinChars[idx]}
            onChange={(e) => handleChange(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onPaste={handlePaste}
            className="ns-pin-input"
            aria-label={`Digit ${idx + 1}`}
          />
        ))}
      </div>
      
      {error && (
        <span className="ns-field-error" role="alert" style={{ alignSelf: 'center' }}>
          ⚠️ {error}
        </span>
      )}
    </div>
  );
};
