import React from 'react';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-white rounded-card shadow-card p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};
