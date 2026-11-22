import React from 'react';
import { Settings as SettingsIcon, User, Database, Shield, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-brand-500" />
          Settings & Profile
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          User profile preferences, interface themes, and database connectivity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center font-bold text-white text-base shadow-md">
              {user?.name.slice(0, 2).toUpperCase() || 'WM'}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{user?.name}</h2>
              <span className="text-xs text-slate-400">{user?.email}</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/60">
              <span className="text-slate-500">Access Role:</span>
              <span className="font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wide">
                {user?.role}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/60">
              <span className="text-slate-500">Assigned Facility:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {user?.warehouseName || 'Global Access'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Contact Phone:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.phone || 'Not set'}</span>
            </div>
          </div>
        </div>

        {/* Display & Theme */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              Interface Customization
            </h2>
            <p className="text-xs text-slate-400 mb-4">Toggle between clean light mode and dark slate theme.</p>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-brand-400" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    Current Theme: {theme === 'dark' ? 'Dark Navy/Slate' : 'Clean Light'}
                  </span>
                  <span className="text-[11px] text-slate-400">Synchronized with local preferences</span>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all"
              >
                Switch
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <Database className="w-4 h-4 shrink-0" />
            <span>Database Backend: PostgreSQL + Prisma ORM (Port 5432)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
