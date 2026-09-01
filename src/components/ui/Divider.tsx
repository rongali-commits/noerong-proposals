import { type ReactNode } from 'react';

type DividerProps = {
  className?: string;
};

export function Divider({ className = '' }: DividerProps) {
  return <hr className={`border-t border-ink-200/50 ${className}`} />;
}

type SpacerProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
};

const sizes = {
  sm: 'h-4',
  md: 'h-8',
  lg: 'h-16',
  xl: 'h-24',
};

export function Spacer({ size = 'md', className = '' }: SpacerProps) {
  return <div className={`${sizes[size]} ${className}`} />;
}

type TagProps = {
  children: ReactNode;
  className?: string;
};

export function Tag({ children, className = '' }: TagProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm text-ink-500 ${className}`}>
      {children}
    </span>
  );
}
