import React from 'react';

export default function AnalyticsPanel({ analytics, wsStatus }) {
  if (!analytics) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading real-time event analytics...</p>
      </div>
    );
  }

  const {
    event_name,
    maximum_capacity,
    current_going,
    going_count,
    maybe_count,
    not_going_count,
    total_responses,
    waitlist_count,
    available_seats,
    response_rate,
    capacity_utilization,
    is_full
  } = analytics;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Real-Time Cloud Analytics</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{event_name}</p>
        </div>

        <div className="live-indicator">
          <span className="pulse-dot" style={{ background: wsStatus === 'CONNECTED' ? '#10b981' : '#f59e0b' }}></span>
          <span>{wsStatus === 'CONNECTED' ? 'LIVE SYNC' : 'CONNECTING...'}</span>
        </div>
      </div>

      <div className="grid-stats">
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <span className="stat-label">Going</span>
          <span className="stat-value" style={{ color: '#10b981' }}>{going_count}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Confirmed seats</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <span className="stat-label">Maybe</span>
          <span className="stat-value" style={{ color: '#f59e0b' }}>{maybe_count}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Potential attendees</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <span className="stat-label">Not Going</span>
          <span className="stat-value" style={{ color: '#ef4444' }}>{not_going_count}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Declined</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <span className="stat-label">Waitlist</span>
          <span className="stat-value" style={{ color: '#8b5cf6' }}>{waitlist_count}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>In queue</span>
        </div>
      </div>

      {/* KPI Overview */}
      <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Capacity</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{maximum_capacity} seats</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Available Seats</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: available_seats === 0 ? '#ef4444' : 'inherit' }}>
              {available_seats}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Utilization</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{capacity_utilization}%</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Responses</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{total_responses}</div>
          </div>
        </div>

        <div style={{ marginTop: '0.85rem' }}>
          <div className="progress-bar" style={{ height: '10px' }}>
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(100, capacity_utilization)}%`,
                background: is_full ? 'var(--danger)' : 'var(--primary)'
              }}
            />
          </div>
          {is_full && (
            <p style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600, marginTop: '0.35rem', textAlign: 'center' }}>
              ⚠️ MAXIMUM CAPACITY REACHED — Additional "Going" RSVPs will enter the priority waitlist.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
