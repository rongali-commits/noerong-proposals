import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

function getAuthError(): string {
  return 'Invalid email or password. Please check your credentials and try again.';
}

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError(getAuthError());
      return;
    }

    navigate('/dashboard');
  }

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <h1 className="text-2xl text-ink-900 font-serif">Sign in to your account</h1>
        <p className="mt-2 text-sm text-ink-500">
          Welcome back. Sign in to manage your proposals.
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />

        {error && (
          <div className="rounded-md border border-error-100 bg-error-50 px-4 py-3">
            <p className="text-sm text-error-700">{error}</p>
          </div>
        )}

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-ink-500 hover:text-ink-900 transition-colors"
          >
            Forgot your password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-500">
        Don't have an account?{' '}
        <Link to="/signup" className="text-ink-900 underline underline-offset-4 hover:text-ink-700">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
