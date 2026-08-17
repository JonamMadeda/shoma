'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, type, className = '', ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const isPassword = type === 'password';

    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="block text-sm font-medium text-muted-medium">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={isPassword && visible ? 'text' : type}
            className={`block w-full rounded-lg border bg-white px-3 py-2 text-sm text-foreground placeholder-muted transition-colors focus:outline-none focus:ring-1 ${
              isPassword ? 'pr-10' : ''
            } ${
              error
                ? 'border-red-300 focus:border-red-400 focus:ring-red-400'
                : 'border-border focus:border-accent focus:ring-accent/20'
            } ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
