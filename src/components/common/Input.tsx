import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, className = '', id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(7);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`block w-full rounded-lg border text-sm transition-colors duration-150 py-2.5 ${
              leftIcon ? 'pl-10' : 'pl-3.5'
            } pr-3.5 bg-white text-navy-900 placeholder:text-slate-400 ${
              error
                ? 'border-emergency-500 focus:border-emergency-500 focus:ring-1 focus:ring-emergency-500'
                : 'border-slate-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600'
            } disabled:bg-slate-50 disabled:text-slate-500 ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <p className="mt-1 text-xs text-emergency-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

