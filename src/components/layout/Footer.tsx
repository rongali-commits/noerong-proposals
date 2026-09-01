import { Link } from 'react-router-dom';
import { ContainerWide } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';

const footerLinks = [
  {
    title: 'Product',
    links: [
      { label: 'Workflow', href: '/#workflow' },
      { label: 'Features', href: '/#features' },
      { label: 'Sample proposal', href: '/sample-proposal' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign in', href: '/login' },
      { label: 'Create account', href: '/signup' },
      { label: 'Reset password', href: '/forgot-password' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/#about' },
      { label: 'Contact', href: '/#contact' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-ink-200/50 bg-ivory-100 mt-30">
      <ContainerWide>
        <div className="py-16 md:py-20">
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <Link to="/" aria-label="Noerong Proposals home">
                <Logo />
              </Link>
              <p className="mt-4 max-w-xs text-sm text-ink-500 leading-relaxed">
                A white-label proposal, pricing, and client approval platform for
                independent teams.
              </p>
            </div>

            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
              {footerLinks.map((group) => (
                <div key={group.title}>
                  <h3 className="text-2xs font-medium uppercase tracking-[0.18em] text-ink-400 mb-4">
                    {group.title}
                  </h3>
                  <ul className="space-y-3">
                    {group.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          to={link.href}
                          className="text-sm text-ink-500 hover:text-ink-900 transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-ink-200/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-xs text-ink-400">
              &copy; {new Date().getFullYear()} Noerong Proposals. All rights reserved.
            </p>
            <p className="text-xs text-ink-400">
              Built for freelancers, consultants, and small agencies. Built with Bolt.
            </p>
          </div>
        </div>
      </ContainerWide>
    </footer>
  );
}
