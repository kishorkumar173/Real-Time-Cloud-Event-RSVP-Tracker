import React from 'react';
import NotificationBell from './NotificationBell';

export default function Navbar({ user, onSwitchUser, onLogout, activeTab, setActiveTab }) {
  const quickProfiles = [
    { label: 'Organizer (Prof. Sarah)', email: 'organizer@cloud.edu', role: 'ORGANIZER' },
    { label: 'Attendee A (Alice)', email: 'alice@cloud.edu', role: 'ATTENDEE' },
    { label: 'Attendee B (Bob)', email: 'bob@cloud.edu', role: 'ATTENDEE' },
    { label: 'Attendee C (Carol)', email: 'carol@cloud.edu', role: 'ATTENDEE' },
  ];

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <a href="#" className="nav-brand" onClick={(e) => { e.preventDefault(); setActiveTab('events'); }}>
          <span>☁️ CloudRSVP</span>
        </a>

        {user && (
          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn ${activeTab === 'events' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              onClick={() => setActiveTab('events')}
            >
              Explore Events
            </button>
            {user.role === 'ORGANIZER' && (
              <button
                className={`btn ${activeTab === 'organizer' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => setActiveTab('organizer')}
              >
                Organizer Studio
              </button>
            )}
            <button
              className={`btn ${activeTab === 'my-rsvps' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              onClick={() => setActiveTab('my-rsvps')}
            >
              My RSVPs
            </button>
          </nav>
        )}
      </div>

      <div className="nav-actions">
        {user ? (
          <>
            {/* Quick switcher for easy interview demo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Demo Switch:</span>
              <select 
                style={{ border: 'none', background: 'transparent', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                value={user.email}
                onChange={(e) => {
                  const selected = quickProfiles.find(p => p.email === e.target.value);
                  if (selected) onSwitchUser(selected.email);
                }}
              >
                {quickProfiles.map(p => (
                  <option key={p.email} value={p.email}>{p.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.full_name}</span>
              <span className={`badge ${user.role === 'ORGANIZER' ? 'badge-organizer' : 'badge-attendee'}`}>
                {user.role}
              </span>
            </div>

            <NotificationBell />

            <button 
              className="btn btn-outline" 
              onClick={onLogout}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            >
              Logout
            </button>
          </>
        ) : (
          <button 
            className="btn btn-primary" 
            onClick={() => setActiveTab('login')}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
