export type Role = 'ADMIN' | 'WAREHOUSE_MANAGER' | 'INVENTORY_STAFF' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  avatar?: string;
  warehouseId?: string | null;
  warehouseName?: string | null;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  _count?: { products: number };
}

export interface ProductInventory {
  id: string;
  warehouseId: string;
  warehouse: { id: string; name: string; code: string };
  location?: { id: string; code: string; zone: string };
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  minStockLevel: number;
  category: { id: string; name: string };
  supplier?: { id: string; companyName: string; name: string };
  totalStock: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  inventories?: ProductInventory[];
  createdAt: string;
}

export interface WarehouseLocation {
  id: string;
  warehouseId: string;
  zone: string;
  aisle: string;
  rack: string;
  shelf: string;
  bin: string;
  code: string;
  capacity: number;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  managerName?: string;
  contactNumber?: string;
  capacity: number;
  currentStockUnits: number;
  utilization: number;
  isActive: boolean;
  locationsCount?: number;
  locations?: WarehouseLocation[];
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  product: { id: string; name: string; sku: string; unit: string };
  warehouseId: string;
  warehouse: { id: string; name: string; code: string };
  type: 'STOCK_IN' | 'STOCK_OUT' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  referenceNumber?: string;
  destination?: string;
  notes?: string;
  supplier?: { id: string; companyName: string };
  createdBy?: { id: string; name: string };
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  gstNumber?: string;
  contactPerson?: string;
  isActive: boolean;
  _count?: { purchaseOrders: number; products: number };
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  product: { id: string; name: string; sku: string; unit: string; costPrice?: number };
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier: { id: string; companyName: string; name: string; email: string };
  warehouseId: string;
  warehouse: { id: string; name: string; code: string };
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  expectedDate?: string;
  receivedDate?: string;
  items: PurchaseOrderItem[];
  createdAt: string;
}

export interface DashboardStats {
  kpis: {
    totalProducts: number;
    totalStockUnits: number;
    totalInventoryValue: number;
    lowStockCount: number;
    totalWarehouses: number;
    totalSuppliers: number;
    pendingPurchaseOrders: number;
  };
  monthlyMovementChart: { month: string; stockIn: number; stockOut: number }[];
  categoryDistribution: { name: string; value: number }[];
  warehouseDistribution: { name: string; units: number }[];
  lowStockItems: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    minStockLevel: number;
    category: string;
    status: string;
  }[];
  recentMovements: StockMovement[];
  recentPurchaseOrders: PurchaseOrder[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'PENDING_PO' | 'ORDER_RECEIVED' | 'SYSTEM';
  isRead: boolean;
  link?: string;
  createdAt: string;
}
