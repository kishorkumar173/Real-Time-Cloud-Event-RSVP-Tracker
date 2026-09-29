import React, { useState } from "react";
import { api } from "../api";

export default function AnnouncementFeed({ eventId, announcements, isOrganizer, onAnnouncementCreated }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !message) return;
    setLoading(true);
    try {
      await api.createAnnouncement(eventId, { title, message });
      setTitle("");
      setMessage("");
      if (onAnnouncementCreated) onAnnouncementCreated();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: "1.5rem" }}>
      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.75rem" }}>Broadcast Announcements</h3>
      {isOrganizer && (
        <form onSubmit={handleSubmit} style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required style={{ marginBottom: "0.5rem" }} />
          <textarea className="form-control" rows="2" value={message} onChange={e => setMessage(e.target.value)} placeholder="Broadcast message..." required style={{ marginBottom: "0.5rem" }} />
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ fontSize: "0.8rem" }}>📢 Broadcast</button>
        </form>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {announcements.length === 0 ? <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No announcements yet</p> : (
          announcements.map(a => (
            <div key={a.announcement_id} style={{ padding: "0.75rem", background: "#f8fafc", borderLeft: "3px solid var(--primary)", borderRadius: "6px" }}>
              <strong style={{ fontSize: "0.85rem" }}>{a.title}</strong>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>{a.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
