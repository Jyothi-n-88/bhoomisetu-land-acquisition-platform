import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Shield, KeyRound, AlertCircle, UserPlus, Globe, CheckCircle2 } from 'lucide-react';
import { useAuth, Role } from '../context/AuthContext';
import { ssoRegisterRequest, fetchGoogleUserInfo } from '../services/ssoService';

export default function Register() {
  // Manual Registration State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('FIELD_OFFICER');
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // Secondary Modal State for Google SSO Registration
  const [showSsoModal, setShowSsoModal] = useState(false);
  const [ssoData, setSsoData] = useState<{
    name: string;
    email: string;
    role: Role;
    secretKey: string;
  }>({
    name: '',
    email: '',
    role: 'FIELD_OFFICER',
    secretKey: '',
  });
  const [ssoModalError, setSsoModalError] = useState('');
  const [ssoLoading, setSsoLoading] = useState(false);

  // Placeholder OAuth fallback prompt state
  const [showFallbackPrompt, setShowFallbackPrompt] = useState(false);
  const [fallbackName, setFallbackName] = useState('');
  const [fallbackEmail, setFallbackEmail] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  // Handle standard manual registration with secretKey
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, secretKey }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show OTP modal instead of logging in directly
        setShowOtpModal(true);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err: any) {
      setError('An error occurred during registration. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);
        navigate('/');
      } else {
        setOtpError(data.message || 'OTP verification failed');
      }
    } catch (err: any) {
      setOtpError('An error occurred during verification. Please check your connection.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Triggered when Google returns credentials
  const openSecondarySsoModal = (retrievedName: string, retrievedEmail: string) => {
    setSsoData({
      name: retrievedName,
      email: retrievedEmail,
      role: 'FIELD_OFFICER',
      secretKey: '',
    });
    setSsoModalError('');
    setShowSsoModal(true);
  };

  // Prompt fallback for placeholder Google OAuth credentials
  const handleSsoFallbackPrompt = () => {
    setFallbackName('');
    setFallbackEmail('');
    setShowFallbackPrompt(true);
  };

  const handleFallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fallbackEmail || !fallbackName) return;
    setShowFallbackPrompt(false);
    openSecondarySsoModal(fallbackName, fallbackEmail);
  };

  // Google OAuth registration trigger
  const googleRegister = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError('');
        const profile = await fetchGoogleUserInfo(tokenResponse.access_token);
        openSecondarySsoModal(profile.name, profile.email);
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve profile from Google.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      handleSsoFallbackPrompt();
    },
  });

  // Submit secondary SSO registration modal
  const handleSsoModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSsoModalError('');
    setSsoLoading(true);

    try {
      const { ok, data } = await ssoRegisterRequest({
        name: ssoData.name,
        email: ssoData.email,
        role: ssoData.role,
        secretKey: ssoData.secretKey,
        provider: 'google',
      });

      if (ok) {
        login(data.user, data.token);
        setShowSsoModal(false);
        navigate('/');
      } else {
        setSsoModalError(data.message || 'SSO registration failed');
      }
    } catch (err) {
      setSsoModalError('Failed to complete official registration. Check network connection.');
    } finally {
      setSsoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 font-sans py-12">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-600 rounded-md mx-auto mb-4 flex items-center justify-center shadow-sm">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Official Registration</h2>
          <p className="text-slate-500 text-sm mt-1">Restricted Invite-Only Government Access</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {/* Google SSO Registration Button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => {
              try {
                googleRegister();
              } catch (err) {
                handleSsoFallbackPrompt();
              }
            }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>Register with Google</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Or register with credentials
          </span>
          <div className="border-t border-slate-200 w-full"></div>
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Official Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
              placeholder="e.g. S. Ramanathan"
            />
          </div>

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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Authority Designation / Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors bg-white"
            >
              <option value="CENTRAL_AUTHORITY">Central Authority</option>
              <option value="STATE_AUTHORITY">State Authority</option>
              <option value="DISTRICT_AUTHORITY">District Authority</option>
              <option value="FIELD_OFFICER">Field Officer</option>
            </select>
          </div>

          {/* Required Official Secret Key Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
              <span>Official Secret Key</span>
              <span className="text-xs text-amber-600 font-semibold">Invite-Only</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                placeholder="Enter government registration token"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Validation key issued by the BhoomiSetu System Administrator.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-medium py-2.5 rounded-lg hover:bg-emerald-700 transition-colors text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Verifying & Registering...' : 'Register Official Account'}</span>
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="text-slate-900 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Verify Email
                </h3>
                <p className="text-xs text-slate-500">
                  Enter the OTP sent to your email
                </p>
              </div>
            </div>

            {otpError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-snug">{otpError}</div>
              </div>
            )}

            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Sent to:</span>
                  <span className="font-mono text-slate-800 truncate">{email}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  6-Digit OTP
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-center text-xl tracking-[0.5em] font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="------"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={otpLoading || otpCode.length !== 6}
                  className="w-full py-2.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {otpLoading ? 'Verifying...' : 'Verify & Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Secondary Modal for Google SSO Registration (Step 2: Role & Secret Key) */}
      {showSsoModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Complete Official Registration
                </h3>
                <p className="text-xs text-slate-500">
                  Authenticated via Google SSO
                </p>
              </div>
            </div>

            {ssoModalError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-snug">{ssoModalError}</div>
              </div>
            )}

            <form onSubmit={handleSsoModalSubmit} className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Google Name:</span>
                  <span className="font-semibold text-slate-800">{ssoData.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Official Email:</span>
                  <span className="font-mono text-slate-800 truncate">{ssoData.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Assign Official Role
                </label>
                <select
                  value={ssoData.role}
                  onChange={(e) => setSsoData({ ...ssoData, role: e.target.value as Role })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="CENTRAL_AUTHORITY">Central Authority</option>
                  <option value="STATE_AUTHORITY">State Authority</option>
                  <option value="DISTRICT_AUTHORITY">District Authority</option>
                  <option value="FIELD_OFFICER">Field Officer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                  <span>Official Secret Key</span>
                  <span className="text-amber-600">Required</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={ssoData.secretKey}
                    onChange={(e) => setSsoData({ ...ssoData, secretKey: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Enter government registration secret key"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Invite-only official validation key required for government onboarding.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSsoModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ssoLoading}
                  className="px-5 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {ssoLoading ? 'Validating...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fallback Prompt Modal for Testing with Placeholder Google OAuth ID */}
      {showFallbackPrompt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Google SSO Registration Simulation
                </h3>
                <p className="text-xs text-slate-500">OAuth Identity Capture</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Enter official Google profile details to proceed to the secondary Role and Secret Key verification step:
            </p>

            <form onSubmit={handleFallbackSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={fallbackName}
                  onChange={(e) => setFallbackName(e.target.value)}
                  placeholder="e.g. Anand Sharma"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Official Google Email
                </label>
                <input
                  type="email"
                  required
                  value={fallbackEmail}
                  onChange={(e) => setFallbackEmail(e.target.value)}
                  placeholder="e.g. anand.sharma@gov.in"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFallbackPrompt(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Continue to Role & Secret Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
