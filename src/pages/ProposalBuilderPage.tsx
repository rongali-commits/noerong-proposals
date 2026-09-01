import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { Loader2, Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card, CardBody } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useUnsavedChangesGuard } from '@/lib/use-unsaved-changes-guard';
import { fetchProposalDetail, createProposal, updateProposal, type ItemInput } from '@/lib/proposals';
import { fetchClients } from '@/lib/clients';
import { computeTotals, formatCurrency, type ItemInput as CalcItem } from '@/lib/calculations';
import type { Client } from '@/types/database';

type FormItem = {
  key: string;
  description: string;
  detail: string;
  quantity: string;
  rate: string;
  discount: string;
};

type FormState = {
  client_id: string;
  title: string;
  currency: string;
  expiry_date: string;
  discount_amount: string;
  tax_rate: string;
  notes: string;
  terms: string;
  items: FormItem[];
};

let itemKeyCounter = 0;
function nextKey(): string {
  itemKeyCounter += 1;
  return `item-${Date.now()}-${itemKeyCounter}`;
}

function blankItem(): FormItem {
  return {
    key: nextKey(),
    description: '',
    detail: '',
    quantity: '1',
    rate: '0',
    discount: '0',
  };
}

function emptyForm(): FormState {
  return {
    client_id: '',
    title: '',
    currency: 'USD',
    expiry_date: '',
    discount_amount: '0',
    tax_rate: '0',
    notes: '',
    terms: '',
    items: [blankItem()],
  };
}

