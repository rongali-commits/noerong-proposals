import { type ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'section' | 'li';
};

export function Card({ children, className = '', as: Tag = 'div' }: CardProps) {
  return (
    <Tag className={`bg-ivory-50 border border-ink-200/60 rounded-lg ${className}`}>
      {children}
    </Tag>
  );
}

type CardBodyProps = {
  children: ReactNode;
  className?: string;
};

export function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={`p-6 md:p-7 ${className}`}>{children}</div>;
}

type CardHeaderProps = {
  children: ReactNode;
  className?: string;
};

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <div className={`p-6 md:p-7 pb-0 ${className}`}>{children}</div>;
}
