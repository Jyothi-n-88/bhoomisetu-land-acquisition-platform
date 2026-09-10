import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'Projects', path: '/projects' },
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-[#f8fafc] text-slate-800 font-sans overflow-hidden">
      <header className="h-20 border-b border-slate-200 bg-white flex items-center justify-between px-10 shrink-0">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 bg-emerald-600 rounded-md flex items-center justify-center transition-transform group-hover:scale-105">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">BhoomiSetu</h1>
          </Link>

          <nav className="hidden md:flex space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path))
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-200 cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col md:flex-row p-10 gap-8 overflow-y-auto">
        {children}
      </main>

      <footer className="h-12 border-t border-slate-200 bg-white flex items-center justify-between px-10 shrink-0 text-xs text-slate-400">
        <span>&copy; {new Date().getFullYear()} BhoomiSetu - Smart India Hackathon 2026 Prototype</span>
        <span className="uppercase font-semibold tracking-widest text-emerald-600">SIH26016 - Production Ready</span>
      </footer>
    </div>
  );
}
