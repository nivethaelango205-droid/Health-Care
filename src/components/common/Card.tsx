import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padded?: boolean;
  borderVariant?: 'default' | 'teal' | 'emergency';
}

export const Card: React.FC<CardProps> = ({
  children,
  hover = false,
  padded = true,
  borderVariant = 'default',
  className = '',
  ...props
}) => {
  const borderStyles = {
    default: 'border-slate-200/80',
    teal: 'border-teal-200 bg-teal-50/20',
    emergency: 'border-emergency-200 bg-emergency-50/20',
  };

  return (
    <div
      className={`bg-white rounded-xl border ${borderStyles[borderVariant]} shadow-card ${
        hover ? 'transition-all duration-200 hover:shadow-card-hover hover:border-slate-300' : ''
      } ${padded ? 'p-6' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

