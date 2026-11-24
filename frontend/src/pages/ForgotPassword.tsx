import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Shield, Lock, Mail, KeyRound, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import { apiRequest } from '../services/api';

export const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (res.success) {
        setSuccess('A verification code has been generated. Please enter it below.');
        if (res.data?.resetCode) {
          setGeneratedCode(res.data.resetCode);
          setResetCode(res.data.resetCode);
        }
        setStep(2);
      } else {
        setError(res.message || 'Failed to send reset code');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const res = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email,
          resetCode,
          newPassword,
        }),
      });

      if (res.success) {
        setSuccess('Your password has been successfully reset! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2500);
      } else {
        setError(res.message || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100">
      {/* Left Showcase Banner */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 p-12 flex-col justify-between border-r border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Logix<span className="text-brand-400 font-extrabold">WMS</span>
                <span className="text-xs bg-brand-500/20 text-brand-300 font-semibold px-2 py-0.5 rounded border border-brand-500/30">
                  ENTERPRISE
                </span>
              </h1>
              <p className="text-xs text-slate-400">Next-Gen Intelligent Supply Chain & Inventory OS</p>
            </div>
          </div>

          <div className="mt-20 space-y-6 max-w-lg">
            <h2 className="text-3xl font-extrabold text-white leading-tight">
              Enterprise Security & Self-Service Account Recovery.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Fast, secure credential recovery for warehouse operators and system administrators.
              Encrypted tokens protect your data against unauthorized password alterations.
            </p>
            <div className="space-y-3 pt-4">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-white">Timed Verification Codes</p>
                  <p className="text-[11px] text-slate-400">15-minute token expiration window</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-white">Encrypted Cryptographic Hashing</p>
                  <p className="text-[11px] text-slate-400">Bcrypt password encryption on store</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-white">Audited Security Events</p>
                  <p className="text-[11px] text-slate-400">Full audit log footprint of every password reset</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-6">
          <span>Enterprise Security Module</span>
          <span>End-to-End SSL Verified</span>
        </div>
      </div>

      {/* Right Recovery Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-14 lg:px-20 max-w-xl mx-auto w-full py-12">
        <div className="mb-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs text-brand-400 hover:text-brand-300 font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>

          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-white">LogixWMS</span>
          </div>

          <h2 className="text-2xl font-bold text-white">Reset Account Password</h2>
          <p className="text-xs text-slate-400 mt-1">
            {step === 1
              ? 'Enter your registered email address to receive a 6-digit recovery code'
              : 'Enter the 6-digit code and choose a new secure password'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
            <Shield className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* Development & Testing Verification Code Banner */}
        {generatedCode && (
          <div className="mb-5 p-4 rounded-xl bg-brand-500/15 border border-brand-500/30 text-white text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-brand-300 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4" /> Verification Code Generated:
              </span>
              <span className="font-mono text-base font-bold tracking-widest text-brand-400 bg-slate-900 px-2 py-0.5 rounded border border-brand-500/40">
                {generatedCode}
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              This code has been auto-filled below and is valid for 15 minutes.
            </p>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Registered Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@warehouse.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-sm shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? 'Generating Code...' : 'Send Verification Code'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">6-Digit Verification Code</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.trim())}
                  placeholder="e.g. 583921"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-mono tracking-widest text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-sm shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setGeneratedCode(null);
                setResetCode('');
              }}
              className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Didn't receive the code? Request another
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Remembered your credentials?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-4">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
