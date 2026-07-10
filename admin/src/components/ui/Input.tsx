import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-900 transition-all bg-white dark:bg-gray-800 ${
            error
              ? 'border-red-300 dark:border-red-500/50 text-red-900 dark:text-red-400 focus:ring-red-500 focus:border-red-500 placeholder-red-300 dark:placeholder-red-900/50'
              : 'border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary placeholder-gray-400 dark:placeholder-gray-500'
          }`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
