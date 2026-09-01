import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 border-2 border-ink-300 border-t-ink-700 rounded-full animate-spin" />
          <p className="text-sm text-ink-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
