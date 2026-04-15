import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Auth from '@/pages/Auth';
import AuthCallback from '@/pages/AuthCallback';
import Dashboard from '@/pages/Dashboard';
import ProjectView from '@/pages/ProjectView';
import Phase0 from '@/pages/Phase0';
import Phase1 from '@/pages/Phase1';
import Phase2 from '@/pages/Phase2';
import Phase3 from '@/pages/Phase3';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="animate-spin w-6 h-6 border-2 border-slate-600 border-t-white rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="animate-spin w-6 h-6 border-2 border-slate-600 border-t-white rounded-full" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<PublicRoute><Auth /></PublicRoute>} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><ProjectView /></ProtectedRoute>} />
        <Route path="/projects/:id/phase-0" element={<ProtectedRoute><Phase0 /></ProtectedRoute>} />
        <Route path="/projects/:id/phase-1" element={<ProtectedRoute><Phase1 /></ProtectedRoute>} />
        <Route path="/projects/:id/phase-2" element={<ProtectedRoute><Phase2 /></ProtectedRoute>} />
        <Route path="/projects/:id/phase-3" element={<ProtectedRoute><Phase3 /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
