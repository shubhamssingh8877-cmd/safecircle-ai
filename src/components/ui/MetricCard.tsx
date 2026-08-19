import React from 'react';
import { Card, CardContent } from './Card';
import { Badge } from './Badge';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  variant?: 'default' | 'brand' | 'safe' | 'warning' | 'danger';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  change,
  changeType = 'neutral',
  icon,
  variant = 'default',
}) => {
  const borderColors: Record<string, string> = {
    default: 'border-surface-200 dark:border-surface-800',
    brand: 'border-brand-500/20 bg-brand-50/30 dark:bg-brand-950/20',
    safe: 'border-safe-500/20 bg-safe-50/30 dark:bg-safe-950/20',
    warning: 'border-warning-500/20 bg-warning-50/30 dark:bg-warning-950/20',
    danger: 'border-danger-500/20 bg-danger-50/30 dark:bg-danger-950/20',
  };

  const iconColors: Record<string, string> = {
    default: 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300',
    brand: 'bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400',
    safe: 'bg-safe-100 dark:bg-safe-900/50 text-safe-600 dark:text-safe-400',
    warning: 'bg-warning-100 dark:bg-warning-900/50 text-warning-600 dark:text-warning-400',
    danger: 'bg-danger-100 dark:bg-danger-900/50 text-danger-600 dark:text-danger-400',
  };

  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md ${borderColors[variant]}`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
              {title}
            </span>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-50 font-mono">
              {value}
            </div>
          </div>
          {icon && (
            <div className={`p-2.5 rounded-xl ${iconColors[variant]} shrink-0 shadow-2xs`}>
              {icon}
            </div>
          )}
        </div>

        {(subtitle || change) && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            {change && (
              <Badge
                variant={changeType === 'positive' ? 'safe' : changeType === 'negative' ? 'danger' : 'neutral'}
                size="sm"
              >
                {change}
              </Badge>
            )}
            {subtitle && (
              <span className="text-surface-500 dark:text-surface-400 truncate">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
