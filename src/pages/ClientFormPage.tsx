import { useState, useEffect, type FormEvent, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card, CardBody } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { createClient, updateClient, fetchClientById } from '@/lib/clients';

type FormState = {
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
};

const emptyForm: FormState = {
  name: '',
  company: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ClientFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);
  const successMessage = location.state?.successMessage as string | undefined;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit);
  const [pageError, setPageError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const loadClient = useCallback(async (clientId: string) => {
    setPageLoading(true);
    setPageError(null);
    try {
      const client = await fetchClientById(clientId);
      if (!client) {
        setPageError('Client not found.');
        return;
      }
      setForm({
        name: client.name,
        company: client.company,
        email: client.email,
        phone: client.phone,
        address: client.address,
        notes: client.notes,
      });
    } catch {
      setPageError('Could not load client. Please try again.');
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) loadClient(id);
  }, [id, loadClient]);

  const isDirty = () => {
    return Object.keys(form).some(
      (key) => form[key as keyof FormState] !== emptyForm[key as keyof FormState],
    );
  };

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.name.trim()) {
      next.name = 'Name is required.';
    }
    if (form.email.trim() && !isValidEmail(form.email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        company: form.company.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
      };

      if (isEdit && id) {
        const updated = await updateClient(id, payload);
        navigate(`/clients/${updated.id}`, {
          state: { successMessage: 'Client updated successfully.' },
        });
      } else {
        const created = await createClient(payload);
        navigate(`/clients/${created.id}`, {
          state: { successMessage: 'Client created successfully.' },
        });
      }
    } catch {
      setSubmitError(
        isEdit
          ? 'Could not update client. Please try again.'
          : 'Could not create client. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    if (isDirty()) {
      setShowDiscardDialog(true);
    } else {
      navigate(isEdit && id ? `/clients/${id}` : '/clients');
    }
  }

  if (pageLoading) {
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

  if (pageError) {
    return (
      <div className="py-10 md:py-14">
        <Container>
          <PageHeader title="Edit client" backTo="/clients" backLabel="Back to clients" />
          <Card>
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <p className="text-sm text-ink-500">{pageError}</p>
              <ButtonLink to="/clients" variant="outline" size="sm" className="mt-6">
                Back to clients
              </ButtonLink>
            </div>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-10 md:py-14">
      <Container>
        <PageHeader
          title={isEdit ? 'Edit client' : 'New client'}
          backTo={isEdit && id ? `/clients/${id}` : '/clients'}
          backLabel="Back to clients"
        />

        {successMessage && (
          <div className="mb-6 rounded-md border border-lime-200 bg-lime-50/60 px-4 py-3">
            <p className="text-sm text-lime-800">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-5" noValidate>
          <Card>
            <CardBody className="space-y-5">
              <Input
                label="Name"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                error={errors.name}
                placeholder="Sarah Chen"
                required
              />
              <Input
                label="Company"
                value={form.company}
                onChange={(e) => updateField('company', e.target.value)}
                placeholder="Meridian Coffee Co."
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                error={errors.email}
                placeholder="sarah@meridiancoffee.com"
              />
              <Input
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
              <Textarea
                label="Address"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="123 Main St, Seattle, WA 98101"
              />
              <Textarea
                label="Notes"
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Internal notes about this client..."
              />
            </CardBody>
          </Card>

          {submitError && (
            <div className="rounded-md border border-error-100 bg-error-50 px-4 py-3">
              <p className="text-sm text-error-700">{submitError}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" size="md" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isEdit ? 'Saving...' : 'Creating...'}
                </>
              ) : isEdit ? (
                'Save changes'
              ) : (
                'Create client'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>

        <ConfirmDialog
          open={showDiscardDialog}
          title="Discard changes?"
          message="You have unsaved changes. Are you sure you want to leave this page?"
          confirmLabel="Discard and leave"
          onConfirm={() => {
            setShowDiscardDialog(false);
            navigate(isEdit && id ? `/clients/${id}` : '/clients');
          }}
          onCancel={() => setShowDiscardDialog(false)}
        />
      </Container>
    </div>
  );
}
