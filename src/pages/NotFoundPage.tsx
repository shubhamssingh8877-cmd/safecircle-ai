import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="text-center space-y-5 max-w-md">
        <div className="w-16 h-16 rounded-3xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center text-brand-600 dark:text-brand-400 mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            Page Not Found
          </h1>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            The safety zone or page you are looking for does not exist or has been moved.
          </p>
        </div>
        <Link to="/dashboard">
          <Button variant="primary" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
            Return to Guardian Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};
