import { Container } from '@/components/ui/Container';
import { usePageTitle } from '@/lib/use-page-title';

export function NotFoundPage() {
  usePageTitle('Page not found - Noerong Proposals');

  return (
    <div className="min-h-screen flex flex-col bg-ivory-100">
      <main className="flex-1 flex items-center justify-center px-4">
        <Container>
          <div className="text-center py-20">
            <p className="text-6xl text-ink-300 font-serif">404</p>
            <h1 className="mt-4 text-2xl text-ink-900 font-serif">Page not found</h1>
            <p className="mt-3 text-sm text-ink-500 max-w-sm mx-auto">
              The page you are looking for does not exist or may have moved.
            </p>
            <a
              href="/"
              className="mt-8 inline-block text-sm text-ink-700 underline underline-offset-4 hover:text-ink-900"
            >
              Return home
            </a>
          </div>
        </Container>
      </main>
    </div>
  );
}
