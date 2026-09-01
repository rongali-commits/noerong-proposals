import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  FileText,
  Pencil,
  Archive,
  ArchiveRestore,
  ArrowLeft,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card, CardBody } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { fetchClientById, setClientArchived } from '@/lib/clients';
import type { Client } from '@/types/database';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const successMessage = location.state?.successMessage as string | undefined;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const load = useCallback(async (clientId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClientById(clientId);
      if (!data) {
        setError('Client not found.');
        return;
      }
      setClient(data);
    } catch {
      setError('Could not load client. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) load(id);
  }, [id, load]);

  async function handleArchiveToggle() {
    if (!client) return;
    setArchiving(true);
    try {
      const updated = await setClientArchived(client.id, !client.archived);
      setClient(updated);
      setShowArchiveDialog(false);
    } catch {
      setError('Could not update client. Please try again.');
    } finally {
      setArchiving(false);
    }
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

  if (error && !client) {
    return (
      <div className="py-10 md:py-14">
        <Container>
          <PageHeader title="Client" backTo="/clients" backLabel="Back to clients" />
          <Card>
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-error-100 bg-error-50 text-error-600">
                <AlertCircle size={22} />
              </span>
              <p className="mt-4 text-sm text-ink-500">{error}</p>
              <ButtonLink to="/clients" variant="outline" size="sm" className="mt-6">
                Back to clients
              </ButtonLink>
            </div>
          </Card>
        </Container>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="py-10 md:py-14">
      <Container>
        <Link
          to="/clients"
          className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-700 transition-colors mb-4"
        >
          <ArrowLeft size={15} />
          Back to clients
        </Link>

        {successMessage && (
          <div className="mb-6 rounded-md border border-lime-200 bg-lime-50/60 px-4 py-3">
            <p className="text-sm text-lime-800">{successMessage}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl text-ink-900 font-serif">
                {client.name}
              </h1>
              {client.archived && (
                <Badge variant="neutral">
                  <Archive size={11} />
                  Archived
                </Badge>
              )}
            </div>
            {client.company && (
              <p className="mt-1 text-sm text-ink-500">{client.company}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ButtonLink to={`/clients/${client.id}/edit`} variant="outline" size="sm">
              <Pencil size={14} />
              Edit
            </ButtonLink>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchiveDialog(true)}
            >
              {client.archived ? (
                <>
                  <ArchiveRestore size={14} />
                  Restore
                </>
              ) : (
                <>
                  <Archive size={14} />
                  Archive
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Contact info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardBody>
                <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400 mb-5">
                  Contact information
                </h2>
                <dl className="space-y-4">
                  {client.email && (
                    <div className="flex items-start gap-3">
                      <Mail size={16} className="text-ink-300 mt-0.5 shrink-0" />
                      <div>
                        <dt className="text-xs text-ink-400">Email</dt>
                        <dd className="text-sm text-ink-700">
                          <a
                            href={`mailto:${client.email}`}
                            className="hover:underline underline-offset-4"
                          >
                            {client.email}
                          </a>
                        </dd>
                      </div>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-start gap-3">
                      <Phone size={16} className="text-ink-300 mt-0.5 shrink-0" />
                      <div>
                        <dt className="text-xs text-ink-400">Phone</dt>
                        <dd className="text-sm text-ink-700">{client.phone}</dd>
                      </div>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-ink-300 mt-0.5 shrink-0" />
                      <div>
                        <dt className="text-xs text-ink-400">Address</dt>
                        <dd className="text-sm text-ink-700 whitespace-pre-line">
                          {client.address}
                        </dd>
                      </div>
                    </div>
                  )}
                  {!client.email && !client.phone && !client.address && (
                    <p className="text-sm text-ink-400">
                      No contact information added yet.
                    </p>
                  )}
                </dl>
              </CardBody>
            </Card>

            {client.notes && (
              <Card>
                <CardBody>
                  <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400 mb-4">
                    Notes
                  </h2>
                  <p className="text-sm text-ink-600 leading-relaxed whitespace-pre-line">
                    {client.notes}
                  </p>
                </CardBody>
              </Card>
            )}

            {/* Proposal history empty state */}
            <Card>
              <CardBody className="text-center py-12">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-ink-200 text-ink-400 bg-ivory-100">
                  <FileText size={20} />
                </span>
                <h2 className="mt-5 text-sm text-ink-700 font-medium">
                  No proposals yet
                </h2>
                <p className="mt-1.5 text-sm text-ink-400 max-w-sm mx-auto">
                  Proposals sent to this client will appear here once created.
                </p>
              </CardBody>
            </Card>
          </div>

          {/* Metadata sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardBody>
                <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400 mb-5">
                  Details
                </h2>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-xs text-ink-400">Created</dt>
                    <dd className="text-sm text-ink-700 mt-0.5">
                      {formatDate(client.created_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-400">Last updated</dt>
                    <dd className="text-sm text-ink-700 mt-0.5">
                      {formatDate(client.updated_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-400">Status</dt>
                    <dd className="mt-0.5">
                      {client.archived ? (
                        <Badge variant="neutral">Archived</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </dd>
                  </div>
                </dl>
              </CardBody>
            </Card>
          </div>
        </div>

        <ConfirmDialog
          open={showArchiveDialog}
          title={client.archived ? 'Restore client?' : 'Archive client?'}
          message={
            client.archived
              ? 'This client will be moved back to your active clients list.'
              : 'This client will be moved to your archived list. You can restore it at any time.'
          }
          confirmLabel={client.archived ? 'Restore' : 'Archive'}
          onConfirm={handleArchiveToggle}
          onCancel={() => setShowArchiveDialog(false)}
          loading={archiving}
        />
      </Container>
    </div>
  );
}
