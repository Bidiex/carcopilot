import React from 'react';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-card shadow-card dark:shadow-none dark:border dark:border-gray-700 p-6 transition-colors ${className}`} {...props}>
      {children}
    </div>
  );
};
