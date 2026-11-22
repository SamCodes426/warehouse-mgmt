import React, { useEffect, useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Building,
  CheckCircle2,
  X,
  ClipboardList,
} from 'lucide-react';
import { Supplier } from '../types';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Suppliers: React.FC = () => {
  const { hasRole } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<Supplier[]>('/suppliers');
      if (res.success && res.data) {
        setSuppliers(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await apiRequest('/suppliers', {
        method: 'POST',
        body: JSON.stringify({
          name,
          companyName,
          email,
          phone,
          address,
          gstNumber: gstNumber || null,
          contactPerson: contactPerson || null,
        }),
      });

      if (res.success) {
        setShowAddModal(false);
        setName('');
        setCompanyName('');
        setEmail('');
        setPhone('');
        setAddress('');
        setGstNumber('');
        setContactPerson('');
        loadSuppliers();
      } else {
        setFormError(res.message || 'Failed to create supplier');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.companyName.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-brand-500" />
            Supplier Directory & Vendors
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage procurement partners, tax identifiers, and purchase order relations.
          </p>
        </div>

        {hasRole(['ADMIN', 'WAREHOUSE_MANAGER']) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm shadow-brand-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Supplier
          </button>
        )}
      </div>

      {/* Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Company, Contact, Email..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Supplier Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="inline-block w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          No suppliers found matching your query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((sup) => (
            <div
              key={sup.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between hover:border-brand-500/40 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{sup.companyName}</h3>
                    <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                      Contact: {sup.name} {sup.contactPerson ? `(${sup.contactPerson})` : ''}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      sup.isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-500/10 text-slate-400'
                    }`}
                  >
                    {sup.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{sup.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{sup.phone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{sup.address}</span>
                  </div>
                  {sup.gstNumber && (
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-[11px] font-mono mt-2">
                      <span className="text-slate-400">GST:</span> {sup.gstNumber}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-brand-500" />
                  {sup._count?.purchaseOrders || 0} Purchase Order(s)
                </span>
                <span>{sup._count?.products || 0} Catalogs</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Supplier */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand-500" />
                Register New Supplier
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

            <form onSubmit={handleCreateSupplier} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Industrial Dynamics"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Richard Chen"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation / Role
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. VP Sales"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sales@apex.com"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (800) 555-0199"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Physical Office Address *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, State, Country"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tax / GST Identification Number
                </label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="e.g. GSTIN-26AAACA1234A1Z5"
                  className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
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
                  {submitting ? 'Registering...' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
