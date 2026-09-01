import { type ReactNode } from 'react';

type BadgeProps = {
  children: ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error' | 'neutral';
  className?: string;
};

const variants = {
  default: 'bg-ink-100 text-ink-600 border-ink-200',
  accent: 'bg-lime-100 text-lime-700 border-lime-200',
  success: 'bg-success-100 text-success-700 border-success-100',
  warning: 'bg-warning-100 text-warning-700 border-warning-100',
  error: 'bg-error-100 text-error-700 border-error-100',
  neutral: 'bg-ivory-200 text-ink-500 border-ink-200/60',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-2xs font-medium uppercase tracking-wider ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
