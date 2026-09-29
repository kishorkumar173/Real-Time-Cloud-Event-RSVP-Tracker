import React, { useState } from 'react';
import { api, authStorage } from '../api';

export default function LoginPage({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('ATTENDEE');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const demoAccounts = [
    { roleLabel: 'Organizer', name: 'Prof. Sarah Jenkins', email: 'organizer@cloud.edu', pass: 'Cloud2026!' },
    { roleLabel: 'Attendee A', name: 'Alice Walker', email: 'alice@cloud.edu', pass: 'Cloud2026!' },
    { roleLabel: 'Attendee B', name: 'Bob Miller', email: 'bob@cloud.edu', pass: 'Cloud2026!' },
    { roleLabel: 'Attendee C', name: 'Carol Davis', email: 'carol@cloud.edu', pass: 'Cloud2026!' },
  ];

  const handleDemoClick = async (demoEmail, demoPass) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.login({ email: demoEmail, password: demoPass });
      authStorage.setToken(data.access_token);
      authStorage.setUser(data);
      onLoginSuccess(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      if (isRegister) {
        await api.register({
          email,
          password,
          full_name: fullName,
          role
        });
      }
      const data = await api.login({ email, password });
      authStorage.setToken(data.access_token);
      authStorage.setUser(data);
      onLoginSuccess(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '440px', marginTop: '4rem' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
            ☁️ CloudRSVP
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            {isRegister ? 'Create an account to RSVP' : 'Sign in to manage and RSVP to events'}
          </p>
        </div>

        {errorMsg && (
          <div style={{ marginBottom: '1rem', padding: '0.6rem', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '0.8rem' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="form-group">
                <label>Account Role</label>
                <select
                  className="form-control"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="ATTENDEE">Attendee (RSVP & Discover)</option>
                  <option value="ORGANIZER">Organizer (Host & Manage)</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@cloud.edu"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
          >
            {loading ? 'Authenticating...' : isRegister ? 'Register & Sign In' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register here"}
          </button>
        </div>

        {/* 1-Click Synthetic Demo Profiles */}
        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.75rem' }}>
            ⚡ 1-CLICK DEMO LOGIN (SYNTHETIC PROFILES)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {demoAccounts.map(demo => (
              <button
                key={demo.email}
                type="button"
                onClick={() => handleDemoClick(demo.email, demo.pass)}
                className="btn btn-outline"
                style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem', flexDirection: 'column', gap: '2px' }}
              >
                <span style={{ fontWeight: 700 }}>{demo.roleLabel}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{demo.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
