import React from 'react';
import { Bell, CheckCircle2, AlertTriangle, Clock, CheckCheck } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export const Notifications: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-500" />
            System Notifications & Alerts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated alerts for threshold breaches, order changes, and warehouse notifications.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <CheckCheck className="w-4 h-4" /> Mark All as Read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No system notifications at this time. All warehouse events are clear.
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => markAsRead(item.id)}
              className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex items-start gap-3.5 ${
                !item.isRead ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
              }`}
            >
              <div className="mt-1 shrink-0">
                {item.type === 'OUT_OF_STOCK' || item.type === 'LOW_STOCK' ? (
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                ) : item.type === 'ORDER_RECEIVED' ? (
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
                    <Clock className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{item.message}</p>
              </div>

              {!item.isRead && (
                <span className="w-2 h-2 rounded-full bg-brand-500 mt-2 shrink-0" title="Unread" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
