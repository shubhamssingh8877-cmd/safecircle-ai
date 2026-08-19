import React from 'react';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-surface-700 dark:text-surface-300">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full rounded-xl border bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 text-sm px-3.5 py-2.5 transition-colors focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50 disabled:bg-surface-50 dark:disabled:bg-surface-950 ${
          error
            ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500'
            : 'border-surface-300 dark:border-surface-700'
        } ${className}`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger-600 dark:text-danger-400">{error}</p>}
      {!error && helperText && (
        <p className="text-xs text-surface-500 dark:text-surface-400">{helperText}</p>
      )}
    </div>
  );
};
