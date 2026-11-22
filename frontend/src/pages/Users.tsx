import React, { useEffect, useState } from 'react';
import { Users as UsersIcon, Plus, Shield, Mail, Phone, Warehouse, X, CheckCircle2 } from 'lucide-react';
import { User, Warehouse as WHType, Role } from '../types';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<WHType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('INVENTORY_STAFF');
  const [phone, setPhone] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, whRes] = await Promise.all([
        apiRequest<User[]>('/auth/users'),
        apiRequest<WHType[]>('/warehouses'),
      ]);
      if (uRes.success && uRes.data) setUsers(uRes.data);
      if (whRes.success && whRes.data) setWarehouses(whRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await apiRequest('/auth/users', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          phone: phone || undefined,
          warehouseId: warehouseId || null,
        }),
      });

      if (res.success) {
        setShowAddModal(false);
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
        loadData();
      } else {
        setFormError(res.message || 'Failed to create user');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (r: Role) => {
    switch (r) {
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
      case 'WAREHOUSE_MANAGER':
        return 'bg-blue-500/10 text-brand-600 dark:text-brand-400 border border-blue-500/20';
      case 'INVENTORY_STAFF':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-brand-500" />
            User & Access Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Role-based authorization (RBAC) across Administrator, Warehouse Manager, Inventory Staff, and Viewer.
          </p>
        </div>

        {currentUser?.role === 'ADMIN' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm shadow-brand-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">User & Contact</th>
                <th className="px-4 py-3">Role & Permissions</th>
                <th className="px-4 py-3">Assigned Warehouse</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-brand-600 text-[11px]">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        {u.name}
                      </div>
                      <div className="text-[11px] text-slate-400 ml-9">{u.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getRoleBadge(u.role)}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      {u.warehouseName || 'All Warehouses (Global)'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{u.phone || '—'}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add User */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-brand-500" />
                Add New System User
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Liam Taylor"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="liam@warehouse.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="WAREHOUSE_MANAGER">WAREHOUSE_MANAGER</option>
                    <option value="INVENTORY_STAFF">INVENTORY_STAFF</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Warehouse</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="">Global / All</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
