import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Eye,
  AlertTriangle,
  Barcode,
  CheckCircle2,
  X,
  Package,
} from 'lucide-react';
import { Product, Category, Warehouse } from '../types';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Inventory: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { hasRole } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Pagination
  const [search, setSearch] = useState<string>(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('filter') || '');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(searchParams.get('action') === 'add');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Product | null>(null);

  // Add Product Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [minStockLevel, setMinStockLevel] = useState<number>(10);
  const [initialWarehouseId, setInitialWarehouseId] = useState('');
  const [initialStock, setInitialStock] = useState<number>(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, whRes] = await Promise.all([
        apiRequest<Product[]>(
          `/products?page=${page}&limit=10&search=${encodeURIComponent(search)}&categoryId=${selectedCategory}&status=${selectedStatus}`
        ),
        apiRequest<Category[]>('/products/categories'),
        apiRequest<Warehouse[]>('/warehouses'),
      ]);

      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data);
        if (prodRes.meta) setTotalPages(prodRes.meta.totalPages || 1);
      }
      if (catRes.success && catRes.data) setCategories(catRes.data);
      if (whRes.success && whRes.data) setWarehouses(whRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, search, selectedCategory, selectedStatus]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify({
          name,
          sku,
          barcode: barcode || null,
          description: description || null,
          categoryId,
          unit,
          costPrice: Number(costPrice),
          sellingPrice: Number(sellingPrice),
          minStockLevel: Number(minStockLevel),
          initialWarehouseId: initialWarehouseId || undefined,
          initialStock: Number(initialStock),
        }),
      });

      if (res.success) {
        setShowAddModal(false);
        // Reset form
        setName('');
        setSku('');
        setBarcode('');
        setDescription('');
        setCostPrice(0);
        setSellingPrice(0);
        setInitialStock(0);
        loadData();
      } else {
        setFormError(res.message || 'Failed to create product');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error creating product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (prodId: string) => {
    try {
      const res = await apiRequest(`/products/${prodId}`, { method: 'DELETE' });
      if (res.success) {
        setShowDeleteConfirm(null);
        loadData();
      } else {
        alert(res.message || 'Failed to delete product');
      }
    } catch (err: any) {
      alert(err.message || 'Cannot delete product with active inventory.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-brand-500" />
            Inventory & SKU Master
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time catalog, stock levels, warehouse allocations, and unit pricing.
          </p>
        </div>

        {hasRole(['ADMIN', 'WAREHOUSE_MANAGER', 'INVENTORY_STAFF']) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm shadow-brand-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Product
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Filter by Name, SKU, Barcode..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Stock Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Product Name & SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Barcode</th>
                <th className="px-4 py-3 text-right">Cost / Sell</th>
                <th className="px-4 py-3 text-right">Available Stock</th>
                <th className="px-4 py-3 text-center">Status</th>
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
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No products matched your search or filters.
                  </td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr
                    key={prod.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{prod.name}</div>
                      <div className="text-[11px] font-mono text-brand-600 dark:text-brand-400 font-semibold">
                        {prod.sku}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      {prod.category?.name || 'General'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {prod.barcode ? (
                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          <Barcode className="w-3 h-3 text-slate-400" />
                          {prod.barcode}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-slate-800 dark:text-slate-200">
                      <div>${prod.sellingPrice?.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400">Cost: ${prod.costPrice?.toFixed(2)}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {prod.totalStock}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-1">{prod.unit}</span>
                      <div className="text-[10px] text-slate-400">Min: {prod.minStockLevel}</div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          prod.stockStatus === 'in_stock'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : prod.stockStatus === 'low_stock'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}
                      >
                        {prod.stockStatus === 'in_stock'
                          ? 'In Stock'
                          : prod.stockStatus === 'low_stock'
                          ? 'Low Stock'
                          : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedProduct(prod);
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {hasRole(['ADMIN', 'WAREHOUSE_MANAGER']) && (
                          <button
                            onClick={() => setShowDeleteConfirm(prod)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Add Product */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-500" />
                Add New Inventory Product
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

            <form onSubmit={handleCreateProduct} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Proximity Laser Sensor 24V"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="e.g. SENS-001"
                    className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Barcode (EAN/UPC)
                  </label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="e.g. 890123456789"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit of Measure *
                  </label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="pcs, box, kg, pack"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cost Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Selling Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Min Stock Threshold *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={minStockLevel}
                    onChange={(e) => setMinStockLevel(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Initial Warehouse Stocking */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Initial Warehouse Stock (Optional)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <select
                      value={initialWarehouseId}
                      onChange={(e) => setInitialWarehouseId(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      value={initialStock}
                      onChange={(e) => setInitialStock(parseInt(e.target.value) || 0)}
                      placeholder="Initial Units"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
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
                  {submitting ? 'Creating...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Details */}
      {showDetailsModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{selectedProduct.name}</h3>
                <span className="font-mono text-xs text-brand-600 dark:text-brand-400 font-semibold">
                  SKU: {selectedProduct.sku}
                </span>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedProduct.category?.name}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Stock Units</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedProduct.totalStock} {selectedProduct.unit}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Cost Price</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    ${selectedProduct.costPrice?.toFixed(2)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Selling Price</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ${selectedProduct.sellingPrice?.toFixed(2)}
                  </span>
                </div>
              </div>

              {selectedProduct.inventories && selectedProduct.inventories.length > 0 && (
                <div className="pt-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Warehouse Stock Breakdown:
                  </span>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {selectedProduct.inventories.map((inv) => (
                      <div key={inv.id} className="p-2.5 flex items-center justify-between">
                        <span>{inv.warehouse.name}</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {inv.quantity} {selectedProduct.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Delete Product?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">{showDeleteConfirm.name}</span>? This action is permanent and only allowed if stock is zero.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm.id)}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
