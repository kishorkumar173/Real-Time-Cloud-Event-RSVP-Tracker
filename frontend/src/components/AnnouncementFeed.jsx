import React, { useState } from 'react';
import { api } from '../api';

export default function AnnouncementFeed({ eventId, announcements, isOrganizer, onAnnouncementCreated }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !message) return;
    setLoading(true);
    try {
      await api.createAnnouncement(eventId, { title, message });
      setTitle('');
      setMessage('');
      setShowForm(false);
      if (onAnnouncementCreated) onAnnouncementCreated();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Event Broadcasts & Announcements</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-time updates delivered to all attendees</p>
        </div>
        {isOrganizer && (
          <button 
            className="btn btn-outline" 
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ New Broadcast'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--border)' }}>
          <div className="form-group">
            <label>Broadcast Title</label>
            <input 
              type="text" 
              className="form-control" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g., Room Location Update / Presentation Link" 
              required 
            />
          </div>
          <div className="form-group">
            <label>Message Content</label>
            <textarea 
              className="form-control" 
              rows="3" 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              placeholder="Type message to broadcast to all RSVPs..." 
              required 
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
            {loading ? 'Broadcasting...' : '📢 Broadcast to Cloud'}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {announcements.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>
            No announcements broadcasted yet.
          </p>
        ) : (
          announcements.map((a) => (
            <div key={a.announcement_id} style={{ padding: '0.85rem', background: '#f8fafc', borderLeft: '4px solid var(--primary)', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{a.title}</h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {a.created_at ? new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>{a.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
