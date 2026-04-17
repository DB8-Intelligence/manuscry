import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ErrorBoundary from '@/components/app/ErrorBoundary';
import Landing from '@/pages/Landing';
import Auth from '@/pages/Auth';
import AuthCallback from '@/pages/AuthCallback';
import Dashboard from '@/pages/Dashboard';
import Welcome from '@/pages/Welcome';
import ProjectView from '@/pages/ProjectView';
import Phase0 from '@/pages/Phase0';
import Phase1 from '@/pages/Phase1';
import Phase2 from '@/pages/Phase2';
import Phase3 from '@/pages/Phase3';
import Phase4 from '@/pages/Phase4';
import Phase5 from '@/pages/Phase5';
import SocialStudio from '@/pages/SocialStudio';
import ManuscriptEditor from '@/pages/ManuscriptEditor';
import UploadManuscript from '@/pages/UploadManuscript';
import Settings from '@/pages/Settings';
import Blog from '@/pages/Blog';
import BlogArticle from '@/pages/BlogArticle';
import Marketplace from '@/pages/Marketplace';
import Royalties from '@/pages/Royalties';
import NotFound from '@/pages/NotFound';

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
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicRoute><Auth /></PublicRoute>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogArticle />} />
          <Route path="/store" element={<Marketplace />} />

          {/* Protected */}
          <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/projects" element={<Navigate to="/dashboard" replace />} />
          <Route path="/projects/new" element={<Navigate to="/dashboard" replace />} />
          <Route path="/upload" element={<ProtectedRoute><UploadManuscript /></ProtectedRoute>} />
          <Route path="/royalties" element={<ProtectedRoute><Royalties /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          <Route path="/projects/:id" element={<ProtectedRoute><ProjectView /></ProtectedRoute>} />
          <Route path="/projects/:id/phase-0" element={<ProtectedRoute><Phase0 /></ProtectedRoute>} />
          <Route path="/projects/:id/phase-1" element={<ProtectedRoute><Phase1 /></ProtectedRoute>} />
          <Route path="/projects/:id/phase-2" element={<ProtectedRoute><Phase2 /></ProtectedRoute>} />
          <Route path="/projects/:id/phase-3" element={<ProtectedRoute><Phase3 /></ProtectedRoute>} />
          <Route path="/projects/:id/phase-4" element={<ProtectedRoute><Phase4 /></ProtectedRoute>} />
          <Route path="/projects/:id/phase-5" element={<ProtectedRoute><Phase5 /></ProtectedRoute>} />
          <Route path="/projects/:id/social" element={<ProtectedRoute><SocialStudio /></ProtectedRoute>} />
          <Route path="/projects/:id/editor" element={<ProtectedRoute><ManuscriptEditor /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
