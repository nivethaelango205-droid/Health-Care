import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number; type?: 'card' | 'table' | 'line' }> = ({
  rows = 3,
  type = 'line',
}) => {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-slate-200 rounded-full" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
            <div className="h-3 bg-slate-100 rounded w-full" />
            <div className="h-3 bg-slate-100 rounded w-5/6" />
            <div className="pt-2 flex justify-between">
              <div className="h-8 bg-slate-200 rounded w-24" />
              <div className="h-8 bg-slate-200 rounded w-28" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-1/4 mb-4" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-none">
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-4 bg-slate-100 rounded w-1/4" />
            <div className="h-4 bg-slate-100 rounded w-1/6" />
            <div className="h-7 bg-slate-200 rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 bg-slate-200 rounded w-full" style={{ width: `${100 - (i % 3) * 15}%` }} />
      ))}
    </div>
  );
};

