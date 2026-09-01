import { type ReactNode } from 'react';

type ContainerProps = {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'main' | 'article' | 'header' | 'footer' | 'nav';
};

export function Container({ children, className = '', as: Tag = 'div' }: ContainerProps) {
  return <Tag className={`mx-auto w-full max-w-6xl px-6 md:px-8 lg:px-10 ${className}`}>{children}</Tag>;
}

export function ContainerWide({ children, className = '', as: Tag = 'div' }: ContainerProps) {
  return <Tag className={`mx-auto w-full max-w-7xl px-6 md:px-8 lg:px-10 ${className}`}>{children}</Tag>;
}
