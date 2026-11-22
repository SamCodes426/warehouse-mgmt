import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  Printer,
  X,
  PackageCheck,
} from 'lucide-react';
import { PurchaseOrder, Supplier, Warehouse, Product } from '../types';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const PurchaseOrders: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { hasRole } = useAuth();

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(searchParams.get('action') === 'new');
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState<boolean>(false);

  // Create PO Form State
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState<number>(18);
  const [items, setItems] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([
    { productId: '', quantity: 1, unitPrice: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Receiving state
  const [receivingQuantities, setReceivingQuantities] = useState<Record<string, number>>({});
  const [receivingSubmitting, setReceivingSubmitting] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const [orderRes, supRes, whRes, prodRes] = await Promise.all([
        apiRequest<PurchaseOrder[]>(
          `/orders?page=${page}&limit=10&status=${statusFilter}&search=${encodeURIComponent(search)}`
        ),
        apiRequest<Supplier[]>('/suppliers'),
        apiRequest<Warehouse[]>('/warehouses'),
        apiRequest<Product[]>('/products?limit=100'),
      ]);

      if (orderRes.success && orderRes.data) {
        setOrders(orderRes.data);
        if (orderRes.meta) setTotalPages(orderRes.meta.totalPages || 1);
      }
      if (supRes.success && supRes.data) setSuppliers(supRes.data);
      if (whRes.success && whRes.data) setWarehouses(whRes.data);
      if (prodRes.success && prodRes.data) setProducts(prodRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter, search]);

  // Line item manipulation
  const addItemRow = () => {
    setItems([...items, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItemRow = (index: number, field: string, value: any) => {
    const updated = [...items];
    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      updated[index].productId = value;
      if (prod) updated[index].unitPrice = prod.costPrice || 0;
    } else {
      (updated[index] as any)[field] = value;
    }
    setItems(updated);
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, curr) => acc + (curr.quantity || 0) * (curr.unitPrice || 0), 0);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate items
    const invalidItem = items.find((i) => !i.productId || i.quantity <= 0);
    if (invalidItem) {
      setFormError('Please select valid products and positive quantities for all order lines.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          supplierId,
          warehouseId,
          expectedDate: expectedDate || null,
          notes: notes || null,
          taxRate: Number(taxRate),
          items: items.map((i) => ({
            productId: i.productId,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
          })),
        }),
      });

      if (res.success) {
        setShowCreateModal(false);
        setItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
        setNotes('');
        loadOrders();
      } else {
        setFormError(res.message || 'Failed to create order');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error creating order');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Receive Modal
  const openReceiveModal = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    const initialQtyMap: Record<string, number> = {};
    order.items.forEach((item) => {
      const remaining = item.quantity - item.receivedQuantity;
      initialQtyMap[item.id] = Math.max(0, remaining);
    });
    setReceivingQuantities(initialQtyMap);
    setShowReceiveModal(true);
  };

  const handleConfirmReceive = async () => {
    if (!selectedOrder) return;
    setReceivingSubmitting(true);

    try {
      const receivedItems = Object.entries(receivingQuantities).map(([itemId, quantityReceived]) => ({
        itemId,
        quantityReceived: Number(quantityReceived),
      }));

      const res = await apiRequest(`/orders/${selectedOrder.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'RECEIVED',
          receivedItems,
        }),
      });

      if (res.success) {
        setShowReceiveModal(false);
        setSelectedOrder(null);
        loadOrders();
      } else {
        alert(res.message || 'Failed to update order');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating order');
    } finally {
      setReceivingSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'PARTIALLY_RECEIVED':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'ORDERED':
      case 'APPROVED':
        return 'bg-blue-500/10 text-blue-600 dark:text-brand-400 border border-blue-500/20';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-600 border border-red-500/20';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-brand-500" />
            Purchase Orders & Procurement
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Vendor requisition workflows, line-item taxes, and automated stock receipt reconciliation.
          </p>
        </div>

        {hasRole(['ADMIN', 'WAREHOUSE_MANAGER']) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm shadow-brand-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Purchase Order
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PO #, Supplier Company..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
        >
          <option value="">All Order Statuses</option>
          <option value="PENDING">Pending Approval</option>
          <option value="ORDERED">Ordered</option>
          <option value="PARTIALLY_RECEIVED">Partially Received</option>
          <option value="RECEIVED">Received & Stocked</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">PO Number</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Destination Warehouse</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Items & Total Amount</th>
                <th className="px-4 py-3">Created Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No purchase orders found matching query.
                  </td>
                </tr>
              ) : (
                orders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-bold font-mono text-brand-600 dark:text-brand-400">
                      {po.orderNumber}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">{po.supplier.companyName}</div>
                      <div className="text-[10px] text-slate-400">{po.supplier.email}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">{po.warehouse.name}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(po.status)}`}>
                        {po.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        ${Number(po.totalAmount).toFixed(2)}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        {po.items?.length || 0} line item(s) (incl. {Number(po.taxRate)}% tax)
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && hasRole(['ADMIN', 'WAREHOUSE_MANAGER']) && (
                          <button
                            onClick={() => openReceiveModal(po)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm transition-all"
                          >
                            <PackageCheck className="w-3.5 h-3.5" /> Receive Items
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedOrder(po);
                            window.print();
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Print PO"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
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

      {/* Modal: Create Purchase Order */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-brand-500" />
                Create Supplier Purchase Order
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
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

            <form onSubmit={handleCreateOrder} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Supplier *
                  </label>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="">Choose Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.companyName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Destination Warehouse *
                  </label>
                  <select
                    required
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="">Choose Warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Line Items Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Order Items & Quantities *
                  </label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product Row
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-6">
                        <select
                          required
                          value={item.productId}
                          onChange={(e) => updateItemRow(index, 'productId', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                        >
                          <option value="">Select SKU / Item</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => updateItemRow(index, 'quantity', parseInt(e.target.value) || 1)}
                          placeholder="Qty"
                          className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={item.unitPrice}
                          onChange={(e) => updateItemRow(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          placeholder="Unit $"
                          className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    ${calculateSubtotal().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Tax Rate (%)</span>
                  <input
                    type="number"
                    min="0"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-16 px-1.5 py-0.5 text-right text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                  />
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-bold text-sm">
                  <span className="text-slate-900 dark:text-white">Estimated Grand Total</span>
                  <span className="text-brand-600 dark:text-brand-400">
                    ${(calculateSubtotal() * (1 + taxRate / 100)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Generating...' : 'Confirm & Issue PO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Receive Purchase Order Items */}
      {showReceiveModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-emerald-500" />
                  Receive Inbound Consignment
                </h3>
                <span className="text-xs text-slate-400 font-mono">PO #{selectedOrder.orderNumber}</span>
              </div>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
              Enter the actual verified quantities received at{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {selectedOrder.warehouse.name}
              </span>
              . Warehouse stock will automatically increment upon confirmation.
            </p>

            <div className="mt-4 space-y-3">
              {selectedOrder.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">{item.product.name}</span>
                    <span className="text-slate-400 text-[11px]">
                      Ordered: {item.quantity} {item.product.unit} (Already Received: {item.receivedQuantity})
                    </span>
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] text-slate-400 block mb-0.5">Qty Received Now</label>
                    <input
                      type="number"
                      min="0"
                      max={item.quantity - item.receivedQuantity}
                      value={receivingQuantities[item.id] || 0}
                      onChange={(e) =>
                        setReceivingQuantities({
                          ...receivingQuantities,
                          [item.id]: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-right font-bold"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowReceiveModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReceive}
                disabled={receivingSubmitting}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm disabled:opacity-50"
              >
                {receivingSubmitting ? 'Updating Inventory...' : 'Confirm Receipt & Increment Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
