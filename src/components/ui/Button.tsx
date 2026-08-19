import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'safe' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  className = '',
  children,
  disabled,
  ...props
}) => {
  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-brand-600 hover:bg-brand-700 text-white shadow-xs shadow-brand-500/20 active:bg-brand-800 focus-visible:ring-brand-500',
    secondary:
      'bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-900 dark:text-surface-100 focus-visible:ring-surface-400',
    danger:
      'bg-danger-600 hover:bg-danger-700 text-white shadow-xs shadow-danger-500/20 active:bg-danger-800 focus-visible:ring-danger-500',
    safe:
      'bg-safe-600 hover:bg-safe-700 text-white shadow-xs shadow-safe-500/20 active:bg-safe-800 focus-visible:ring-safe-500',
    outline:
      'border border-surface-300 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300 focus-visible:ring-surface-400',
    ghost:
      'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 focus-visible:ring-surface-400',
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2 rounded-xl gap-2',
    lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5 font-semibold',
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};
