# LogixWMS — Enterprise Warehouse Management System

A production-quality, commercial-grade Warehouse Management System (WMS) built with React, TypeScript, Tailwind CSS, Node.js/Express, PostgreSQL, and Prisma ORM.

---

## 🌟 Key Features & Modules

1. **Executive Dashboard**:
   - 7 Real-time KPI Cards (Total Products, Units, Valuation, Low Stock, Warehouses, Suppliers, Pending POs).
   - Recharts Analytics (Monthly Stock In vs Out Bar Chart, Product Category Proportion Pie Chart).
   - Quick action dispatchers & live low-stock watchlists.

2. **Inventory & SKU Management**:
   - Complete product catalog with unique SKU and Barcode indexing.
   - Live multi-warehouse inventory breakdown.
   - Status indicators (`In Stock`, `Low Stock`, `Out of Stock`) and safety threshold triggers.
   - Search, filter by category and status, pagination, and details modal.

3. **Stock Movement Engine (Zero Negative Stock)**:
   - Full transactional inbound (Stock In) and outbound fulfillment (Stock Out).
   - Atomic database transactions (`prisma.$transaction`) guaranteeing zero inconsistent or negative inventory.
   - Immutable audit logging and automated stock threshold alerts.

4. **Multi-Warehouse & Storage Bin Tracking**:
   - Multi-facility management with live capacity utilization bars (`%` filled).
   - Granular hierarchical location tags: Zone, Aisle, Rack, Shelf, Bin (e.g. `CDC-A01-R04-S02-B01`).

5. **Vendor & Supplier Directory**:
   - Supplier profiles with tax identifiers (GST/VAT), contact persons, email, phone, and linked order histories.

6. **Purchase Order Lifecycle**:
   - Multi-item line orders with automatic subtotal, customizable tax rates (18%), and grand total calculations.
   - Status lifecycle: `Draft` ➔ `Pending` ➔ `Approved` ➔ `Ordered` ➔ `Partially Received` ➔ `Received` ➔ `Cancelled`.
   - Partial or complete receiving with instant automatic warehouse inventory increments.
   - Printable Purchase Order invoices.

7. **Valuation & Analytics Reports**:
   - Real-time asset valuation reports by wholesale cost and retail potential.
   - One-click CSV report export.
   - Printable ledger summaries.

8. **Security & Role-Based Access Control (RBAC)**:
   - JWT authentication with secure password hashing via `bcryptjs`.
   - 4 Enforced Roles:
     - `ADMIN`: Unrestricted global system access.
     - `WAREHOUSE_MANAGER`: Warehouses, inventory, purchase orders, and supplier operations.
     - `INVENTORY_STAFF`: Products and stock movement execution.
     - `VIEWER`: Read-only reporting and tracking.

9. **Theme & UX**:
   - Clean enterprise SaaS aesthetic with Dark Navy/Slate sidebar, blue accents, smooth animations, and light/dark mode switcher.

---

## 🏗️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, React Router v6 |
| **Backend** | Node.js, Express.js, TypeScript, Zod Schema Validation, JWT, bcryptjs |
| **Database** | PostgreSQL, Prisma ORM |

---

## 🚀 Quick Start Guide

### 1. Configure PostgreSQL Database

Ensure PostgreSQL is running locally on port `5432`.
Edit [backend/.env](file:///C:/warehouse-mgmt/backend/.env) with your credentials:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/warehouse_db?schema=public"
JWT_SECRET="wms_enterprise_secure_jwt_secret_key_2026"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
```

### 2. Install Backend Dependencies & Run Database Migrations

```powershell
cd C:\warehouse-mgmt\backend
npm.cmd install
npx.cmd prisma db push
npx.cmd tsx prisma/seed.ts
```

### 3. Install Frontend Dependencies

```powershell
cd C:\warehouse-mgmt\frontend
npm.cmd install
```

### 4. Run Development Servers

**Backend API Server (Port 5000):**
```powershell
cd C:\warehouse-mgmt\backend
npm.cmd run dev
```

**Frontend Application (Port 5173):**
```powershell
cd C:\warehouse-mgmt\frontend
npm.cmd run dev
```

Visit **http://localhost:5173** in your web browser.

---

## 👥 Demo Credentials

The database seed script populates demo accounts for all 4 roles:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@warehouse.com` | `admin123` |
| **Warehouse Manager** | `manager@warehouse.com` | `manager123` |
| **Inventory Staff** | `staff@warehouse.com` | `staff123` |
| **Viewer (Read Only)** | `viewer@warehouse.com` | `viewer123` |

*(You can also use the one-click demo login buttons directly on the Login page)*
