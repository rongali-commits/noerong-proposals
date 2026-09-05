import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export function ResetPasswordPage() {
  const { session, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (password.length < 10) { setError('Use at least 10 characters.'); return; }
    if (password !== confirmation) { setError('The passwords do not match.'); return; }
    if (!session) { setError('This link is no longer valid. Request a new reset email.'); return; }
    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) { setError('The password could not be updated. Use a stronger password or request a new reset link.'); return; }
      setPassword(''); setConfirmation(''); setSaved(true);
    } catch { setError('Connection failed. Please try again.'); }
    finally { setSaving(false); }
  }

  return <AuthLayout>
    <h1 className="text-center font-serif text-2xl text-ink-900">Choose a new password</h1>
    {loading ? <p className="mt-6 text-center text-sm">Checking your reset link...</p> : saved ?
      <div className="mt-6 text-center"><p role="status">Your password has been updated.</p><Link className="mt-5 inline-block underline" to="/dashboard">Open your workspace</Link></div> : !session ?
      <div className="mt-6 text-center"><p role="alert">This reset link is missing, expired, or has already been used.</p><Link className="mt-5 inline-block underline" to="/forgot-password">Request a new reset link</Link></div> :
      <form onSubmit={submit} className="mt-6 space-y-5">
        <Input label="New password" type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required minLength={10} maxLength={128} />
        <Input label="Confirm new password" type="password" autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} required minLength={10} maxLength={128} />
        {error ? <p role="alert" className="text-sm text-error-700">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Updating...' : 'Update password'}</Button>
      </form>}
  </AuthLayout>;
}
