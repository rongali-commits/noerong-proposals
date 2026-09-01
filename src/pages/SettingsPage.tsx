import { useState, useEffect, useCallback, type FormEvent } from 'react';

import { Loader2, Check } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useUnsavedChangesGuard } from '@/lib/use-unsaved-changes-guard';
import { fetchProfile, saveProfile, type ProfileInput } from '@/lib/settings';

type FormState = {
  business_name: string;
  logo_url: string;
  brand_color: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  default_currency: string;
  default_tax_rate: string;
  default_terms: string;
  proposal_prefix: string;
};

function isValidHex(value: string): boolean {
  return /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(value);
}

function isValidEmail(email: string): boolean {
  if (!email.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function normalizePrefix(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function profileToForm(p: ProfileInput): FormState {
  return {
    business_name: p.business_name,
    logo_url: p.logo_url,
    brand_color: p.brand_color,
    contact_email: p.contact_email,
    contact_phone: p.contact_phone,
    address: p.address,
    default_currency: p.default_currency,
    default_tax_rate: String(p.default_tax_rate),
    default_terms: p.default_terms,
    proposal_prefix: p.proposal_prefix,
  };
}

export function SettingsPage() {
  const [form, setForm] = useState<FormState>({
    business_name: '',
    logo_url: '',
    brand_color: '#a8d61f',
    contact_email: '',
    contact_phone: '',
    address: '',
    default_currency: 'USD',
    default_tax_rate: '0',
    default_terms: '',
    proposal_prefix: 'NP',
  });
  const [initialForm, setInitialForm] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await fetchProfile();
      if (profile) {
        const formState = profileToForm(profile);
        setForm(formState);
        setInitialForm(JSON.stringify(formState));
      }
    } catch {
      setError('Could not load your settings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isDirty = () => JSON.stringify(form) !== initialForm;

  const guard = useUnsavedChangesGuard(isDirty);

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'proposal_prefix') {
        next.proposal_prefix = normalizePrefix(value);
      }
      if (field === 'default_currency') {
        next.default_currency = value.toUpperCase();
      }
      return next;
    });
    if (errors[field]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
    setSaved(false);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};

    if (!form.business_name.trim()) {
      next.business_name = 'Business name is required.';
    }
    if (!isValidHex(form.brand_color)) {
      next.brand_color = 'Enter a valid hex color (e.g. #a8d61f).';
    }
    if (!isValidEmail(form.contact_email)) {
      next.contact_email = 'Enter a valid email address.';
    }
    const tax = parseFloat(form.default_tax_rate);
    if (isNaN(tax) || tax < 0 || tax > 100) {
      next.default_tax_rate = 'Tax rate must be between 0 and 100.';
    }
    if (!form.default_currency.trim() || form.default_currency.length > 3) {
      next.default_currency = 'Currency must be a 3-letter code.';
    }
    const prefix = normalizePrefix(form.proposal_prefix);
    if (prefix.length < 2 || prefix.length > 8) {
      next.proposal_prefix = 'Prefix must be 2 to 8 letters or numbers.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    if (!validate()) return;

    setSaving(true);
    try {
      const input: ProfileInput = {
        business_name: form.business_name.trim(),
        logo_url: form.logo_url.trim(),
        brand_color: form.brand_color.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(),
        address: form.address.trim(),
        default_currency: form.default_currency.trim().toUpperCase(),
        default_tax_rate: parseFloat(form.default_tax_rate),
        default_terms: form.default_terms.trim(),
        proposal_prefix: normalizePrefix(form.proposal_prefix),
      };

      const updated = await saveProfile(input);
      const formState = profileToForm(updated);
      setForm(formState);
      setInitialForm(JSON.stringify(formState));
      setSaved(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save settings.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    guard.requestNavigation('/dashboard');
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

  if (error && !form.business_name) {
    return (
      <div className="py-10 md:py-14">
        <Container>
          <PageHeader title="Settings" backTo="/dashboard" backLabel="Back to dashboard" />
          <Card>
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <p className="text-sm text-ink-500">{error}</p>
              <Button variant="outline" size="sm" className="mt-6" onClick={load}>
                Try again
              </Button>
            </div>
          </Card>
        </Container>
      </div>
    );
  }

  const brandColor = isValidHex(form.brand_color) ? form.brand_color : '#a8d61f';

  return (
    <div className="py-10 md:py-14">
      <Container>
        <PageHeader
          title="Settings"
          backTo="/dashboard"
          backLabel="Back to dashboard"
        />

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6" noValidate>
          {/* Business profile */}
          <Card>
            <CardBody className="space-y-5">
              <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400">
                Business profile
              </h2>

              {/* Brand preview */}
              <div className="rounded-md border border-ink-200/60 bg-ivory-100/40 p-4">
                <p className="text-xs text-ink-400 mb-3">Live brand preview</p>
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-md flex items-center justify-center text-ivory-50 font-serif text-lg shrink-0 overflow-hidden"
                    style={{ backgroundColor: brandColor }}
                  >
                    {form.logo_url ? (
                      <img
                        src={form.logo_url}
                        alt=""
                        className="h-full w-full object-cover rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      (form.business_name || 'N').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">
                      {form.business_name || 'Your business name'}
                    </p>
                    <p className="text-xs text-ink-400">
                      Prefix: {normalizePrefix(form.proposal_prefix) || 'NP'}
                    </p>
                  </div>
                </div>
              </div>

              <Input
                label="Business name"
                value={form.business_name}
                onChange={(e) => updateField('business_name', e.target.value)}
                error={errors.business_name}
                placeholder="Your business name"
                required
              />
              <Input
                label="Logo URL"
                value={form.logo_url}
                onChange={(e) => updateField('logo_url', e.target.value)}
                placeholder="https://example.com/logo.png"
                hint="Paste a URL to your logo image"
              />
              <div>
                <label htmlFor="brand-color-picker" className="block text-sm font-medium text-ink-700 mb-1.5">
                  Brand color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="brand-color-picker"
                    type="color"
                    value={isValidHex(form.brand_color) ? form.brand_color : '#a8d61f'}
                    onChange={(e) => updateField('brand_color', e.target.value)}
                    className="h-10 w-12 rounded-md border border-ink-200 cursor-pointer bg-ivory-50 p-1"
                  />
                  <input
                    type="text"
                    value={form.brand_color}
                    onChange={(e) => updateField('brand_color', e.target.value)}
                    aria-label="Brand color hex value"
                    placeholder="#a8d61f"
                    className={`w-32 rounded-md border bg-ivory-50 px-3.5 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-400/30 focus:border-ink-400 ${
                      errors.brand_color ? 'border-error-500' : 'border-ink-200'
                    }`}
                  />
                </div>
                {errors.brand_color && (
                  <p className="mt-1.5 text-xs text-error-600">{errors.brand_color}</p>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Contact info */}
          <Card>
            <CardBody className="space-y-5">
              <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400">
                Contact information
              </h2>
              <Input
                label="Contact email"
                type="email"
                value={form.contact_email}
                onChange={(e) => updateField('contact_email', e.target.value)}
                error={errors.contact_email}
                placeholder="hello@yourbusiness.com"
              />
              <Input
                label="Contact phone"
                type="tel"
                value={form.contact_phone}
                onChange={(e) => updateField('contact_phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
              <Textarea
                label="Business address"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="123 Main St, Seattle, WA 98101"
              />
            </CardBody>
          </Card>

          {/* Proposal defaults */}
          <Card>
            <CardBody className="space-y-5">
              <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400">
                Proposal defaults
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Default currency"
                  value={form.default_currency}
                  onChange={(e) => updateField('default_currency', e.target.value)}
                  error={errors.default_currency}
                  placeholder="USD"
                  hint="3-letter code"
                />
                <Input
                  label="Default tax rate (%)"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.default_tax_rate}
                  onChange={(e) => updateField('default_tax_rate', e.target.value)}
                  error={errors.default_tax_rate}
                />
              </div>
              <Input
                label="Proposal number prefix"
                value={form.proposal_prefix}
                onChange={(e) => updateField('proposal_prefix', e.target.value)}
                error={errors.proposal_prefix}
                placeholder="NP"
                hint="2 to 8 letters or numbers. Affects new proposals only."
              />
              <Textarea
                label="Default terms"
                value={form.default_terms}
                onChange={(e) => updateField('default_terms', e.target.value)}
                placeholder="Payment terms, timeline, conditions..."
              />
            </CardBody>
          </Card>

          {/* Error */}
          {error && form.business_name && (
            <div className="rounded-md border border-error-100 bg-error-50 px-4 py-3">
              <p className="text-sm text-error-700">{error}</p>
            </div>
          )}

          {/* Saved indicator */}
          {saved && (
            <div className="rounded-md border border-lime-200 bg-lime-50/60 px-4 py-3 flex items-center gap-2">
              <Check size={16} className="text-lime-700" />
              <p className="text-sm text-lime-800">Settings saved successfully.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button type="submit" size="md" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save settings'
              )}
            </Button>
            <Button type="button" variant="outline" size="md" onClick={handleCancel} disabled={saving}>
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
