import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'primary';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
    primary: 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light',
    success: 'bg-green-100 dark:bg-green-500/10 text-green-800 dark:text-green-400',
    warning: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-400',
    danger: 'bg-red-100 dark:bg-red-500/10 text-red-800 dark:text-red-400',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
