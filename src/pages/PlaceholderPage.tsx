import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { type LucideIcon, ArrowLeft } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

type PlaceholderPageProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction: { label: string; to: string };
  secondaryAction?: { label: string; to: string };
  children?: ReactNode;
};

export function PlaceholderPage({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
}: PlaceholderPageProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-200/50">
        <Container>
          <div className="h-16 flex items-center justify-between">
            <Link to="/" aria-label="Noerong Proposals home">
              <Logo />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 transition-colors"
            >
              <ArrowLeft size={15} />
              Back to home
            </Link>
          </div>
        </Container>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg border border-ink-200 text-ink-400 bg-ivory-50">
            <Icon size={24} />
          </span>
          <h1 className="mt-8 text-3xl text-ink-900 font-serif text-balance">
            {title}
          </h1>
          <p className="mt-4 text-base text-ink-500 leading-relaxed text-pretty">
            {description}
          </p>

          {children}

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <ButtonLink to={primaryAction.to} size="md">
              {primaryAction.label}
            </ButtonLink>
            {secondaryAction && (
              <ButtonLink to={secondaryAction.to} variant="outline" size="md">
                {secondaryAction.label}
              </ButtonLink>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
