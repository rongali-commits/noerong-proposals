import { type ButtonHTMLAttributes, type ReactNode, type AnchorHTMLAttributes, forwardRef } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

const variants: Record<Variant, string> = {
  primary:
    'bg-ink-900 text-ivory-50 hover:bg-ink-800 active:bg-ink-700',
  secondary:
    'bg-lime-300 text-ink-900 hover:bg-lime-400 active:bg-lime-500',
  ghost:
    'text-ink-600 hover:text-ink-900 hover:bg-ink-100/60',
  outline:
    'border border-ink-300 text-ink-700 hover:border-ink-400 hover:text-ink-900 hover:bg-ivory-100',
};

const sizes: Record<Size, string> = {
  sm: 'text-sm px-3.5 py-2',
  md: 'text-sm px-5 py-2.5',
  lg: 'text-base px-7 py-3.5',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
  return (
    <button ref={ref} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
});
Button.displayName = 'Button';

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function ButtonLink({ to, variant = 'primary', size = 'md', className = '', children, ...props }: ButtonLinkProps) {
  return (
    <Link to={to} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </Link>
  );
}
