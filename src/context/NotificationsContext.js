import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    load();

    const sub = Notifications.addNotificationReceivedListener(notification => {
      const n = {
        id: String(Date.now() + Math.random()),
        title: notification.request.content.title || 'Notificação',
        body: notification.request.content.body || '',
        data: notification.request.content.data || {},
        receivedAt: Date.now(),
        read: false,
      };
      setNotifs(prev => {
        const updated = [n, ...prev].slice(0, 50);
        AsyncStorage.setItem('@eletrohub:notifications', JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    });

    return () => sub.remove();
  }, []);

  async function load() {
    try {
      const stored = await AsyncStorage.getItem('@eletrohub:notifications');
      if (stored) setNotifs(JSON.parse(stored));
    } catch (_) {}
  }

  function addNotification(title, body, data = {}) {
    const n = {
      id: String(Date.now() + Math.random()),
      title,
      body,
      data,
      receivedAt: Date.now(),
      read: false,
    };
    setNotifs(prev => {
      const updated = [n, ...prev].slice(0, 50);
      AsyncStorage.setItem('@eletrohub:notifications', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }

  function markAllRead() {
    setNotifs(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      AsyncStorage.setItem('@eletrohub:notifications', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }

  function clearAll() {
    setNotifs([]);
    AsyncStorage.removeItem('@eletrohub:notifications').catch(() => {});
  }

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifs, addNotification, markAllRead, clearAll, unreadCount }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
