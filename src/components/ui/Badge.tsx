import React from 'react';

export type BadgeVariant = 'safe' | 'warning' | 'danger' | 'brand' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    safe: 'bg-safe-50 text-safe-700 dark:bg-safe-950 dark:text-safe-300 border-safe-200 dark:border-safe-800',
    warning: 'bg-warning-50 text-warning-700 dark:bg-warning-950 dark:text-warning-300 border-warning-200 dark:border-warning-800',
    danger: 'bg-danger-50 text-danger-700 dark:bg-danger-950 dark:text-danger-300 border-danger-200 dark:border-danger-800',
    brand: 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border-brand-200 dark:border-brand-800',
    neutral: 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300 border-surface-200 dark:border-surface-700',
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[10px] px-1.5 py-0.5 font-medium rounded-md',
    md: 'text-xs px-2.5 py-0.5 font-semibold rounded-full',
    lg: 'text-sm px-3 py-1 font-semibold rounded-full',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
