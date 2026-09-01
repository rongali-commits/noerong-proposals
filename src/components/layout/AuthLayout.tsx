import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-ivory-100">
      <header className="border-b border-ink-200/50">
        <Container>
          <div className="h-16 flex items-center justify-between">
            <Link to="/" aria-label="Noerong Proposals home">
              <Logo />
            </Link>
            <Link
              to="/"
              className="text-sm text-ink-500 hover:text-ink-900 transition-colors"
            >
              Back to home
            </Link>
          </div>
        </Container>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  );
}
