import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Users, AlertCircle, Loader2, Archive } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { fetchClients } from '@/lib/clients';
import { SampleBadge } from '@/components/dashboard/Onboarding';
import type { Client } from '@/types/database';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ClientListPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'active' | 'archived'>('active');

  const load = useCallback(async (archived: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClients(archived);
      setClients(data);
    } catch {
      setError('Could not load clients. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(view === 'archived');
  }, [view, load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
    );
  }, [clients, search]);

  return (
    <div className="py-10 md:py-14">
      <Container>
        <PageHeader
          title="Clients"
          actions={
            <ButtonLink to="/clients/new" size="md">
              <Plus size={16} />
              Add client
            </ButtonLink>
          }
        />

        {/* Search + tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, company, email..."
              aria-label="Search clients"
              className="w-full rounded-md border border-ink-200 bg-ivory-50 pl-9 pr-3 py-2 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-400/30 focus:border-ink-400"
            />
          </div>
          <div className="flex items-center gap-1 rounded-md border border-ink-200/60 bg-ivory-50 p-1">
            <button
              onClick={() => setView('active')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                view === 'active'
                  ? 'bg-ink-900 text-ivory-50'
                  : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setView('archived')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                view === 'archived'
                  ? 'bg-ink-900 text-ivory-50'
                  : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              Archived
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-ink-400" />
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <Card>
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-error-100 bg-error-50 text-error-600">
                <AlertCircle size={22} />
              </span>
              <p className="mt-4 text-sm text-ink-500">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-6"
                onClick={() => load(view === 'archived')}
              >
                Try again
              </Button>
            </div>
          </Card>
        )}

        {/* Empty state */}
        {!loading && !error && clients.length === 0 && (
          <Card>
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg border border-ink-200 text-ink-400 bg-ivory-100">
                <Users size={24} />
              </span>
              <h2 className="mt-6 text-lg text-ink-900 font-serif">
                {view === 'active' ? 'No active clients yet' : 'No archived clients'}
              </h2>
              <p className="mt-2 text-sm text-ink-500 max-w-sm">
                {view === 'active'
                  ? 'Add your first client to start organizing your proposal workflow.'
                  : 'Archived clients will appear here when you archive them.'}
              </p>
              {view === 'active' && (
                <ButtonLink to="/clients/new" size="md" className="mt-8">
                  <Plus size={16} />
                  Add client
                </ButtonLink>
              )}
            </div>
          </Card>
        )}

        {/* No search results */}
        {!loading && !error && clients.length > 0 && filtered.length === 0 && (
          <Card>
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-ink-200 text-ink-400 bg-ivory-100">
                <Search size={20} />
              </span>
              <h2 className="mt-4 text-sm text-ink-700 font-medium">No results found</h2>
              <p className="mt-1 text-sm text-ink-400">
                No clients match "{search}". Try a different search.
              </p>
              <button
                onClick={() => setSearch('')}
                className="mt-4 text-sm text-ink-700 underline underline-offset-4 hover:text-ink-900"
              >
                Clear search
              </button>
            </div>
          </Card>
        )}

        {/* Desktop table */}
        {!loading && !error && filtered.length > 0 && (
          <>
            <Card className="hidden md:block overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ink-200/50">
                    <th className="text-left text-2xs font-medium uppercase tracking-wider text-ink-400 px-6 py-3">
                      Name
                    </th>
                    <th className="text-left text-2xs font-medium uppercase tracking-wider text-ink-400 px-6 py-3">
                      Company
                    </th>
                    <th className="text-left text-2xs font-medium uppercase tracking-wider text-ink-400 px-6 py-3">
                      Email
                    </th>
                    <th className="text-left text-2xs font-medium uppercase tracking-wider text-ink-400 px-6 py-3">
                      Phone
                    </th>
                    <th className="text-right text-2xs font-medium uppercase tracking-wider text-ink-400 px-6 py-3">
                      Proposals
                    </th>
                    <th className="text-right text-2xs font-medium uppercase tracking-wider text-ink-400 px-6 py-3">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-ink-200/40 last:border-0 hover:bg-ivory-200/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/clients/${client.id}`}
                            className="text-sm font-medium text-ink-900 hover:underline underline-offset-4"
                          >
                            {client.name}
                          </Link>
                          {client.is_sample && <SampleBadge />}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-500">
                        {client.company || ''}
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-500">
                        {client.email || ''}
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-500">
                        {client.phone || ''}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-ink-400">
                        {''}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-ink-400">
                        {formatDate(client.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((client) => (
                <Card key={client.id}>
                  <Link to={`/clients/${client.id}`} className="block p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-ink-900 truncate">
                            {client.name}
                          </p>
                          {client.is_sample && <SampleBadge />}
                        </div>
                        {client.company && (
                          <p className="mt-0.5 text-sm text-ink-500 truncate">
                            {client.company}
                          </p>
                        )}
                      </div>
                      {client.archived && (
                        <Badge variant="neutral">
                          <Archive size={11} />
                          Archived
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 flex flex-col gap-1 text-xs text-ink-400">
                      {client.email && <span className="truncate">{client.email}</span>}
                      {client.phone && <span>{client.phone}</span>}
                      <span>Updated {formatDate(client.updated_at)}</span>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          </>
        )}
      </Container>
    </div>
  );
}
