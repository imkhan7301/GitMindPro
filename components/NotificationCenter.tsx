import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { Bell, X, Check, MessageSquare, GitPullRequest, UserPlus, Star, Clock, CheckCircle2,  ExternalLink } from 'lucide-react';

export interface AppNotification {
  id: string;
  type: 'consultation_request' | 'consultation_received' | 'referral_redeemed' | 'analysis_complete' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

interface NotificationCenterProps {
  authUser: User | null;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
}

const ICON_MAP: Record<AppNotification['type'], React.ElementType> = {
  consultation_request: MessageSquare,
  consultation_received: Check,
  referral_redeemed: UserPlus,
  analysis_complete: GitPullRequest,
  system: Star,
};

const COLOR_MAP: Record<AppNotification['type'], string> = {
  consultation_request: 'bg-indigo-500/15 text-indigo-400',
  consultation_received: 'bg-emerald-500/15 text-emerald-400',
  referral_redeemed: 'bg-violet-500/15 text-violet-400',
  analysis_complete: 'bg-amber-500/15 text-amber-400',
  system: 'bg-slate-500/15 text-slate-400',
};

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const NotificationCenter: React.FC<NotificationCenterProps> = ({ authUser, notifications, onMarkRead, onMarkAllRead, onDismiss }) => {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Close on outside click
  const handleBackdrop = useCallback(() => setOpen(false), []);

  if (!authUser) return null;

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-slate-800 transition-colors"
        title="Notifications"
      >
        <Bell className="w-4.5 h-4.5 text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-[180]" onClick={handleBackdrop} />
          <div className="absolute right-0 top-full mt-2 w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-[190] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest"
                  >
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-slate-600 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[60vh] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-600 text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => {
                  const Icon = ICON_MAP[n.type] || Star;
                  const colorClass = COLOR_MAP[n.type] || COLOR_MAP.system;
                  return (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors flex items-start gap-3 group ${!n.read ? 'bg-indigo-950/10' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-bold truncate ${n.read ? 'text-slate-400' : 'text-white'}`}>{n.title}</p>
                          <span className="text-[9px] text-slate-600 flex-shrink-0 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> {timeAgo(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        {n.actionUrl && (
                          <a href={n.actionUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-400 hover:text-indigo-300 mt-1 inline-flex items-center gap-1">
                            View <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.read && (
                          <button onClick={() => onMarkRead(n.id)} className="p-1 hover:bg-slate-700 rounded" title="Mark read">
                            <CheckCircle2 className="w-3 h-3 text-slate-500" />
                          </button>
                        )}
                        <button onClick={() => onDismiss(n.id)} className="p-1 hover:bg-slate-700 rounded" title="Dismiss">
                          <X className="w-3 h-3 text-slate-500" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
