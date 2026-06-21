// src/Layout.jsx
import React from 'react';
import './styles.css';
import { NotificationProvider } from './context/NotificationProvider';
import { NotificationToast } from './components/NotificationToast';

const Layout = ({ children }) => {
  return (
    <NotificationProvider>
      <div className="min-h-screen text-gray-100 font-sans antialiased flex flex-col justify-center p-4 relative overflow-hidden">
        {/* Global Background */}
        <div className="background" />
        {/* Overlay */}
        <div className="background-overlay" />

        <NotificationToast />
        {children}

      </div>
    </NotificationProvider>
  );
};

export default Layout;
