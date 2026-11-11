import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 bg-white rounded-xl border border-dashed border-slate-200 ${className}`}>
      <div className="h-14 w-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3.5 shadow-sm">
        {icon}
      </div>
      <h4 className="text-base font-semibold text-navy-900 mb-1">{title}</h4>
      <p className="text-sm text-brandMuted max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

