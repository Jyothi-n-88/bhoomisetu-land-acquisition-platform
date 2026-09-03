import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Shield, KeyRound, AlertCircle, LogIn, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ssoLoginRequest, fetchGoogleUserInfo } from '../services/ssoService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fallback modal state for testing when placeholder OAuth client ID is active
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [fallbackEmail, setFallbackEmail] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);
        navigate(from, { replace: true });
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const executeGoogleLogin = async (ssoEmail: string) => {
    setLoading(true);
    setError('');
    try {
      const { ok, status, data } = await ssoLoginRequest(ssoEmail, 'google');
      if (ok) {
        login(data.user, data.token);
        navigate(from, { replace: true });
      } else if (status === 404) {
        setError('Account not found. Please register as a new official.');
      } else {
        setError(data.message || 'SSO Login failed');
      }
    } catch (err) {
      setError('Failed to connect to authentication service. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError('');
        const profile = await fetchGoogleUserInfo(tokenResponse.access_token);
        await executeGoogleLogin(profile.email);
      } catch (err: any) {
        setError(err.message || 'Failed to authenticate via Google.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setFallbackEmail('');
      setShowFallbackModal(true);
    },
  });

  const handleFallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fallbackEmail) return;
    setShowFallbackModal(false);
    executeGoogleLogin(fallbackEmail);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 font-sans py-12">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-600 rounded-md mx-auto mb-4 flex items-center justify-center shadow-sm">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Official Portal Login</h2>
          <p className="text-slate-500 text-sm mt-1">BhoomiSetu National Land Acquisition Platform</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {/* Google SSO Button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => {
              try {
                googleLogin();
              } catch (err) {
                setFallbackEmail('');
                setShowFallbackModal(true);
              }
            }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>Sign in with Google</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Or continue with password
          </span>
          <div className="border-t border-slate-200 w-full"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Official Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
              placeholder="official@bhoomisetu.gov.in"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-medium py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-sm text-slate-500">
          Authorized official without an account?{' '}
          <Link to="/register" className="text-emerald-600 font-semibold hover:underline">
            Register with Secret Key
          </Link>
        </div>
      </div>

      {/* Fallback modal for testing when placeholder OAuth ID is configured */}
      {showFallbackModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Google SSO Official Login
                </h3>
                <p className="text-xs text-slate-500">OAuth Verification Simulation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Enter your official Google email address to verify official credentials against the backend:
            </p>

            <form onSubmit={handleFallbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Official Google Email
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={fallbackEmail}
                  onChange={(e) => setFallbackEmail(e.target.value)}
                  placeholder="e.g. officer1@bhoomisetu.gov.in"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFallbackModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Verify Official Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
