import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

export const Topbar: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/inventory?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Generate breadcrumb
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentTitle = pathSegments.length > 0
    ? pathSegments[0].replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    : 'Dashboard';

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 transition-all duration-300 ${
        isCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link to="/dashboard" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-semibold text-slate-800 dark:text-slate-100">{currentTitle}</span>
      </div>

      {/* Global Search Bar */}
      <form onSubmit={handleSearch} className="relative hidden md:flex items-center w-80 lg:w-96">
        <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Global search SKU, product, barcode... (Enter)"
          className="w-full pl-9 pr-12 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
        />
        <kbd className="absolute right-3 text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono">
          ↵
        </kbd>
      </form>

      {/* Right Action Icons */}
      <div className="flex items-center gap-3">
        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-950/10 dark:shadow-slate-950/40 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                  Notifications ({unreadCount} new)
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-slate-400">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex gap-3 ${
                        !n.isRead ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'OUT_OF_STOCK' || n.type === 'LOW_STOCK' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        ) : n.type === 'ORDER_RECEIVED' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-brand-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{n.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
                >
                  View all notification history <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {user?.name?.slice(0, 2).toUpperCase() || 'WM'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                {user?.name}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                {user?.role?.toLowerCase().replace('_', ' ')}
              </span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-950/10 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <Link
                to="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="block px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
              >
                Profile & Settings
              </Link>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full text-left px-3.5 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
