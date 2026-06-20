// src/context/socket.provider.jsx
import { useState, useEffect } from 'react';
import { SocketContext } from './socket.context';
import { io } from 'socket.io-client';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

  useEffect(() => {
    const socketInstance = io(socketUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setSocket(socketInstance);
    });
    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    return () => {
      if (socketInstance) socketInstance.disconnect();
    };
  }, [socketUrl]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};