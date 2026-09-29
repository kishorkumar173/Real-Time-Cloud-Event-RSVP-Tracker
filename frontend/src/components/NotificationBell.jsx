import React, { useState, useEffect } from "react";
import { api } from "../api";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data || []);
    } catch (err) {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ position: "relative" }}>
      <button className="btn btn-outline" onClick={() => setOpen(!open)} style={{ padding: "0.45rem 0.75rem", position: "relative" }}>
        🔔
        {unreadCount > 0 && (
          <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "#ef4444", color: "white", borderRadius: "9999px", fontSize: "0.65rem", padding: "2px 6px", fontWeight: "bold" }}>
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", right: 0, top: "110%", width: "300px", background: "white", border: "1px solid var(--border)", borderRadius: "var(--radius)", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 100, padding: "1rem" }}>
          <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem" }}>Notifications</h4>
          <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {notifications.length === 0 ? (
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center" }}>No notifications</p>
            ) : (
              notifications.map(n => (
                <div key={n.notification_id} style={{ padding: "0.5rem", borderRadius: "6px", background: n.read ? "#f8fafc" : "#eff6ff", fontSize: "0.8rem" }}>
                  <p style={{ margin: 0 }}>{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