function parseNum(val: string): number {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

export function ProposalBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);
  const successMessage = location.state?.successMessage as string | undefined;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [initialForm, setInitialForm] = useState<string>('');
  const [clients, setClients] = useState<Client[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [itemErrors, setItemErrors] = useState<Record<string, Record<string, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    try {
      const data = await fetchClients(false);
      setClients(data);
    } catch {
      // clients load failure is non-fatal for the form
    }
  }, []);

  const loadProposal = useCallback(async (proposalId: string) => {
    setPageLoading(true);
    setPageError(null);
    try {
      const detail = await fetchProposalDetail(proposalId);
      if (!detail) {
        setPageError('Proposal not found.');
        return;
      }
      if (detail.proposal.status !== 'draft') {
        setPageError('Only draft proposals can be edited.');
        return;
      }
      const loaded: FormState = {
        client_id: detail.proposal.client_id ?? '',
        title: detail.proposal.title,
        currency: detail.proposal.currency,
        expiry_date: detail.proposal.expiry_date ?? '',
        discount_amount: String(detail.proposal.discount_amount),
        tax_rate: String(detail.proposal.tax_rate),
        notes: detail.proposal.notes,
        terms: detail.proposal.terms,
        items: detail.items.length > 0
          ? detail.items.map((item) => ({
              key: nextKey(),
              description: item.description,
              detail: item.detail,
              quantity: String(item.quantity),
              rate: String(item.rate),
              discount: String(item.discount),
            }))
          : [blankItem()],
      };
      setForm(loaded);
      setInitialForm(JSON.stringify(loaded));
    } catch {
      setPageError('Could not load proposal. Please try again.');
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      loadProposal(id);
    } else {
      setPageLoading(false);
      setInitialForm(JSON.stringify(emptyForm()));
    }
    loadClients();
  }, [id, isEdit, loadProposal, loadClients]);

  const isDirty = () => JSON.stringify(form) !== initialForm;

  const guard = useUnsavedChangesGuard(isDirty);

  function updateField(field: keyof Omit<FormState, 'items'>, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function updateItem(index: number, field: keyof FormItem, value: string) {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
    if (itemErrors[index]?.[field]) {
      setItemErrors((prev) => {
        const next = { ...prev };
        if (next[index]) {
          delete next[index][field];
          if (Object.keys(next[index]).length === 0) delete next[index];
        }
        return next;
      });
    }
  }

  function addItem() {
    setForm((prev) => ({ ...prev, items: [...prev.items, blankItem()] }));
  }

  function removeItem(index: number) {
    setForm((prev) => {
      if (prev.items.length === 1) return prev;
      const items = prev.items.filter((_, i) => i !== index);
      return { ...prev, items };
    });
    setItemErrors((prev) => {
      const next: Record<string, Record<string, string>> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const ki = parseInt(k);
        if (ki < index) next[ki] = v;
        else if (ki > index) next[ki - 1] = v;
      });
      return next;
    });
  }

  function moveItem(index: number, direction: 'up' | 'down') {
    setForm((prev) => {
      const items = [...prev.items];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= items.length) return prev;
      [items[index], items[target]] = [items[target], items[index]];
      return { ...prev, items };
    });
  }

  const calcItems: CalcItem[] = form.items.map((item) => ({
    description: item.description,
    detail: item.detail,
    quantity: parseNum(item.quantity),
    rate: parseNum(item.rate),
    discount: parseNum(item.discount),
  }));

  const totals = computeTotals(calcItems, parseNum(form.discount_amount), parseNum(form.tax_rate));

  function validate(): boolean {
    const next: Record<string, string> = {};
    const nextItemErrors: Record<string, Record<string, string>> = {};

    if (!form.client_id) next.client_id = 'Select a client.';
    if (!form.title.trim()) next.title = 'Title is required.';
    if (parseNum(form.discount_amount) < 0) next.discount_amount = 'Discount cannot be negative.';
    if (parseNum(form.tax_rate) < 0) next.tax_rate = 'Tax rate cannot be negative.';

    let hasValidItem = false;
    form.items.forEach((item, i) => {
      const errs: Record<string, string> = {};
      if (!item.description.trim()) errs.description = 'Description is required.';
      if (parseNum(item.quantity) <= 0) errs.quantity = 'Must be greater than 0.';
      if (parseNum(item.rate) < 0) errs.rate = 'Cannot be negative.';
      if (parseNum(item.discount) < 0 || parseNum(item.discount) > 100)
        errs.discount = '0-100 only.';
      if (Object.keys(errs).length > 0) nextItemErrors[i] = errs;
      if (item.description.trim() && parseNum(item.quantity) > 0 && parseNum(item.rate) >= 0
          && parseNum(item.discount) >= 0 && parseNum(item.discount) <= 100) {
        hasValidItem = true;
      }
    });

    if (!hasValidItem) {
      next.items = 'At least one valid service item is required.';
    }

    setErrors(next);
    setItemErrors(nextItemErrors);
    return Object.keys(next).length === 0 && Object.keys(nextItemErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        client_id: form.client_id,
        title: form.title.trim(),
        currency: form.currency.trim() || 'USD',
        expiry_date: form.expiry_date || null,
        discount_amount: parseNum(form.discount_amount),
        tax_rate: parseNum(form.tax_rate),
        notes: form.notes.trim(),
        terms: form.terms.trim(),
        items: form.items.map((item, i): ItemInput => ({
          description: item.description.trim(),
          detail: item.detail.trim(),
          quantity: parseNum(item.quantity),
          rate: parseNum(item.rate),
          discount: parseNum(item.discount),
          sort_order: i,
        })),
      };

      if (isEdit && id) {
        const updated = await updateProposal(id, payload);
        navigate(`/proposals/${updated.id}`, {
          state: { successMessage: 'Proposal updated successfully.' },
        });
      } else {
        const created = await createProposal(payload);
        navigate(`/proposals/${created.id}`, {
          state: { successMessage: 'Proposal created successfully.' },
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setSubmitError(
        msg.includes('client')
          ? msg
          : isEdit
            ? 'Could not update proposal. Please try again.'
            : 'Could not create proposal. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    guard.requestNavigation(isEdit && id ? `/proposals/${id}` : '/proposals');
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
          <PageHeader title="Edit proposal" backTo="/proposals" backLabel="Back to proposals" />
          <Card>
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <p className="text-sm text-ink-500">{pageError}</p>
              <ButtonLink to="/proposals" variant="outline" size="sm" className="mt-6">
                Back to proposals
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
          title={isEdit ? 'Edit proposal' : 'New proposal'}
          backTo={isEdit && id ? `/proposals/${id}` : '/proposals'}
          backLabel="Back to proposals"
        />

        {successMessage && (
          <div className="mb-6 rounded-md border border-lime-200 bg-lime-50/60 px-4 py-3">
            <p className="text-sm text-lime-800">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Proposal details */}
          <Card>
            <CardBody className="space-y-5">
              <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400">
                Proposal details
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="client-select" className="block text-sm font-medium text-ink-700 mb-1.5">
                    Client
                  </label>
                  <select
                    id="client-select"
                    value={form.client_id}
                    onChange={(e) => updateField('client_id', e.target.value)}
                    aria-invalid={errors.client_id ? true : undefined}
                    aria-describedby={errors.client_id ? 'client-select-error' : undefined}
                    className={`w-full rounded-md border bg-ivory-50 px-3.5 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-400/30 focus:border-ink-400 ${
                      errors.client_id ? 'border-error-500' : 'border-ink-200'
                    }`}
                  >
                    <option value="">Select a client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.company ? `, ${c.company}` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.client_id && (
                    <p id="client-select-error" className="mt-1.5 text-xs text-error-600">
                      {errors.client_id}
                    </p>
                  )}
                  {clients.length === 0 && (
                    <p className="mt-1.5 text-xs text-ink-400">
                      No active clients. <Link to="/clients/new" className="underline underline-offset-4 text-ink-700">Add a client first</Link>.
                    </p>
                  )}
                </div>
                <Input
                  label="Title"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  error={errors.title}
                  placeholder="Website redesign proposal"
                  required
                />
                <Input
                  label="Currency"
                  value={form.currency}
                  onChange={(e) => updateField('currency', e.target.value)}
                  placeholder="USD"
                />
                <Input
                  label="Expiry date"
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => updateField('expiry_date', e.target.value)}
                />
                <Input
                  label="Proposal discount (fixed amount)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.discount_amount}
                  onChange={(e) => updateField('discount_amount', e.target.value)}
                  error={errors.discount_amount}
                  hint="Applied after line items"
                />
                <Input
                  label="Tax rate (%)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.tax_rate}
                  onChange={(e) => updateField('tax_rate', e.target.value)}
                  error={errors.tax_rate}
                />
              </div>
            </CardBody>
          </Card>

          {/* Service items */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400">
                  Service items
                </h2>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus size={14} />
                  Add item
                </Button>
              </div>

              {errors.items && (
                <p className="mb-4 text-xs text-error-600">{errors.items}</p>
              )}

              <div className="space-y-4">
                {form.items.map((item, index) => {
                  const ie = itemErrors[index] ?? {};
                  const lineT = totals.lineTotals[index] ?? 0;
                  return (
                    <div
                      key={item.key}
                      className="rounded-md border border-ink-200/60 bg-ivory-100/40 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col gap-1 pt-8">
                          <button
                            type="button"
                            onClick={() => moveItem(index, 'up')}
                            disabled={index === 0}
                            aria-label="Move item up"
                            className="text-ink-300 hover:text-ink-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronUp size={16} />
                          </button>
                          <GripVertical size={16} className="text-ink-200" />
                          <button
                            type="button"
                            onClick={() => moveItem(index, 'down')}
                            disabled={index === form.items.length - 1}
                            aria-label="Move item down"
                            className="text-ink-300 hover:text-ink-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronDown size={16} />
                          </button>
                        </div>
                        <div className="flex-1 grid gap-3 sm:grid-cols-12">
                          <div className="sm:col-span-12">
                            <Input
                              label="Description"
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              error={ie.description ?? null}
                              placeholder="Service or deliverable name"
                            />
                          </div>
                          <div className="sm:col-span-12">
                            <Textarea
                              label="Detail (optional)"
                              value={item.detail}
                              onChange={(e) => updateItem(index, 'detail', e.target.value)}
                              placeholder="Additional scope notes..."
                              className="min-h-[60px]"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <Input
                              label="Quantity"
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                              error={ie.quantity ?? null}
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <Input
                              label="Rate"
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.rate}
                              onChange={(e) => updateItem(index, 'rate', e.target.value)}
                              error={ie.rate ?? null}
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <Input
                              label="Discount (%)"
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={item.discount}
                              onChange={(e) => updateItem(index, 'discount', e.target.value)}
                              error={ie.discount ?? null}
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-sm font-medium text-ink-700 mb-1.5">
                              Line total
                            </label>
                            <p className="rounded-md border border-ink-200/60 bg-ivory-50 px-3.5 py-2.5 text-sm text-ink-700 tabular-nums">
                              {formatCurrency(lineT, form.currency)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={form.items.length === 1}
                          aria-label="Remove item"
                          className="mt-8 text-ink-300 hover:text-error-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button type="button" variant="outline" size="sm" className="mt-4" onClick={addItem}>
                <Plus size={14} />
                Add another item
              </Button>
            </CardBody>
          </Card>

          {/* Summary */}
          <Card>
            <CardBody>
              <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400 mb-4">
                Summary
              </h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-500">Subtotal</dt>
                  <dd className="text-ink-700 tabular-nums">{formatCurrency(totals.subtotal, form.currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">Proposal discount</dt>
                  <dd className="text-ink-700 tabular-nums">-{formatCurrency(totals.discountAmount, form.currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">Taxable amount</dt>
                  <dd className="text-ink-700 tabular-nums">{formatCurrency(totals.taxableAmount, form.currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">Tax ({parseNum(form.tax_rate)}%)</dt>
                  <dd className="text-ink-700 tabular-nums">{formatCurrency(totals.tax, form.currency)}</dd>
                </div>
                <div className="flex justify-between pt-2 border-t border-ink-200/50">
                  <dt className="text-base font-medium text-ink-900">Total</dt>
                  <dd className="text-base font-medium text-ink-900 tabular-nums">{formatCurrency(totals.total, form.currency)}</dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          {/* Notes and terms */}
          <Card>
            <CardBody className="space-y-5">
              <Textarea
                label="Notes"
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Additional notes for the client..."
              />
              <Textarea
                label="Terms"
                value={form.terms}
                onChange={(e) => updateField('terms', e.target.value)}
                placeholder="Payment terms, timeline, conditions..."
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
                'Save proposal'
              ) : (
                'Create proposal'
              )}
            </Button>
            <Button type="button" variant="outline" size="md" onClick={handleCancel} disabled={submitting}>
              Cancel
            </Button>
          </div>
        </form>

        <ConfirmDialog
          open={guard.showDialog}
          title="Discard changes?"
          message="You have unsaved changes. Are you sure you want to leave this page?"
          confirmLabel="Discard and leave"
          onConfirm={guard.handleLeave}
          onCancel={guard.handleCancel}
        />
      </Container>
    </div>
  );
}
