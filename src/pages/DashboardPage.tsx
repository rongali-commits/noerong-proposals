import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2,
  AlertCircle,
  FileText,
  Users,
  Plus,
  ArrowRight,
  Clock,
  TrendingUp,
  CheckCircle2,
  CalendarClock,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card, CardBody } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/SectionHeading';
import { StatusBadge } from '@/components/proposals/StatusBadge';
import { OnboardingChecklist, SampleDataBanner, SampleBadge, SampleDataActions, SampleConfirmDialogs } from '@/components/dashboard/Onboarding';
import { useAuth } from '@/lib/auth-context';
import { fetchDashboardData, type DashboardData } from '@/lib/dashboard';
import { usePageTitle } from '@/lib/use-page-title';
import { loadSampleWorkspace, removeSampleWorkspace } from '@/lib/sample-data';
import { formatCurrency } from '@/lib/calculations';
import type { ProposalStatus } from '@/types/database';

function formatCurrencyList(totals: { currency: string; total: number }[]): string {
  if (totals.length === 0) return formatCurrency(0, 'USD');
  return totals.map((t) => formatCurrency(t.total, t.currency)).join(' + ');
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function eventLabel(eventType: string): string {
  const labels: Record<string, string> = {
    created: 'Proposal created',
    sent: 'Proposal sent',
    viewed: 'Proposal viewed',
    commented: 'Comment added',
    accepted: 'Proposal accepted',
    rejected: 'Proposal declined',
    expired: 'Proposal expired',
  };
  return labels[eventType] ?? eventType;
}

const statusOrder: ProposalStatus[] = ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'];

export function DashboardPage() {
  usePageTitle('Dashboard - Noerong Proposals');
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [sampleRemoving, setSampleRemoving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboardData();
      setData(result);
    } catch {
      setError('Could not load your dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleLoadSample() {
    setSampleLoading(true);
    try {
      await loadSampleWorkspace();
      setShowLoadDialog(false);
      await load();
    } catch {
      setError('Could not load sample data. Please try again.');
    } finally {
      setSampleLoading(false);
    }
  }

  async function handleRemoveSample() {
    setSampleRemoving(true);
    try {
      await removeSampleWorkspace();
      setShowRemoveDialog(false);
      await load();
    } catch {
      setError('Could not remove sample data. Please try again.');
    } finally {
      setSampleRemoving(false);
    }
  }

  const hasProposals = data
    ? Object.values(data.status_counts).some((c) => c > 0)
    : false;

  const hasSample = data?.has_sample_data ?? false;

  const checklist = [
    { label: 'Complete business settings', done: false, href: '/settings' },
    { label: 'Add a client', done: data ? data.active_clients > 0 : false, href: '/clients/new' },
    { label: 'Create a proposal', done: hasProposals, href: '/proposals/new' },
    { label: 'Prepare and share it', done: data ? data.status_counts.sent + data.status_counts.viewed + data.status_counts.accepted + data.status_counts.rejected + data.status_counts.expired > 0 : false },
    { label: 'Track the client decision', done: data ? data.status_counts.accepted + data.status_counts.rejected > 0 : false },
  ];

  return (
    <div className="py-10 md:py-14">
      <Container>
        {/* Header */}
        <div className="mb-10">
          <Eyebrow className="mb-3 block">Dashboard</Eyebrow>
          <h1 className="text-3xl md:text-4xl text-ink-900 font-serif">
            Welcome back
          </h1>
          <p className="mt-2 text-base text-ink-500">
            {user?.email ? `Signed in as ${user.email}` : 'Your proposal workspace is ready.'}
          </p>
        </div>

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
              <button
                onClick={load}
                className="mt-6 text-sm text-ink-700 underline underline-offset-4 hover:text-ink-900"
              >
                Try again
              </button>
            </div>
          </Card>
        )}

        {/* Empty state */}
        {!loading && !error && !hasProposals && data && (
          <div className="space-y-8">
            <OnboardingChecklist items={checklist} />
            <Card>
              <CardBody className="text-center py-16">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg border border-ink-200 text-ink-400 bg-ivory-100">
                  <FileText size={24} />
                </span>
                <h2 className="mt-6 text-xl text-ink-900 font-serif">
                  No proposals yet
                </h2>
                <p className="mt-2 text-sm text-ink-500 max-w-sm mx-auto">
                  Create your first proposal to start tracking views, comments, and client approvals.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <ButtonLink to="/proposals/new" size="md">
                    Create a proposal
                    <ArrowRight size={16} />
                  </ButtonLink>
                  <ButtonLink to="/clients/new" variant="outline" size="md">
                    <Users size={16} />
                    Add a client
                  </ButtonLink>
                </div>
                <div className="mt-8 pt-8 border-t border-ink-200/40">
                  <SampleDataActions
                    onLoad={() => setShowLoadDialog(true)}
                    onRemove={() => setShowRemoveDialog(true)}
                    loading={sampleLoading}
                    removing={sampleRemoving}
                    hasSample={hasSample}
                  />
                </div>
              </CardBody>
            </Card>

            {data.active_clients > 0 && (
              <div className="grid gap-6 sm:grid-cols-2">
                <Card>
                  <CardBody>
                    <p className="text-2xs font-medium uppercase tracking-[0.18em] text-ink-400">
                      Active clients
                    </p>
                    <p className="mt-3 text-3xl text-ink-900 font-serif tabular-nums">
                      {data.active_clients}
                    </p>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody className="flex items-center justify-center">
                    <ButtonLink to="/clients" variant="outline" size="sm">
                      View clients
                      <ArrowRight size={14} />
                    </ButtonLink>
                  </CardBody>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Main dashboard */}
        {!loading && !error && hasProposals && data && (
          <div className="space-y-8">
            {hasSample && (
              <SampleDataBanner onRemove={() => setShowRemoveDialog(true)} removing={sampleRemoving} />
            )}

            {/* Metrics */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Pipeline value */}
              <Card>
                <CardBody>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-2xs font-medium uppercase tracking-[0.18em] text-ink-400">
                      Pipeline value
                    </p>
                    <TrendingUp size={14} className="text-ink-300" />
                  </div>
                  <p className="mt-3 text-2xl text-ink-900 font-serif tabular-nums">
                    {formatCurrencyList(data.pipeline_by_currency)}
                  </p>
                  <p className="mt-1.5 text-xs text-ink-400">
                    Total of Sent and Viewed proposals{hasSample ? '. Includes sample data.' : ''}
                  </p>
                </CardBody>
              </Card>

              {/* Accepted value */}
              <Card>
                <CardBody>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-2xs font-medium uppercase tracking-[0.18em] text-ink-400">
                      Accepted value
                    </p>
                    <CheckCircle2 size={14} className="text-ink-300" />
                  </div>
                  <p className="mt-3 text-2xl text-ink-900 font-serif tabular-nums">
                    {formatCurrencyList(data.accepted_by_currency)}
                  </p>
                  <p className="mt-1.5 text-xs text-ink-400">
                    Total of Accepted proposals only{hasSample ? '. Includes sample data.' : ''}
                  </p>
                </CardBody>
              </Card>

              {/* Acceptance rate */}
              <Card>
                <CardBody>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-2xs font-medium uppercase tracking-[0.18em] text-ink-400">
                      Acceptance rate
                    </p>
                    <TrendingUp size={14} className="text-ink-300" />
                  </div>
                  <p className="mt-3 text-2xl text-ink-900 font-serif tabular-nums">
                    {data.acceptance_rate !== null
                      ? `${data.acceptance_rate}%`
                      : 'No decisions yet'}
                  </p>
                  <p className="mt-1.5 text-xs text-ink-400">
                    Accepted divided by all final decisions{hasSample ? '. Includes sample data.' : ''}
                  </p>
                </CardBody>
              </Card>

              {/* Active clients */}
              <Card>
                <CardBody>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-2xs font-medium uppercase tracking-[0.18em] text-ink-400">
                      Active clients
                    </p>
                    <Users size={14} className="text-ink-300" />
                  </div>
                  <p className="mt-3 text-2xl text-ink-900 font-serif tabular-nums">
                    {data.active_clients}
                  </p>
                  <p className="mt-1.5 text-xs text-ink-400">
                    Non-archived clients{hasSample ? '. Includes sample data.' : ''}
                  </p>
                </CardBody>
              </Card>
            </div>

            {/* Status counts */}
            <Card>
              <CardBody>
                <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400 mb-5">
                  Proposals by status
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {statusOrder.map((status) => (
                    <Link
                      key={status}
                      to={`/proposals`}
                      className="flex flex-col items-center gap-2 rounded-md border border-ink-200/40 bg-ivory-100/40 px-3 py-4 hover:border-ink-300 hover:bg-ivory-100 transition-colors"
                    >
                      <StatusBadge status={status} />
                      <span className="text-2xl text-ink-900 font-serif tabular-nums">
                        {data.status_counts[status]}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Quick actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <ButtonLink to="/proposals/new" size="md">
                <Plus size={16} />
                New proposal
              </ButtonLink>
              <ButtonLink to="/clients/new" variant="outline" size="md">
                <Users size={16} />
                New client
              </ButtonLink>
              {!hasSample && (
                <button
                  onClick={() => setShowLoadDialog(true)}
                  className="text-sm text-ink-500 underline underline-offset-4 hover:text-ink-900 self-center"
                >
                  Load sample workspace data
                </button>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Recent proposals */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardBody>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400">
                        Recent proposals
                      </h2>
                      <Link
                        to="/proposals"
                        className="text-xs text-ink-500 hover:text-ink-900 underline underline-offset-4"
                      >
                        View all
                      </Link>
                    </div>
                    {data.recent_proposals.length === 0 ? (
                      <p className="text-sm text-ink-400 py-8 text-center">
                        No proposals yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {data.recent_proposals.map((p) => (
                          <Link
                            key={p.id}
                            to={`/proposals/${p.id}`}
                            className="flex items-center justify-between gap-3 rounded-md border border-ink-200/40 px-4 py-3 hover:border-ink-300 hover:bg-ivory-100/60 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-ink-900 truncate">
                                  {p.title}
                                </p>
                                {p.is_sample && <SampleBadge />}
                              </div>
                              <p className="mt-0.5 text-xs text-ink-400">
                                {p.proposal_number}
                                {p.client_name ? ` - ${p.client_name}` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-sm text-ink-700 tabular-nums">
                                {formatCurrency(p.total, p.currency)}
                              </span>
                              <StatusBadge status={p.status} />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>

                {/* Upcoming expiries */}
                <Card>
                  <CardBody>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400 flex items-center gap-2">
                        <CalendarClock size={14} />
                        Expiring within 7 days
                      </h2>
                    </div>
                    {data.expiring_proposals.length === 0 ? (
                      <p className="text-sm text-ink-400 py-8 text-center">
                        No proposals expiring soon.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {data.expiring_proposals.map((p) => (
                          <Link
                            key={p.id}
                            to={`/proposals/${p.id}`}
                            className="flex items-center justify-between gap-3 rounded-md border border-ink-200/40 px-4 py-3 hover:border-ink-300 hover:bg-ivory-100/60 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-ink-900 truncate">
                                  {p.title}
                                </p>
                                {p.is_sample && <SampleBadge />}
                              </div>
                              <p className="mt-0.5 text-xs text-ink-400 flex items-center gap-1.5">
                                <Clock size={11} />
                                Expires {formatDate(p.expiry_date)}
                                {p.client_name ? ` - ${p.client_name}` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-sm text-ink-700 tabular-nums">
                                {formatCurrency(p.total, p.currency)}
                              </span>
                              <StatusBadge status={p.status} />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>

              {/* Recent activity */}
              <div className="lg:col-span-1">
                <Card>
                  <CardBody>
                    <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400 mb-5">
                      Recent activity
                    </h2>
                    {data.recent_activity.length === 0 ? (
                      <p className="text-sm text-ink-400 py-8 text-center">
                        No activity yet.
                      </p>
                    ) : (
                      <ol className="space-y-4">
                        {data.recent_activity.map((event, index) => (
                          <li key={event.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-ink-200 bg-ivory-100 text-ink-400 shrink-0">
                                <FileText size={11} />
                              </span>
                              {index < data.recent_activity.length - 1 && (
                                <span className="w-px flex-1 bg-ink-200/40 mt-1" />
                              )}
                            </div>
                            <div className="pb-1 min-w-0">
                              <p className="text-sm text-ink-700 truncate">
                                {eventLabel(event.event_type)}
                              </p>
                              <p className="text-xs text-ink-400 mt-0.5 truncate">
                                {event.proposal_title}
                              </p>
                              <p className="text-xs text-ink-300 mt-0.5">
                                {formatDateTime(event.created_at)}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        )}

        <SampleConfirmDialogs
          showLoad={showLoadDialog}
          showRemove={showRemoveDialog}
          onLoadConfirm={handleLoadSample}
          onRemoveConfirm={handleRemoveSample}
          onLoadCancel={() => setShowLoadDialog(false)}
          onRemoveCancel={() => setShowRemoveDialog(false)}
          loadLoading={sampleLoading}
          removeLoading={sampleRemoving}
        />
      </Container>
    </div>
  );
}
