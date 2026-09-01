import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Check } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className="text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg border border-lime-200 bg-lime-50 text-lime-700">
            <Check size={24} />
          </span>
          <h1 className="mt-6 text-2xl text-ink-900 font-serif">Check your email</h1>
          <p className="mt-3 text-sm text-ink-500 leading-relaxed">
            If an account exists for that email, we've sent a password reset link.
            Check your inbox and follow the instructions to reset your password.
          </p>
          <div className="mt-8">
            <Link
              to="/login"
              className="text-sm text-ink-900 underline underline-offset-4 hover:text-ink-700"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <h1 className="text-2xl text-ink-900 font-serif">Reset your password</h1>
        <p className="mt-2 text-sm text-ink-500">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />

        {error && (
          <div className="rounded-md border border-error-100 bg-error-50 px-4 py-3">
            <p className="text-sm text-error-700">{error}</p>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Sending reset link...
            </>
          ) : (
            'Send reset link'
          )}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-500">
        Remembered your password?{' '}
        <Link to="/login" className="text-ink-900 underline underline-offset-4 hover:text-ink-700">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
