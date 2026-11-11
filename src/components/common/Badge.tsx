import React from 'react';

export type BadgeVariant =
  | 'confirmed'
  | 'pending'
  | 'cancelled'
  | 'completed'
  | 'submitted'
  | 'acknowledged'
  | 'closed'
  | 'verified'
  | 'unverified'
  | 'video'
  | 'in_person'
  | 'info'
  | 'teal';

export interface BadgeProps {
  variant: BadgeVariant | string;
  children?: React.ReactNode;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant,
  children,
  size = 'md',
  dot = false,
  className = '',
}) => {
  const styles: Record<string, { bg: string; text: string; dotColor: string; defaultLabel: string }> = {
    confirmed: {
      bg: 'bg-emerald-50 border border-emerald-200/80',
      text: 'text-emerald-700',
      dotColor: 'bg-emerald-500',
      defaultLabel: 'Confirmed',
    },
    pending: {
      bg: 'bg-amber-50 border border-amber-200/80',
      text: 'text-amber-700',
      dotColor: 'bg-amber-500',
      defaultLabel: 'Pending',
    },
    cancelled: {
      bg: 'bg-rose-50 border border-rose-200/80',
      text: 'text-rose-700',
      dotColor: 'bg-rose-500',
      defaultLabel: 'Cancelled',
    },
    completed: {
      bg: 'bg-slate-100 border border-slate-200',
      text: 'text-slate-700',
      dotColor: 'bg-slate-500',
      defaultLabel: 'Completed',
    },
    submitted: {
      bg: 'bg-rose-50 border border-rose-200/80',
      text: 'text-rose-700',
      dotColor: 'bg-rose-500 animate-pulse',
      defaultLabel: 'Request Submitted',
    },
    acknowledged: {
      bg: 'bg-amber-50 border border-amber-200/80',
      text: 'text-amber-700',
      dotColor: 'bg-amber-500',
      defaultLabel: 'Acknowledged',
    },
    closed: {
      bg: 'bg-slate-100 border border-slate-200',
      text: 'text-slate-600',
      dotColor: 'bg-slate-400',
      defaultLabel: 'Closed',
    },
    verified: {
      bg: 'bg-teal-50 border border-teal-200',
      text: 'text-teal-700',
      dotColor: 'bg-teal-500',
      defaultLabel: 'Verified Doctor',
    },
    unverified: {
      bg: 'bg-slate-50 border border-slate-200',
      text: 'text-slate-500',
      dotColor: 'bg-slate-400',
      defaultLabel: 'Verification Pending',
    },
    video: {
      bg: 'bg-teal-50 border border-teal-200',
      text: 'text-teal-700',
      dotColor: 'bg-teal-500',
      defaultLabel: 'Video Call',
    },
    in_person: {
      bg: 'bg-indigo-50 border border-indigo-200',
      text: 'text-indigo-700',
      dotColor: 'bg-indigo-500',
      defaultLabel: 'In-Person',
    },
    info: {
      bg: 'bg-sky-50 border border-sky-200',
      text: 'text-sky-700',
      dotColor: 'bg-sky-500',
      defaultLabel: 'Info',
    },
    teal: {
      bg: 'bg-teal-50 border border-teal-200',
      text: 'text-teal-800',
      dotColor: 'bg-teal-600',
      defaultLabel: 'RuralCare 360',
    },
  };

  const current = styles[variant] || styles.info;
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${current.bg} ${current.text} ${sizeClasses} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${current.dotColor}`} />}
      {children || current.defaultLabel}
    </span>
  );
};

