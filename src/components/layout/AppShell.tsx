import { type ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '@/components/ui/Logo';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Proposals', href: '/proposals', icon: FileText },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const isActive = (href: string) =>
    href === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-ivory-100 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-ink-200/50 bg-ivory-50 sticky top-0 h-screen">
        <div className="h-16 flex items-center px-5 border-b border-ink-200/50">
          <Link to="/dashboard" aria-label="Noerong Proposals dashboard">
            <Logo />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1" aria-label="Primary">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  active
                    ? 'bg-ink-900 text-ivory-50'
                    : 'text-ink-500 hover:text-ink-900 hover:bg-ivory-200/60'
                }`}
              >
                <item.icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-6 space-y-3">
          <Link
            to="/proposals/new"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-md bg-lime-300 text-ink-900 text-sm font-medium hover:bg-lime-400 transition-colors"
          >
            <Plus size={16} />
            New proposal
          </Link>

          <div className="border-t border-ink-200/50 pt-3">
            <div className="px-3 mb-2">
              <p className="text-xs text-ink-400 truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-ink-500 hover:text-ink-900 hover:bg-ivory-200/60 transition-colors w-full"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-ink-900/20"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-ivory-50 border-r border-ink-200/50 flex flex-col">
            <div className="h-16 flex items-center justify-between px-5 border-b border-ink-200/50">
              <Link to="/dashboard" onClick={() => setMobileNavOpen(false)}>
                <Logo />
              </Link>
              <button
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close menu"
                className="text-ink-500 hover:text-ink-900"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-6 space-y-1" aria-label="Mobile">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                      active
                        ? 'bg-ink-900 text-ivory-50'
                        : 'text-ink-500 hover:text-ink-900 hover:bg-ivory-200/60'
                    }`}
                  >
                    <item.icon size={17} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="px-3 pb-6 space-y-3">
              <Link
                to="/proposals/new"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-md bg-lime-300 text-ink-900 text-sm font-medium hover:bg-lime-400 transition-colors"
              >
                <Plus size={16} />
                New proposal
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-ink-500 hover:text-ink-900 hover:bg-ivory-200/60 transition-colors w-full"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden h-16 flex items-center justify-between px-5 border-b border-ink-200/50 bg-ivory-50 sticky top-0 z-30">
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="text-ink-700"
          >
            <Menu size={22} />
          </button>
          <Link to="/dashboard" aria-label="Dashboard">
            <Logo showText={false} />
          </Link>
          <Link
            to="/proposals/new"
            aria-label="New proposal"
            className="text-ink-700"
          >
            <Plus size={22} />
          </Link>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
