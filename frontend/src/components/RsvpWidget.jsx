import React, { useState } from 'react';
import { api } from '../api';

export default function RsvpWidget({ eventId, currentStatus, onRsvpUpdated, disabled }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSelect = async (status) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await api.submitRSVP(eventId, status);
      setSuccessMsg(`Your RSVP has been recorded: ${status}`);
      if (onRsvpUpdated) onRsvpUpdated();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel your RSVP?")) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await api.cancelRSVP(eventId);
      setSuccessMsg("Your RSVP has been cancelled.");
      if (onRsvpUpdated) onRsvpUpdated();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          YOUR RSVP STATUS:
        </span>
        {currentStatus && currentStatus !== 'NONE' && (
          <button 
            onClick={handleCancel}
            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.7rem', cursor: 'pointer' }}
          >
            Cancel RSVP
          </button>
        )}
      </div>

      <div className="rsvp-group">
        <button
          disabled={disabled || loading}
          onClick={() => handleSelect('GOING')}
          className={`rsvp-btn ${currentStatus === 'GOING' ? 'active-going' : ''}`}
        >
          ✅ Going
        </button>

        <button
          disabled={disabled || loading}
          onClick={() => handleSelect('MAYBE')}
          className={`rsvp-btn ${currentStatus === 'MAYBE' ? 'active-maybe' : ''}`}
        >
          🤔 Maybe
        </button>

        <button
          disabled={disabled || loading}
          onClick={() => handleSelect('NOT_GOING')}
          className={`rsvp-btn ${currentStatus === 'NOT_GOING' ? 'active-not-going' : ''}`}
        >
          ❌ Not Going
        </button>
      </div>

      {successMsg && (
        <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.6rem', background: '#dcfce7', color: '#166534', borderRadius: '6px', fontSize: '0.75rem' }}>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.6rem', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '0.75rem' }}>
          ⚠️ {errorMsg}
        </div>
      )}
    </div>
  );
}
