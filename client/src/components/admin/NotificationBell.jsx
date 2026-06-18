import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Bell, X, CheckCheck, ExternalLink, AlertTriangle, Info, AlertCircle, Zap } from 'lucide-react';
import { useAdminNotifications } from '../../context/AdminNotificationContext';

const SEVERITY_CONFIG = {
  info:     { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-l-blue-400' },
  warning:  { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-l-amber-400' },
  critical: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-l-red-500' },
  system:   { icon: Zap, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-l-purple-400' },
};

function formatRelative(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotificationItem({ notif, onMarkRead, onDismiss }) {
  const navigate = useNavigate();
  const cfg = SEVERITY_CONFIG[notif.severity] || SEVERITY_CONFIG.info;
  const Icon = cfg.icon;

  const handleClick = () => {
    if (!notif.isRead) onMarkRead(notif._id);
    if (notif.actionUrl) navigate(notif.actionUrl);
  };

  return (
    <div className={cn(
      'group flex gap-3 px-4 py-3 border-b border-border cursor-pointer transition-colors border-l-[3px]',
      cfg.border,
      notif.isRead ? 'opacity-70 hover:opacity-100' : cfg.bg,
      'hover:bg-muted/40'
    )} onClick={handleClick}>
      <div className={cn('h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5', cfg.bg)}>
        <Icon className={cn('h-4 w-4', cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm font-medium leading-snug', notif.isRead ? 'text-muted-foreground' : 'text-foreground')}>
            {notif.title}
          </p>
          <button
            onClick={e => { e.stopPropagation(); onDismiss(notif._id); }}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity shrink-0 p-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {notif.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-muted-foreground">{formatRelative(notif.createdAt)}</span>
          {notif.actionUrl && (
            <span className="text-[10px] text-primary flex items-center gap-0.5">
              View <ExternalLink className="h-2.5 w-2.5" />
            </span>
          )}
          {!notif.isRead && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary ml-auto" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationBell() {
  const { notifications, unreadCount, loading, markRead, markAllRead, dismiss } = useAdminNotifications();
  const [open, setOpen] = useState(false);
  const trayRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (trayRef.current && !trayRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={trayRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className={cn(
            'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1',
            'rounded-full bg-red-500 text-white text-[10px] font-bold',
            'flex items-center justify-center',
            'animate-pulse'
          )}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Tray */}
      {open && (
        <div className={cn(
          'absolute right-0 top-full mt-2 w-[380px] z-50',
          'bg-background border border-border rounded-2xl shadow-2xl',
          'flex flex-col overflow-hidden',
          'animate-in slide-in-from-top-2 duration-200'
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/70 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </div>

          {/* List */}
          <div className="max-h-[440px] overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground">No notifications right now</p>
              </div>
            ) : (
              notifications.map(n => (
                <NotificationItem
                  key={n._id}
                  notif={n}
                  onMarkRead={markRead}
                  onDismiss={dismiss}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border bg-muted/30">
            <button
              className="text-xs text-primary hover:text-primary/70 transition-colors"
              onClick={() => { setOpen(false); }}
            >
              Notification preferences →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
