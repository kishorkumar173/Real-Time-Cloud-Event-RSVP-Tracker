import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data || []);
    } catch (err) {
      // silently ignore if not logged in
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkOne = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        className="btn btn-outline" 
        onClick={() => setOpen(!open)}
        style={{ padding: '0.45rem 0.75rem', position: 'relative', fontSize: '1rem' }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '9999px',
            fontSize: '0.65rem',
            padding: '2px 6px',
            fontWeight: 'bold'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '110%',
          width: '320px',
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Notifications</h4>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead} 
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notifications.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                No notifications yet
              </p>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.notification_id}
                  onClick={() => !n.read && handleMarkOne(n.notification_id)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    background: n.read ? '#f8fafc' : '#eff6ff',
                    borderLeft: n.read ? '3px solid transparent' : '3px solid var(--primary)',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  <p style={{ margin: 0, color: 'var(--text-main)' }}>{n.message}</p>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
