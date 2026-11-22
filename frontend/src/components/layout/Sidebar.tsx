import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  Warehouse,
  Truck,
  ClipboardList,
  BarChart3,
  Users,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Inventory', path: '/inventory', icon: Boxes },
    { name: 'Stock Movements', path: '/movements', icon: ArrowLeftRight },
    { name: 'Warehouses', path: '/warehouses', icon: Warehouse },
    { name: 'Suppliers', path: '/suppliers', icon: Truck },
    { name: 'Purchase Orders', path: '/purchase-orders', icon: ClipboardList },
    { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
    ...(hasRole(['ADMIN', 'WAREHOUSE_MANAGER'])
      ? [{ name: 'User Management', path: '/users', icon: Users }]
      : []),
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-brand-400 text-white shadow-md shadow-brand-500/20 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                Logix<span className="text-brand-400 font-extrabold">WMS</span>
                <span className="text-[10px] font-semibold bg-brand-500/20 text-brand-300 px-1.5 py-0.5 rounded border border-brand-500/30">
                  PRO
                </span>
              </span>
              <span className="text-xs text-slate-400">Enterprise Warehouse</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`
              }
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-2 rounded-xl bg-slate-800/50`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-xs text-brand-300 shrink-0">
                {user?.name?.slice(0, 2).toUpperCase() || 'WM'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</span>
                <span className="text-[10px] text-brand-400 truncate tracking-wide uppercase font-medium">
                  {user?.role?.replace('_', ' ') || 'STAFF'}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
