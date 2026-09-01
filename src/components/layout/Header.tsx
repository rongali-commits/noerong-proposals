import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { ContainerWide } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

const navLinks = [
  { label: 'Workflow', href: '/#workflow' },
  { label: 'Outcomes', href: '/#outcomes' },
  { label: 'Features', href: '/#features' },
  { label: 'For teams', href: '/#audience' },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? 'bg-ivory-100/95 backdrop-blur-sm border-b border-ink-200/50'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <ContainerWide>
        <div className="flex h-16 items-center justify-between md:h-18">
          <Link to="/" className="flex items-center" aria-label="Noerong Proposals home">
            <Logo />
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-ink-500 hover:text-ink-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-ink-600 hover:text-ink-900 transition-colors font-medium"
            >
              Sign in
            </Link>
            <ButtonLink to="/signup" size="sm">
              Get started
            </ButtonLink>
          </div>

          <button
            className="md:hidden flex items-center justify-center h-10 w-10 -mr-2 text-ink-700"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </ContainerWide>

      {mobileOpen && (
        <div className="md:hidden border-t border-ink-200/50 bg-ivory-100">
          <ContainerWide>
            <nav className="flex flex-col gap-1 py-4" aria-label="Mobile">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-2 py-3 text-sm text-ink-600 hover:text-ink-900 rounded-md hover:bg-ivory-200 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <hr className="my-2 border-ink-200/50" />
              <Link
                to="/login"
                className="px-2 py-3 text-sm text-ink-600 hover:text-ink-900 rounded-md hover:bg-ivory-200 transition-colors"
              >
                Sign in
              </Link>
              <div className="px-2 pt-2">
                <ButtonLink to="/signup" size="md" className="w-full">
                  Get started
                </ButtonLink>
              </div>
            </nav>
          </ContainerWide>
        </div>
      )}
    </header>
  );
}
