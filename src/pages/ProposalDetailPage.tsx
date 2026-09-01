import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Pencil,
  Copy,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Send,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card, CardBody } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatusBadge } from '@/components/proposals/StatusBadge';
import { fetchProposalDetail, duplicateProposal, type ProposalDetail } from '@/lib/proposals';
import { prepareProposal } from '@/lib/public-proposal';
import { formatCurrency } from '@/lib/calculations';
import type { ActivityEvent } from '@/types/database';

function formatDate(iso: string): string {
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
    year: 'numeric',
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
    rejected: 'Proposal rejected',
    expired: 'Proposal expired',
  };
  return labels[eventType] ?? eventType;
}

export function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.successMessage as string | undefined;

  const [detail, setDetail] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [showPrepareDialog, setShowPrepareDialog] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async (proposalId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProposalDetail(proposalId);
      if (!data) {
        setError('Proposal not found.');
        return;
      }
      setDetail(data);
    } catch {
      setError('Could not load proposal. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) load(id);
  }, [id, load]);

  async function handleDuplicate() {
    if (!detail) return;
    setDuplicating(true);
    try {
      const newProposal = await duplicateProposal(detail.proposal.id);
      navigate(`/proposals/${newProposal.id}`, {
        state: { successMessage: 'Proposal duplicated as a new draft.' },
      });
    } catch {
      setError('Could not duplicate proposal. Please try again.');
    } finally {
      setDuplicating(false);
    }
  }

  async function handlePrepare() {
    if (!detail) return;
    setPreparing(true);
    try {
      const result = await prepareProposal(detail.proposal.id);
      const origin = window.location.origin;
      setPublicUrl(`${origin}/p/${result.public_token}`);
      setShowPrepareDialog(false);
      await load(detail.proposal.id);
    } catch {
      setError('Could not prepare proposal. Please try again.');
    } finally {
      setPreparing(false);
    }
  }

  function handleCopyLink() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="py-10 md:py-14">
        <Container>
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-ink-400" />
          </div>
        </Container>
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="py-10 md:py-14">
        <Container>
          <PageHeader title="Proposal" backTo="/proposals" backLabel="Back to proposals" />
          <Card>
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-error-100 bg-error-50 text-error-600">
                <AlertCircle size={22} />
              </span>
              <p className="mt-4 text-sm text-ink-500">{error}</p>
              <ButtonLink to="/proposals" variant="outline" size="sm" className="mt-6">
                Back to proposals
              </ButtonLink>
            </div>
          </Card>
        </Container>
      </div>
    );
  }

  if (!detail) return null;

  const { proposal, items, client, activity } = detail;
  const isDraft = proposal.status === 'draft';
  const isShared = proposal.status !== 'draft';

  return (
    <div className="py-10 md:py-14">
      <Container>
        <Link
          to="/proposals"
          className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-700 transition-colors mb-4"
        >
          <ArrowLeft size={15} />
          Back to proposals
        </Link>

        {successMessage && (
          <div className="mb-6 rounded-md border border-lime-200 bg-lime-50/60 px-4 py-3">
            <p className="text-sm text-lime-800">{successMessage}</p>
          </div>
        )}

        {/* Public link banner */}
        {publicUrl && (
          <div className="mb-6 rounded-md border border-ink-200/60 bg-ivory-100 px-4 py-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-lime-100 text-lime-700 shrink-0">
                <Check size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-900">Proposal is ready to share</p>
                <p className="mt-1 text-xs text-ink-500">
                  Noerong does not email the client automatically in this version. Copy the link below and send it to your client.
                </p>
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="flex-1 rounded-md border border-ink-200 bg-ivory-50 px-3 py-2 text-sm text-ink-700"
                    onFocus={(e) => e.target.select()}
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyLink}>
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy link'}
                    </Button>
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <ExternalLink size={14} />
                        Open
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-ink-400">{proposal.proposal_number}</span>
              <StatusBadge status={proposal.status} />
            </div>
            <h1 className="text-2xl md:text-3xl text-ink-900 font-serif">
              {proposal.title}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isDraft && (
              <>
                <ButtonLink to={`/proposals/${proposal.id}/edit`} variant="outline" size="sm">
                  <Pencil size={14} />
                  Edit
                </ButtonLink>
                <Button
                  size="sm"
                  onClick={() => setShowPrepareDialog(true)}
                >
                  <Send size={14} />
                  Prepare &amp; share
                </Button>
              </>
            )}
            {isShared && !publicUrl && proposal.public_token && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const origin = window.location.origin;
                  setPublicUrl(`${origin}/p/${proposal.public_token}`);
                }}
              >
                <ExternalLink size={14} />
                View public link
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDuplicateDialog(true)}
            >
              <Copy size={14} />
              Duplicate
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client info */}
            {client && (
              <Card>
                <CardBody>
                  <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400 mb-4">
                    Client
                  </h2>
                  <p className="text-base text-ink-900 font-medium">{client.name}</p>
                  {client.company && (
                    <p className="mt-0.5 text-sm text-ink-500">{client.company}</p>
                  )}
                  <dl className="mt-4 space-y-2">
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm text-ink-500">
                        <Mail size={14} className="text-ink-300" />
                        <a href={`mailto:${client.email}`} className="hover:underline underline-offset-4">
                          {client.email}
                        </a>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm text-ink-500">
                        <Phone size={14} className="text-ink-300" />
                        {client.phone}
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-start gap-2 text-sm text-ink-500">
                        <MapPin size={14} className="text-ink-300 mt-0.5 shrink-0" />
                        <span className="whitespace-pre-line">{client.address}</span>
                      </div>
                    )}
                  </dl>
                </CardBody>
              </Card>
            )}

            {/* Itemized scope */}
            <Card>
              <CardBody>
                <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400 mb-5">
                  Scope of work
                </h2>
                <div className="space-y-4">
                  {items.map((item) => {
                    const gross = item.quantity * item.rate;
                    const discounted = gross * (1 - item.discount / 100);
                    const lineTotal = Math.round((discounted + Number.EPSILON) * 100) / 100;
                    return (
                      <div key={item.id} className="border-b border-ink-200/40 last:border-0 pb-4 last:pb-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-ink-900">
                              {item.description}
                            </p>
                            {item.detail && (
                              <p className="mt-1 text-sm text-ink-500 whitespace-pre-line">
                                {item.detail}
                              </p>
                            )}
                            <p className="mt-2 text-xs text-ink-400">
                              {item.quantity} × {formatCurrency(item.rate, proposal.currency)}
                              {item.discount > 0 && ` (−${item.discount}%)`}
                            </p>
                          </div>
                          <p className="text-sm text-ink-700 tabular-nums shrink-0">
                            {formatCurrency(lineTotal, proposal.currency)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <dl className="mt-6 pt-4 border-t border-ink-200/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <dt className="text-ink-500">Subtotal</dt>
                    <dd className="text-ink-700 tabular-nums">{formatCurrency(proposal.subtotal, proposal.currency)}</dd>
                  </div>
                  {proposal.discount_amount > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <dt className="text-ink-500">Proposal discount</dt>
                        <dd className="text-ink-700 tabular-nums">-{formatCurrency(proposal.discount_amount, proposal.currency)}</dd>
                      </div>
                      <div className="flex justify-between text-sm">
                        <dt className="text-ink-500">Taxable amount</dt>
                        <dd className="text-ink-700 tabular-nums">{formatCurrency(proposal.subtotal - proposal.discount_amount, proposal.currency)}</dd>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-sm">
                    <dt className="text-ink-500">Tax ({proposal.tax_rate}%)</dt>
                    <dd className="text-ink-700 tabular-nums">
                      {formatCurrency(
                        Math.round((proposal.subtotal - proposal.discount_amount) * proposal.tax_rate / 100 * 100) / 100,
                        proposal.currency,
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-ink-200/50">
                    <dt className="text-base font-medium text-ink-900">Total</dt>
                    <dd className="text-base font-medium text-ink-900 tabular-nums">
                      {formatCurrency(proposal.total, proposal.currency)}
                    </dd>
                  </div>
                </dl>
              </CardBody>
            </Card>

            {/* Notes */}
            {proposal.notes && (
              <Card>
                <CardBody>
                  <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400 mb-3">
                    Notes
                  </h2>
                  <p className="text-sm text-ink-600 leading-relaxed whitespace-pre-line">
                    {proposal.notes}
                  </p>
                </CardBody>
              </Card>
            )}

            {/* Terms */}
            {proposal.terms && (
              <Card>
                <CardBody>
                  <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400 mb-3">
                    Terms
                  </h2>
                  <p className="text-sm text-ink-600 leading-relaxed whitespace-pre-line">
                    {proposal.terms}
                  </p>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Details */}
            <Card>
              <CardBody>
                <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400 mb-5">
                  Details
                </h2>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-xs text-ink-400">Status</dt>
                    <dd className="mt-1"><StatusBadge status={proposal.status} /></dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-400 flex items-center gap-1.5">
                      <Calendar size={12} />
                      Expiry date
                    </dt>
                    <dd className="text-sm text-ink-700 mt-0.5">
                      {proposal.expiry_date ? formatDate(proposal.expiry_date) : 'No expiry'}
                    </dd>
                  </div>
                  {proposal.sent_at && (
                    <div>
                      <dt className="text-xs text-ink-400 flex items-center gap-1.5">
                        <Send size={12} />
                        Sent
                      </dt>
                      <dd className="text-sm text-ink-700 mt-0.5">
                        {formatDateTime(proposal.sent_at)}
                      </dd>
                    </div>
                  )}
                  {proposal.viewed_at && (
                    <div>
                      <dt className="text-xs text-ink-400 flex items-center gap-1.5">
                        <Clock size={12} />
                        First viewed
                      </dt>
                      <dd className="text-sm text-ink-700 mt-0.5">
                        {formatDateTime(proposal.viewed_at)}
                      </dd>
                    </div>
                  )}
                  {proposal.accepted_at && (
                    <div>
                      <dt className="text-xs text-ink-400 flex items-center gap-1.5">
                        <Check size={12} />
                        Accepted
                      </dt>
                      <dd className="text-sm text-ink-700 mt-0.5">
                        {formatDateTime(proposal.accepted_at)}
                      </dd>
                    </div>
                  )}
                  {proposal.rejected_at && (
                    <div>
                      <dt className="text-xs text-ink-400 flex items-center gap-1.5">
                        <Clock size={12} />
                        Declined
                      </dt>
                      <dd className="text-sm text-ink-700 mt-0.5">
                        {formatDateTime(proposal.rejected_at)}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs text-ink-400 flex items-center gap-1.5">
                      <Clock size={12} />
                      Created
                    </dt>
                    <dd className="text-sm text-ink-700 mt-0.5">
                      {formatDate(proposal.created_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-400 flex items-center gap-1.5">
                      <Clock size={12} />
                      Last updated
                    </dt>
                    <dd className="text-sm text-ink-700 mt-0.5">
                      {formatDate(proposal.updated_at)}
                    </dd>
                  </div>
                </dl>
              </CardBody>
            </Card>

            {/* Activity timeline */}
            <Card>
              <CardBody>
                <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400 mb-5">
                  Activity
                </h2>
                {activity.length === 0 ? (
                  <p className="text-sm text-ink-400">No activity recorded yet.</p>
                ) : (
                  <ol className="space-y-4">
                    {activity.map((event: ActivityEvent, index: number) => (
                      <li key={event.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-ink-200 bg-ivory-100 text-ink-400 shrink-0">
                            <FileText size={11} />
                          </span>
                          {index < activity.length - 1 && (
                            <span className="w-px flex-1 bg-ink-200/40 mt-1" />
                          )}
                        </div>
                        <div className="pb-1">
                          <p className="text-sm text-ink-700">{eventLabel(event.event_type)}</p>
                          <p className="text-xs text-ink-400 mt-0.5">
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

        <ConfirmDialog
          open={showDuplicateDialog}
          title="Duplicate this proposal?"
          message="A new draft proposal will be created with a new number and all the same content. You can edit it afterwards."
          confirmLabel="Duplicate"
          onConfirm={handleDuplicate}
          onCancel={() => setShowDuplicateDialog(false)}
          loading={duplicating}
        />

        <ConfirmDialog
          open={showPrepareDialog}
          title="Prepare &amp; share this proposal?"
          message={
            <>
              This will finalize the proposal and generate a secure public link. After sharing,
              the proposal can no longer be edited. Use Duplicate to create a revised version later.
            </>
          }
          confirmLabel="Prepare &amp; share"
          onConfirm={handlePrepare}
          onCancel={() => setShowPrepareDialog(false)}
          loading={preparing}
        />
      </Container>
    </div>
  );
}
