import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  X,
  ShieldAlert,
} from 'lucide-react';
import { StockMovement, Product, Warehouse, Supplier } from '../types';
import { apiRequest } from '../services/api';

export const StockMovements: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Movement Modal
  const [showModal, setShowModal] = useState<boolean>(
    searchParams.get('action') === 'stock-in' || searchParams.get('action') === 'stock-out'
  );
  const [movementType, setMovementType] = useState<'STOCK_IN' | 'STOCK_OUT'>(
    searchParams.get('action') === 'stock-out' ? 'STOCK_OUT' : 'STOCK_IN'
  );

  // Form State
  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [destination, setDestination] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadMovements = async () => {
    setLoading(true);
    try {
      const [movRes, prodRes, whRes, supRes] = await Promise.all([
        apiRequest<StockMovement[]>(
          `/movements?page=${page}&limit=12&type=${typeFilter}&search=${encodeURIComponent(search)}`
        ),
        apiRequest<Product[]>('/products?limit=100'),
        apiRequest<Warehouse[]>('/warehouses'),
        apiRequest<Supplier[]>('/suppliers'),
      ]);

      if (movRes.success && movRes.data) {
        setMovements(movRes.data);
        if (movRes.meta) setTotalPages(movRes.meta.totalPages || 1);
      }
      if (prodRes.success && prodRes.data) setProducts(prodRes.data);
      if (whRes.success && whRes.data) setWarehouses(whRes.data);
      if (supRes.success && supRes.data) setSuppliers(supRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, [page, typeFilter, search]);

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const res = await apiRequest('/movements', {
        method: 'POST',
        body: JSON.stringify({
          productId,
          warehouseId,
          type: movementType,
          quantity: Number(quantity),
          referenceNumber: referenceNumber || undefined,
          destination: destination || undefined,
          supplierId: supplierId || undefined,
          notes: notes || undefined,
        }),
      });

      if (res.success) {
        setShowModal(false);
        // reset form
        setQuantity(1);
        setReferenceNumber('');
        setDestination('');
        setNotes('');
        loadMovements();
      } else {
        setErrorMessage(res.message || 'Movement failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record movement. Negative stock is prevented.');
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
            <ArrowLeftRight className="w-6 h-6 text-brand-500" />
            Stock Movements & Audit Log
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Full transactional inventory inbound receipts, outbound dispatches, and location transfers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setMovementType('STOCK_IN');
              setShowModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 transition-all"
          >
            <ArrowDownRight className="w-4 h-4" /> Record Stock In
          </button>
          <button
            onClick={() => {
              setMovementType('STOCK_OUT');
              setShowModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-rose-600/30 transition-all"
          >
            <ArrowUpRight className="w-4 h-4" /> Record Stock Out
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Reference, SKU, Product..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
        >
          <option value="">All Movement Types</option>
          <option value="STOCK_IN">Stock In (Receipts)</option>
          <option value="STOCK_OUT">Stock Out (Dispatches)</option>
          <option value="TRANSFER">Internal Transfers</option>
        </select>
      </div>

      {/* Movements Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Movement Type</th>
                <th className="px-4 py-3">Product Name & SKU</th>
                <th className="px-4 py-3">Warehouse</th>
                <th className="px-4 py-3 text-right">Quantity Delta</th>
                <th className="px-4 py-3">Reference / Destination</th>
                <th className="px-4 py-3">Logged By</th>
                <th className="px-4 py-3 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No movement records found.
                  </td>
                </tr>
              ) : (
                movements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                          mov.type === 'STOCK_IN'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {mov.type === 'STOCK_IN' ? (
                          <ArrowDownRight className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        {mov.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">{mov.product.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{mov.product.sku}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">{mov.warehouse.name}</td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-sm">
                      <span className={mov.type === 'STOCK_IN' ? 'text-emerald-600' : 'text-rose-600'}>
                        {mov.type === 'STOCK_IN' ? '+' : '-'}
                        {mov.quantity}
                      </span>
                      <span className="text-[11px] font-normal text-slate-400 ml-1">{mov.product.unit}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                      <div>{mov.referenceNumber || '—'}</div>
                      {mov.destination && <div className="text-[10px] text-slate-400">{mov.destination}</div>}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-medium">
                      {mov.createdBy?.name || 'Automated / System'}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-400 font-mono text-[11px]">
                      {new Date(mov.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Record Stock In / Stock Out */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {movementType === 'STOCK_IN' ? (
                  <>
                    <ArrowDownRight className="w-5 h-5 text-emerald-500" />
                    Record Stock In (Inbound Receipt)
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-5 h-5 text-rose-500" />
                    Record Stock Out (Fulfillment / Dispatch)
                  </>
                )}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleRecordMovement} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Product *
                </label>
                <select
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="">Choose product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Available: {p.totalStock} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Warehouse *
                  </label>
                  <select
                    required
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="">Choose warehouse...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {movementType === 'STOCK_IN' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Supplier (Optional)
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="">None / Internal Restock</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Destination / Customer / Department
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Order Station 4, Retail Store #12"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reference / Consignment Number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. BL-98421, INVOICE-4421"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional inspection or consignment details..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-sm disabled:opacity-50 ${
                    movementType === 'STOCK_IN'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {submitting
                    ? 'Processing...'
                    : movementType === 'STOCK_IN'
                    ? 'Confirm Stock In'
                    : 'Confirm Stock Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
