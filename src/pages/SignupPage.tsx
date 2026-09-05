import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

function getSignupError(): string {
  return 'Could not create your account. Please check your details and try again.';
}

export function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter your email and a password.');
      return;
    }

    if (password.length < 10) {
      setError('Password must be at least 10 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) { setError(getSignupError()); return; }
      if (!data.session) { setPassword(''); setConfirmPassword(''); setNeedsConfirmation(true); return; }
      navigate('/dashboard');
    } catch { setError('Connection failed. Please try again.'); }
    finally { setLoading(false); }
  }

  if (needsConfirmation) return <AuthLayout><h1 className="text-center font-serif text-2xl">Check your email</h1><p className="mt-5 text-center text-sm">If this address can be registered, you will receive a confirmation link. Open it to finish creating your account.</p><Link className="mt-5 block text-center underline" to="/login">Back to sign in</Link></AuthLayout>;

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <h1 className="text-2xl text-ink-900 font-serif">Create your account</h1>
        <p className="mt-2 text-sm text-ink-500">
          Start sending polished proposals in minutes.
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
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 10 characters"
          hint="Use at least 10 characters"
          required
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
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
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link to="/login" className="text-ink-900 underline underline-offset-4 hover:text-ink-700">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
