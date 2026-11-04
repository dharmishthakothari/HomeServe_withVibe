import React from 'react';
import { X, Bell, Check, Clock, Sparkles } from 'lucide-react';

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onSelectBooking
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm glass-panel bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-teal-400" />
              <h3 className="font-bold text-white text-sm">Notifications</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onMarkAllRead}
                className="text-[11px] text-teal-400 hover:text-teal-300 font-medium"
              >
                Mark all read
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border text-xs transition ${
                    n.is_read
                      ? 'border-slate-800/80 bg-slate-950/40 text-slate-400'
                      : 'border-teal-500/40 bg-teal-950/20 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200">{n.title}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
