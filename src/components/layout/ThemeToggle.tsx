import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center bg-surface-100 dark:bg-surface-800 p-0.5 rounded-lg border border-surface-200 dark:border-surface-700">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-md text-xs transition-colors ${
          theme === 'light'
            ? 'bg-white text-surface-900 shadow-xs font-semibold'
            : 'text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-200'
        }`}
        title="Light mode"
        aria-label="Light mode"
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-md text-xs transition-colors ${
          theme === 'dark'
            ? 'bg-surface-900 text-white shadow-xs font-semibold'
            : 'text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-200'
        }`}
        title="Dark mode"
        aria-label="Dark mode"
      >
        <Moon className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-md text-xs transition-colors ${
          theme === 'system'
            ? 'bg-white dark:bg-surface-900 text-brand-600 dark:text-brand-400 shadow-xs font-semibold'
            : 'text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-200'
        }`}
        title="System theme"
        aria-label="System theme"
      >
        <Monitor className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
