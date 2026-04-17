import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Meus Livros', icon: '\u{1F4DA}' },
  { path: '/settings', label: 'Configurações', icon: '\u2699\uFE0F' },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#0F172A]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 border-r border-slate-800 bg-slate-900/95 backdrop-blur p-6 flex flex-col transform transition-transform lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <h1
          className="text-xl font-bold text-white mb-8 tracking-tight cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          Manuscry
        </h1>
        <nav className="space-y-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1E3A8A]/20 text-[#93C5FD]'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="text-xs text-slate-500 mt-auto pt-4 border-t border-slate-800 space-y-2">
          <p className="truncate">{user?.email}</p>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-slate-500 hover:text-white h-7 px-0 text-xs">
            Sair
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-white font-semibold text-sm">Manuscry</span>
          <div className="w-6" />
        </header>

        <Outlet />
      </div>
    </div>
  );
}
