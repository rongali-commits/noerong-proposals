import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/proposals/StatusBadge';
import { fetchProposals, type ProposalWithClient } from '@/lib/proposals';
import { formatCurrency } from '@/lib/calculations';
import { SampleBadge } from '@/components/dashboard/Onboarding';
import type { ProposalStatus } from '@/types/database';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatExpiry(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const statusFilters: ('all' | ProposalStatus)[] = [
  'all', 'draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired',
];

export function ProposalListPage() {
  const [proposals, setProposals] = useState<ProposalWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProposalStatus>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProposals();
      setProposals(data);
    } catch {
      setError('Could not load proposals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let result = proposals;
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.proposal_number.toLowerCase().includes(q) ||
          (p.clients?.name ?? '').toLowerCase().includes(q),
      );
    }
    return result;
  }, [proposals, search, statusFilter]);

  const totalValue = useMemo(
    () => filtered.reduce((sum, p) => sum + p.total, 0),
    [filtered],
  );

  return (
    <div className="py-10 md:py-14">
      <Container>
        <PageHeader
          title="Proposals"
          actions={
            <ButtonLink to="/proposals/new" size="md">
              <Plus size={16} />
              New proposal
            </ButtonLink>
          }
        />

        {/* Search + status filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="relative max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, number, client..."
              aria-label="Search proposals"
              className="w-full rounded-md border border-ink-200 bg-ivory-50 pl-9 pr-3 py-2 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-400/30 focus:border-ink-400"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-md border border-ink-200/60 bg-ivory-50 p-1 w-fit">
            {statusFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors capitalize ${
                  statusFilter === filter
                    ? 'bg-ink-900 text-ivory-50'
                    : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Summary bar */}
        {!loading && !error && filtered.length > 0 && (
          <div className="mb-4 flex items-center gap-4 text-sm text-ink-500">
            <span>
              {filtered.length} {filtered.length === 1 ? 'proposal' : 'proposals'}
            </span>
            <span className="text-ink-300">|</span>
            <span className="tabular-nums">
              {formatCurrency(totalValue, filtered[0]?.currency ?? 'USD')} total value
            </span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-ink-400" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <Card>
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-error-100 bg-error-50 text-error-600">
                <AlertCircle size={22} />
              </span>
              <p className="mt-4 text-sm text-ink-500">{error}</p>
              <Button variant="outline" size="sm" className="mt-6" onClick={load}>
                Try again
              </Button>
            </div>
          </Card>
        )}

        {/* Empty */}
        {!loading && !error && proposals.length === 0 && (
          <Card>
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg border border-ink-200 text-ink-400 bg-ivory-100">
                <FileText size={24} />
              </span>
              <h2 className="mt-6 text-lg text-ink-900 font-serif">No proposals yet</h2>
              <p className="mt-2 text-sm text-ink-500 max-w-sm">
                Create your first proposal to start tracking scope, pricing, and client approvals.
              </p>
              <ButtonLink to="/proposals/new" size="md" className="mt-8">
                <Plus size={16} />
                New proposal
              </ButtonLink>
            </div>
          </Card>
        )}

        {/* No search results */}
        {!loading && !error && proposals.length > 0 && filtered.length === 0 && (
          <Card>
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-ink-200 text-ink-400 bg-ivory-100">
                <Search size={20} />
              </span>
              <h2 className="mt-4 text-sm text-ink-700 font-medium">No results found</h2>
              <p className="mt-1 text-sm text-ink-400">
                No proposals match your search or filter.
              </p>
              <button
                onClick={() => { setSearch(''); setStatusFilter('all'); }}
                className="mt-4 text-sm text-ink-700 underline underline-offset-4 hover:text-ink-900"
              >
                Clear filters
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
                    <th className="text-left text-2xs font-medium uppercase tracking-wider text-ink-400 px-6 py-3">Number</th>
                    <th className="text-left text-2xs font-medium uppercase tracking-wider text-ink-400 px-6 py-3">Title</th>
                    <th className="text-left text-2xs font-medium uppercase tracking-wider text-ink-400 px-6 py-3">Client</th>
                    <th className="text-left text-2xs font-medium uppercase tracking-wider text-ink-400 px-6 py-3">Status</th>
                    <th className="text-right text-2xs font-medium uppercase tracking-wider text-ink-400 px-6 py-3">Total</th>
                    <th className="text-right text-2xs font-medium uppercase tracking-wider text-ink-400 px-6 py-3">Expiry</th>
                    <th className="text-right text-2xs font-medium uppercase tracking-wider text-ink-400 px-6 py-3">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-ink-200/40 last:border-0 hover:bg-ivory-200/40 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/proposals/${p.id}`}
                          className="inline-block whitespace-nowrap text-sm font-medium text-ink-900 hover:underline underline-offset-4"
                        >
                          {p.proposal_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-600 max-w-xs truncate">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{p.title}</span>
                          {p.is_sample && <SampleBadge />}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-500">
                        {p.clients?.name ?? ''}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-ink-700 tabular-nums">
                        {formatCurrency(p.total, p.currency)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-ink-400">
                        {formatExpiry(p.expiry_date)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-ink-400">
                        {formatDate(p.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((p) => (
                <Card key={p.id}>
                  <Link to={`/proposals/${p.id}`} className="block p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-ink-400">{p.proposal_number}</p>
                        <div className="flex items-center gap-2">
                          <p className="mt-0.5 text-sm font-medium text-ink-900 truncate">
                            {p.title}
                          </p>
                          {p.is_sample && <SampleBadge />}
                        </div>
                        {p.clients?.name && (
                          <p className="mt-0.5 text-sm text-ink-500 truncate">
                            {p.clients.name}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
                      <span className="tabular-nums text-ink-700">
                        {formatCurrency(p.total, p.currency)}
                      </span>
                      <span>Updated {formatDate(p.updated_at)}</span>
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
