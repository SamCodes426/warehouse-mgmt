import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, Shield, Lock, Mail, User, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('INVENTORY_STAFF');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const res = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          role,
          password,
        }),
      });

      if (res.success && res.data) {
        login(res.data.token, res.data.user);
        navigate('/dashboard');
      } else {
        setError(res.message || 'Registration failed');
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

          <div className="mt-16 space-y-6 max-w-lg">
            <h2 className="text-3xl font-extrabold text-white leading-tight">
              Create your warehouse operational account.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Join your organization's real-time fulfillment network. Collaborate across multi-bin inventory,
              manage dispatch workflows, and maintain transparent audit trails.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-white">Instant Portal Access</p>
                  <p className="text-[11px] text-slate-400">Immediate inventory workspace</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-white">Role-Based Security</p>
                  <p className="text-[11px] text-slate-400">Tailored operational permissions</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-white">Audit Trail Logging</p>
                  <p className="text-[11px] text-slate-400">Every change tracked by user</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-white">Multi-Warehouse Ready</p>
                  <p className="text-[11px] text-slate-400">Scalable to infinite locations</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-6">
          <span>Enterprise Registration</span>
          <span>PostgreSQL + Prisma Cloud</span>
        </div>
      </div>

      {/* Right Registration Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-14 lg:px-20 max-w-xl mx-auto w-full py-12">
        <div className="mb-6">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-white">LogixWMS</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Create Enterprise Account</h2>
          <p className="text-xs text-slate-400 mt-1">Register for warehouse management access</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
            <Shield className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Work Email Address</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Organizational Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              >
                <option value="INVENTORY_STAFF">Inventory Staff</option>
                <option value="WAREHOUSE_MANAGER">Warehouse Manager</option>
                <option value="VIEWER">Auditor / Viewer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm Password</label>
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-sm shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? 'Creating Account...' : 'Register Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Already have an enterprise account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-4">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
