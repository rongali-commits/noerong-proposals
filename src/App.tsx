import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { SampleProposalPage } from '@/pages/SampleProposalPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ClientListPage = lazy(() => import('@/pages/ClientListPage').then(m => ({ default: m.ClientListPage })));
const ClientFormPage = lazy(() => import('@/pages/ClientFormPage').then(m => ({ default: m.ClientFormPage })));
const ClientDetailPage = lazy(() => import('@/pages/ClientDetailPage').then(m => ({ default: m.ClientDetailPage })));
const ProposalListPage = lazy(() => import('@/pages/ProposalListPage').then(m => ({ default: m.ProposalListPage })));
const ProposalBuilderPage = lazy(() => import('@/pages/ProposalBuilderPage').then(m => ({ default: m.ProposalBuilderPage })));
const ProposalDetailPage = lazy(() => import('@/pages/ProposalDetailPage').then(m => ({ default: m.ProposalDetailPage })));
const PublicProposalPage = lazy(() => import('@/pages/PublicProposalPage').then(m => ({ default: m.PublicProposalPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 border-2 border-ink-300 border-t-ink-700 rounded-full animate-spin" />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-ivory-100">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory-100">
        <div className="h-6 w-6 border-2 border-ink-300 border-t-ink-700 rounded-full animate-spin" />
      </div>
    );
  }
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <MarketingLayout>
            <HomePage />
          </MarketingLayout>
        }
      />
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <LoginPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/signup"
        element={
          <RedirectIfAuthed>
            <SignupPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <RedirectIfAuthed>
            <ForgotPasswordPage />
          </RedirectIfAuthed>
        }
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/sample-proposal" element={<SampleProposalPage />} />
      <Route path="/p/:token" element={<LazyRoute><PublicProposalPage /></LazyRoute>} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell>
              <LazyRoute><DashboardPage /></LazyRoute>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <AppShell>
              <LazyRoute><ClientListPage /></LazyRoute>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients/new"
        element={
          <ProtectedRoute>
            <AppShell>
              <LazyRoute><ClientFormPage /></LazyRoute>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients/:id"
        element={
          <ProtectedRoute>
            <AppShell>
              <LazyRoute><ClientDetailPage /></LazyRoute>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients/:id/edit"
        element={
          <ProtectedRoute>
            <AppShell>
              <LazyRoute><ClientFormPage /></LazyRoute>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/proposals"
        element={
          <ProtectedRoute>
            <AppShell>
              <LazyRoute><ProposalListPage /></LazyRoute>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/proposals/new"
        element={
          <ProtectedRoute>
            <AppShell>
              <LazyRoute><ProposalBuilderPage /></LazyRoute>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/proposals/:id"
        element={
          <ProtectedRoute>
            <AppShell>
              <LazyRoute><ProposalDetailPage /></LazyRoute>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/proposals/:id/edit"
        element={
          <ProtectedRoute>
            <AppShell>
              <LazyRoute><ProposalBuilderPage /></LazyRoute>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppShell>
              <LazyRoute><SettingsPage /></LazyRoute>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
