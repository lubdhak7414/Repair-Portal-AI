import { useNotifications } from '../context/NotificationProvider';

export function NotificationToast() {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: '0.5rem'
    }}>
      {notifications.slice(0, 3).map((notif, i) => (
        <div key={i} style={{
          backgroundColor: '#1e3a5f', color: '#fff', padding: '1rem',
          borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxWidth: '350px', position: 'relative'
        }}>
          <button onClick={() => removeNotification(i)} style={{
            position: 'absolute', top: '4px', right: '8px',
            background: 'none', border: 'none', color: '#fff',
            cursor: 'pointer', fontSize: '1.2rem'
          }}>x</button>
          <strong style={{ display: 'block', marginBottom: '0.25rem' }}>{notif.title}</strong>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>{notif.message}</p>
          <span style={{ fontSize: '0.75rem', opacity: 0.7, display: 'block', marginTop: '0.25rem' }}>
            {new Date(notif.timestamp).toLocaleTimeString()}
          </span>
        </div>
      ))}
    </div>
  );
}
