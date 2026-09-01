import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  MessageSquare,
  Send,
  Printer,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  fetchPublicProposal,
  submitPublicComment,
  acceptPublicProposal,
  declinePublicProposal,
  type PublicProposalData,
  type PublicComment,
} from '@/lib/public-proposal';
import { formatCurrency } from '@/lib/calculations';

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
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function PublicProposalPage() {
  const { token } = useParams<{ token: string }>();

  const [data, setData] = useState<PublicProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Comment form
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Accept form
  const [acceptName, setAcceptName] = useState('');
  const [acceptAuthorized, setAcceptAuthorized] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [acceptSubmitting, setAcceptSubmitting] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);

  // Decline form
  const [declineName, setDeclineName] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [declineError, setDeclineError] = useState<string | null>(null);
  const [declineSubmitting, setDeclineSubmitting] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);

  const load = useCallback(async (t: string) => {
    setLoading(true);
    setNotFound(false);
    setError(null);
    try {
      const result = await fetchPublicProposal(t);
      if (!result) {
        setNotFound(true);
        return;
      }
      setData(result);
    } catch {
      setError('Could not load proposal. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) load(token);
  }, [token, load]);

  async function handleComment(e: FormEvent) {
    e.preventDefault();
    if (!token || !data) return;
    setCommentError(null);

    if (!commentAuthor.trim()) {
      setCommentError('Please enter your name.');
      return;
    }
    if (!commentBody.trim()) {
      setCommentError('Please enter a comment.');
      return;
    }
    if (commentBody.length > 1000) {
      setCommentError('Comment must be 1000 characters or fewer.');
      return;
    }

    setCommentSubmitting(true);
    try {
      const newComment: PublicComment = await submitPublicComment(
        token,
        commentAuthor.trim(),
        commentBody.trim(),
      );
      setData({
        ...data,
        comments: [...data.comments, newComment],
      });
      setCommentBody('');
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Could not add comment.');
    } finally {
      setCommentSubmitting(false);
    }
  }

  async function handleAccept() {
    if (!token || !data) return;
    setAcceptError(null);

    if (!acceptName.trim()) {
      setAcceptError('Please enter your full name.');
      return;
    }
    if (!acceptAuthorized) {
      setAcceptError('Please confirm you are authorized to approve this proposal.');
      return;
    }

    setAcceptSubmitting(true);
    try {
      await acceptPublicProposal(token, acceptName.trim(), acceptAuthorized);
      await load(token);
      setShowAcceptDialog(false);
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : 'Could not accept proposal.');
    } finally {
      setAcceptSubmitting(false);
    }
  }

  async function handleDecline() {
    if (!token || !data) return;
    setDeclineError(null);

    if (!declineName.trim()) {
      setDeclineError('Please enter your full name.');
      return;
    }
    if (declineReason.length > 1000) {
      setDeclineError('Reason must be 1000 characters or fewer.');
      return;
    }

    setDeclineSubmitting(true);
    try {
      await declinePublicProposal(token, declineName.trim(), declineReason.trim());
      await load(token);
      setShowDeclineDialog(false);
    } catch (err) {
      setDeclineError(err instanceof Error ? err.message : 'Could not decline proposal.');
    } finally {
      setDeclineSubmitting(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory-100">
        <Loader2 size={28} className="animate-spin text-ink-400" />
      </div>
    );
  }

  // Invalid link
  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory-100 px-4">
        <Card className="max-w-md w-full">
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg border border-ink-200 text-ink-400 bg-ivory-100">
              <AlertCircle size={26} />
            </span>
            <h1 className="mt-6 text-xl text-ink-900 font-serif">Invalid or expired link</h1>
            <p className="mt-2 text-sm text-ink-500 max-w-sm">
              This proposal link is not valid. Please contact the sender for a new link.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory-100 px-4">
        <Card className="max-w-md w-full">
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-error-100 bg-error-50 text-error-600">
              <AlertCircle size={22} />
            </span>
            <p className="mt-4 text-sm text-ink-500">{error ?? 'Something went wrong.'}</p>
            <Button variant="outline" size="sm" className="mt-6" onClick={() => token && load(token)}>
              Try again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const { business, client, proposal, items, comments } = data;
  const brandColor = business.brand_color || '#a8d61f';
  const status = proposal.status;
  const isExpired = status === 'expired';
  const isAccepted = status === 'accepted';
  const isRejected = status === 'rejected';
  const isActive = status === 'viewed' || status === 'sent';
  const canComment = isActive;
  const canDecide = isActive;

  const taxAmount = Math.round((proposal.subtotal - proposal.discount_amount) * proposal.tax_rate / 100 * 100) / 100;

  return (
    <div className="min-h-screen bg-ivory-100" style={{ ['--brand' as string]: brandColor }}>
      {/* Brand header bar */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: brandColor }}
      />

      <div className="py-10 md:py-16 print:py-6">
        <Container as="article" className="max-w-4xl">
          {/* Status banner */}
          {isAccepted && (
            <div className="mb-6 rounded-lg border border-success-200 bg-success-50 px-5 py-4 flex items-center gap-3">
              <CheckCircle2 size={24} className="text-success-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-success-800">Proposal accepted</p>
                <p className="mt-0.5 text-xs text-success-600">
                  {proposal.accepted_at && `Accepted on ${formatDateTime(proposal.accepted_at)}`}
                </p>
              </div>
            </div>
          )}
          {isRejected && (
            <div className="mb-6 rounded-lg border border-error-200 bg-error-50 px-5 py-4 flex items-center gap-3">
              <XCircle size={24} className="text-error-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-error-700">Proposal declined</p>
                <p className="mt-0.5 text-xs text-error-500">
                  {proposal.rejected_at && `Declined on ${formatDateTime(proposal.rejected_at)}`}
                </p>
              </div>
            </div>
          )}
          {isExpired && (
            <div className="mb-6 rounded-lg border border-warning-200 bg-warning-50 px-5 py-4 flex items-center gap-3">
              <Clock size={24} className="text-warning-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-warning-800">This proposal has expired</p>
                <p className="mt-0.5 text-xs text-warning-600">
                  The expiry date has passed. Please contact the sender if you need an extension.
                </p>
              </div>
            </div>
          )}

          {/* Proposal header */}
          <Card className="mb-6 print:border-ink-200">
            <CardBody>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  {business.name && (
                    <p className="text-sm font-medium text-ink-900">{business.name}</p>
                  )}
                  <p className="mt-1 text-xs text-ink-400">{proposal.proposal_number}</p>
                  <h1 className="mt-3 text-2xl md:text-3xl text-ink-900 font-serif">
                    {proposal.title}
                  </h1>
                </div>
                <div className="text-left sm:text-right">
                  {proposal.expiry_date && (
                    <p className="flex items-center gap-1.5 text-xs text-ink-400 sm:justify-end">
                      <Calendar size={12} />
                      Valid until {formatDate(proposal.expiry_date)}
                    </p>
                  )}
                  {proposal.sent_at && (
                    <p className="flex items-center gap-1.5 text-xs text-ink-400 mt-1 sm:justify-end">
                      <Send size={12} />
                      Sent {formatDate(proposal.sent_at)}
                    </p>
                  )}
                </div>
              </div>

              {/* Business contact */}
              {(business.contact_email || business.contact_phone || business.address) && (
                <dl className="mt-6 pt-4 border-t border-ink-200/50 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-ink-500">
                  {business.contact_email && (
                    <div>
                      <dt className="text-ink-400">Email</dt>
                      <dd className="mt-0.5">{business.contact_email}</dd>
                    </div>
                  )}
                  {business.contact_phone && (
                    <div>
                      <dt className="text-ink-400">Phone</dt>
                      <dd className="mt-0.5">{business.contact_phone}</dd>
                    </div>
                  )}
                  {business.address && (
                    <div>
                      <dt className="text-ink-400">Address</dt>
                      <dd className="mt-0.5 whitespace-pre-line">{business.address}</dd>
                    </div>
                  )}
                </dl>
              )}

              {/* Client */}
              {client && (
                <div className="mt-6 pt-4 border-t border-ink-200/50">
                  <p className="text-xs text-ink-400">Prepared for</p>
                  <p className="mt-1 text-sm font-medium text-ink-900">{client.name}</p>
                  {client.company && (
                    <p className="text-sm text-ink-500">{client.company}</p>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Scope of work */}
          <Card className="mb-6 print:break-inside-avoid">
            <CardBody>
              <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400 mb-5">
                Scope of work
              </h2>
              <div className="space-y-4">
                {items.map((item, index) => {
                  const gross = item.quantity * item.rate;
                  const discounted = gross * (1 - item.discount / 100);
                  const lineTotal = Math.round((discounted + Number.EPSILON) * 100) / 100;
                  return (
                    <div key={index} className="border-b border-ink-200/40 last:border-0 pb-4 last:pb-0">
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
                  <dd className="text-ink-700 tabular-nums">{formatCurrency(taxAmount, proposal.currency)}</dd>
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
            <Card className="mb-6 print:break-inside-avoid">
              <CardBody>
                <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400 mb-3">Notes</h2>
                <p className="text-sm text-ink-600 leading-relaxed whitespace-pre-line">
                  {proposal.notes}
                </p>
              </CardBody>
            </Card>
          )}

          {/* Terms */}
          {proposal.terms && (
            <Card className="mb-6 print:break-inside-avoid">
              <CardBody>
                <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400 mb-3">Terms</h2>
                <p className="text-sm text-ink-600 leading-relaxed whitespace-pre-line">
                  {proposal.terms}
                </p>
              </CardBody>
            </Card>
          )}

          {/* Comments section */}
          <Card className="mb-6 print:hidden">
            <CardBody>
              <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400 mb-5 flex items-center gap-2">
                <MessageSquare size={14} />
                Comments
              </h2>

              {comments.length > 0 && (
                <div className="space-y-4 mb-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border-b border-ink-200/40 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-medium text-ink-900">{comment.author_name}</p>
                        <p className="text-xs text-ink-400">{formatDateTime(comment.created_at)}</p>
                      </div>
                      <p className="mt-1.5 text-sm text-ink-600 leading-relaxed whitespace-pre-line">
                        {comment.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {canComment ? (
                <form onSubmit={handleComment} className="space-y-4">
                  <Input
                    label="Your name"
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={200}
                  />
                  <Textarea
                    label="Comment"
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    placeholder="Write a comment or question..."
                    maxLength={1000}
                    hint={`${commentBody.length}/1000 characters`}
                  />
                  {commentError && (
                    <p className="text-xs text-error-600">{commentError}</p>
                  )}
                  <Button type="submit" size="sm" disabled={commentSubmitting}>
                    {commentSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Posting...
                      </>
                    ) : (
                      'Post comment'
                    )}
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-ink-400">
                  Comments are not available for this proposal.
                </p>
              )}
            </CardBody>
          </Card>

          {/* Decision actions */}
          {canDecide && (
            <Card className="mb-6 print:hidden">
              <CardBody>
                <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400 mb-4">
                  Your decision
                </h2>
                <p className="text-sm text-ink-500 mb-6">
                  You can accept or decline this proposal. This action can only be taken once.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      setAcceptError(null);
                      setShowAcceptDialog(true);
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Accept proposal
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setDeclineError(null);
                      setShowDeclineDialog(true);
                    }}
                  >
                    <XCircle size={16} />
                    Decline
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Print button */}
          <div className="text-center print:hidden">
            <Button variant="ghost" size="sm" onClick={() => window.print()}>
              <Printer size={14} />
              Print proposal
            </Button>
          </div>
        </Container>
      </div>

      {/* Accept dialog */}
      <ConfirmDialog
        open={showAcceptDialog}
        title="Accept this proposal?"
        message={
          <div className="space-y-4">
            <p>By accepting, you confirm this proposal is approved. This action cannot be undone.</p>
            <Input
              label="Your full name"
              value={acceptName}
              onChange={(e) => setAcceptName(e.target.value)}
              placeholder="Enter your full name"
              maxLength={200}
            />
            <label className="flex items-start gap-2.5 text-sm text-ink-600">
              <input
                type="checkbox"
                checked={acceptAuthorized}
                onChange={(e) => setAcceptAuthorized(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-ink-300"
              />
              <span>I confirm I am authorized to approve this proposal on behalf of my organization.</span>
            </label>
            {acceptError && <p className="text-xs text-error-600">{acceptError}</p>}
          </div>
        }
        confirmLabel="Accept proposal"
        onConfirm={handleAccept}
        onCancel={() => setShowAcceptDialog(false)}
        loading={acceptSubmitting}
        variant="primary"
      />

      {/* Decline dialog */}
      <ConfirmDialog
        open={showDeclineDialog}
        title="Decline this proposal?"
        message={
          <div className="space-y-4">
            <p>By declining, you confirm this proposal is not approved. This action cannot be undone.</p>
            <Input
              label="Your full name"
              value={declineName}
              onChange={(e) => setDeclineName(e.target.value)}
              placeholder="Enter your full name"
              maxLength={200}
            />
            <Textarea
              label="Reason (optional)"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Tell us why you're declining..."
              maxLength={1000}
              hint={`${declineReason.length}/1000 characters`}
            />
            {declineError && <p className="text-xs text-error-600">{declineError}</p>}
          </div>
        }
        confirmLabel="Decline proposal"
        onConfirm={handleDecline}
        onCancel={() => setShowDeclineDialog(false)}
        loading={declineSubmitting}
        variant="outline"
      />
    </div>
  );
}
