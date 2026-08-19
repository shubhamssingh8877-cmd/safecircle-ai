import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-surface-700 dark:text-surface-300">
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-2xs">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full rounded-xl border bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 text-sm px-3.5 py-2.5 transition-colors placeholder:text-surface-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50 disabled:bg-surface-50 dark:disabled:bg-surface-950 ${
              icon ? 'pl-9' : ''
            } ${
              error
                ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500'
                : 'border-surface-300 dark:border-surface-700'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-danger-600 dark:text-danger-400">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-surface-500 dark:text-surface-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
