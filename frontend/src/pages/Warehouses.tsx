import React, { useEffect, useState } from 'react';
import {
  Warehouse as WarehouseIcon,
  Plus,
  MapPin,
  User,
  Phone,
  Layers,
  CheckCircle2,
  X,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { Warehouse } from '../types';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Warehouses: React.FC = () => {
  const { hasRole } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [managerName, setManagerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [capacity, setCapacity] = useState<number>(10000);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadWarehouses = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<Warehouse[]>('/warehouses');
      if (res.success && res.data) {
        setWarehouses(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await apiRequest('/warehouses', {
        method: 'POST',
        body: JSON.stringify({
          name,
          code,
          address,
          city,
          state,
          managerName: managerName || null,
          contactNumber: contactNumber || null,
          capacity: Number(capacity),
        }),
      });

      if (res.success) {
        setShowAddModal(false);
        setName('');
        setCode('');
        setAddress('');
        setCity('');
        setState('');
        setManagerName('');
        setContactNumber('');
        loadWarehouses();
      } else {
        setFormError(res.message || 'Failed to create warehouse');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-500" />
            Warehouses & Storage Facilities
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Multi-facility capacity tracking, storage utilization, and bin configuration.
          </p>
        </div>

        {hasRole(['ADMIN', 'WAREHOUSE_MANAGER']) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm shadow-brand-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Warehouse
          </button>
        )}
      </div>

      {/* Warehouse Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="inline-block w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : warehouses.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          No warehouses configured yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map((wh) => (
            <div
              key={wh.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between hover:border-brand-500/40 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                      {wh.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">{wh.name}</h3>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      wh.isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-500/10 text-slate-400'
                    }`}
                  >
                    {wh.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">
                      {wh.address}, {wh.city}, {wh.state}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Manager: {wh.managerName || 'Unassigned'}</span>
                  </div>
                  {wh.contactNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{wh.contactNumber}</span>
                    </div>
                  )}
                </div>

                {/* Capacity Progress Bar */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Capacity Utilization</span>
                    <span className="font-bold text-slate-900 dark:text-white">{wh.utilization}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        wh.utilization > 85
                          ? 'bg-rose-500'
                          : wh.utilization > 60
                          ? 'bg-amber-500'
                          : 'bg-brand-500'
                      }`}
                      style={{ width: `${Math.min(100, wh.utilization)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                    <span>{wh.currentStockUnits.toLocaleString()} units stored</span>
                    <span>Max {wh.capacity.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Locations / Bins count */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-500" />
                  {wh.locations?.length || wh.locationsCount || 0} Storage Location(s)
                </span>
                <button
                  onClick={() => setSelectedWarehouse(wh)}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  View Locations →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Warehouse */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-500" />
                Add New Warehouse Facility
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

            <form onSubmit={handleCreateWarehouse} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Facility Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Midwest Logistics Hub"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. MLH-04"
                    className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 500 Industrial Blvd"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Chicago"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    State / Province *
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. IL"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Manager Name
                  </label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="e.g. David Vance"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Unit Capacity *
                  </label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value) || 10000)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
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
                  {submitting ? 'Creating...' : 'Save Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Warehouse Locations / Bins */}
      {selectedWarehouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {selectedWarehouse.name} ({selectedWarehouse.code})
                </h3>
                <span className="text-xs text-slate-400">Configured Storage Zones & Bins</span>
              </div>
              <button
                onClick={() => setSelectedWarehouse(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2 max-h-72 overflow-y-auto">
              {!selectedWarehouse.locations || selectedWarehouse.locations.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">No locations configured yet.</div>
              ) : (
                selectedWarehouse.locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold font-mono text-brand-600 dark:text-brand-400 block">{loc.code}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {loc.zone} • Aisle {loc.aisle} • Rack {loc.rack} • Shelf {loc.shelf} • Bin {loc.bin}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Cap: {loc.capacity}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedWarehouse(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
