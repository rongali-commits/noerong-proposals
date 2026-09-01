import { type ReactNode } from 'react';

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className = '',
}: SectionHeadingProps) {
  const alignment = align === 'center' ? 'text-center mx-auto' : 'text-left';
  return (
    <div className={`max-w-2xl ${alignment} ${className}`}>
      {eyebrow && (
        <p className="text-2xs font-medium uppercase tracking-[0.18em] text-ink-400 mb-4">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl md:text-4xl text-ink-900 text-balance">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base md:text-lg text-ink-500 leading-relaxed text-pretty">
          {description}
        </p>
      )}
    </div>
  );
}

type EyebrowProps = {
  children: ReactNode;
  className?: string;
};

export function Eyebrow({ children, className = '' }: EyebrowProps) {
  return (
    <p className={`text-2xs font-medium uppercase tracking-[0.18em] text-ink-400 ${className}`}>
      {children}
    </p>
  );
}
