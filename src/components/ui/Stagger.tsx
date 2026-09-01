import { type ReactNode } from 'react';

type StaggerProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'li' | 'article' | 'section';
};

export function Stagger({ children, delay = 0, className = '', as: Tag = 'div' }: StaggerProps) {
  return (
    <Tag
      className={`opacity-0 animate-fade-in ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
