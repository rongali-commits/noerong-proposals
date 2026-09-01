import { type ReactNode } from 'react';

type LogoProps = {
  className?: string;
  showText?: boolean;
};

export function Logo({ className = '', showText = true }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className="flex h-8 w-8 items-center justify-center rounded-md bg-ink-900 text-ivory-50"
        aria-hidden="true"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3.5V12.5L8 8L13 3.5V12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {showText && (
        <span className="font-serif text-lg font-medium tracking-tight text-ink-900">
          Noerong <span className="text-ink-400 font-normal">Proposals</span>
        </span>
      )}
    </span>
  );
}

type BrandMarkProps = {
  children?: ReactNode;
  className?: string;
};

export function BrandMark({ children, className = '' }: BrandMarkProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="flex h-2.5 w-2.5 rounded-full bg-lime-400"
        aria-hidden="true"
      />
      {children}
    </span>
  );
}
