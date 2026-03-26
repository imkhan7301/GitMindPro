import { useState, useCallback, useEffect } from 'react';
import type { AppNotification } from '../components/NotificationCenter';

const STORAGE_KEY = 'gitmind.notifications';
const MAX_NOTIFICATIONS = 50;

function loadNotifications(): AppNotification[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function persist(notifications: AppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>(loadNotifications);

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setNotifications(loadNotifications());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
    setNotifications(prev => {
      const next = [
        { ...n, id: crypto.randomUUID(), read: false, createdAt: new Date().toISOString() },
        ...prev,
      ].slice(0, MAX_NOTIFICATIONS);
      persist(next);
      return next;
    });
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      persist(next);
      return next;
    });
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      persist(next);
      return next;
    });
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const next = prev.filter(n => n.id !== id);
      persist(next);
      return next;
    });
  }, []);

  return {
    notifications,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
  };
}
