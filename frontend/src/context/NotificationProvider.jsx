import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const socket = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!socket || !user) return;

    // Register user for notifications
    socket.emit('registerUser', user.id);

    // Listen for booking notifications
    const handleNotification = (data) => {
      setNotifications(prev => [data, ...prev]);
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: '/favicon.ico'
        });
      }
    };

    socket.on('bookingNotification', handleNotification);

    return () => {
      socket.off('bookingNotification', handleNotification);
    };
  }, [socket, user]);

  const clearNotifications = useCallback(() => setNotifications([]), []);
  const removeNotification = useCallback((index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, clearNotifications, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}
