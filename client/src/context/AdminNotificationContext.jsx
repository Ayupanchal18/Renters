import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authenticatedFetch, getHeaders } from '../lib/api';

const AdminNotificationContext = createContext(null);

export function AdminNotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Note: passing null for navigate — authenticatedFetch falls back to
  // window.location.href on 401/403, which is safe for a background provider.
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch(
        '/api/admin/notification-center?page=1&limit=20',
        { headers: getHeaders() },
        null
      );
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unreadCount ?? 0);
      }
    } catch (e) {
      // Silently fail — notification center is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 60 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markRead = useCallback(async (id) => {
    try {
      await authenticatedFetch(
        `/api/admin/notification-center/${id}/read`,
        { method: 'PATCH', headers: getHeaders() },
        null
      );
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) { /* ignore */ }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await authenticatedFetch(
        '/api/admin/notification-center/read-all',
        { method: 'PATCH', headers: getHeaders() },
        null
      );
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) { /* ignore */ }
  }, []);

  const dismiss = useCallback(async (id) => {
    try {
      await authenticatedFetch(
        `/api/admin/notification-center/${id}`,
        { method: 'DELETE', headers: getHeaders() },
        null
      );
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (e) { /* ignore */ }
  }, []);

  return (
    <AdminNotificationContext.Provider value={{
      notifications, unreadCount, loading,
      fetchNotifications, markRead, markAllRead, dismiss
    }}>
      {children}
    </AdminNotificationContext.Provider>
  );
}

export function useAdminNotifications() {
  const ctx = useContext(AdminNotificationContext);
  if (!ctx) throw new Error('useAdminNotifications must be used inside AdminNotificationProvider');
  return ctx;
}

