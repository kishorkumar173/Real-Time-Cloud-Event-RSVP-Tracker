import React, { useState } from 'react';
import QRCode from 'qrcode';
import RsvpWidget from './RsvpWidget';

export default function EventCard({ event, userRsvp, onRsvpChanged }) {
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const generateQR = async () => {
    try {
      const inviteUrl = `${window.location.origin}/#event-${event.event_id}`;
      const url = await QRCode.toDataURL(inviteUrl, { width: 240, margin: 2 });
      setQrDataUrl(url);
      setQrModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const utilization = Math.min(100, Math.round((event.current_going / event.maximum_capacity) * 100));
  const isFull = event.current_going >= event.maximum_capacity;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <span className={`badge ${event.status === 'FULL' ? 'badge-full' : 'badge-published'}`}>
            {event.status}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {event.event_type}
          </span>
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
          {event.event_name}
        </h3>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', minHeight: '2.5rem' }}>
          {event.description || 'No description provided.'}
        </p>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
          <div>📅 <strong>Date:</strong> {event.event_date} ({event.start_time} - {event.end_time})</div>
          {event.venue && <div>📍 <strong>Venue:</strong> {event.venue}</div>}
          {event.online_link && <div>🔗 <strong>Meeting:</strong> <a href={event.online_link} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Join Stream</a></div>}
        </div>

        {/* Capacity Bar */}
        <div style={{ margin: '0.75rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>Capacity Utilization</span>
            <span>{event.current_going} / {event.maximum_capacity} seats ({utilization}%)</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${utilization}%`,
                background: isFull ? 'var(--danger)' : utilization > 80 ? 'var(--warning)' : 'var(--primary)'
              }} 
            />
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button 
            className="btn btn-outline" 
            style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem' }}
            onClick={generateQR}
          >
            📱 View Invite QR
          </button>
        </div>

        {/* Interactive RSVP Action */}
        <RsvpWidget
          eventId={event.event_id}
          currentStatus={userRsvp}
          onRsvpUpdated={onRsvpChanged}
          disabled={event.status === 'CANCELLED'}
        />
      </div>

      {/* QR Code Modal */}
      {qrModalOpen && (
        <div className="modal-overlay" onClick={() => setQrModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Unique Event Invite QR</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Scan to RSVP directly on your mobile device.
            </p>
            {qrDataUrl && <img src={qrDataUrl} alt="Event QR" style={{ borderRadius: '8px', border: '1px solid var(--border)' }} />}
            <div style={{ marginTop: '1.25rem' }}>
              <button className="btn btn-primary" onClick={() => setQrModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
