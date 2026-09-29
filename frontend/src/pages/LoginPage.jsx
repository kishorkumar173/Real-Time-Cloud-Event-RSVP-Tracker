import React, { useState } from 'react';
import { api, authStorage } from '../api';

export default function LoginPage({ onLoginSuccess }) {
  // activeTab: 'signin' or 'register'
  const [activeTab, setActiveTab] = useState('signin');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('ATTENDEE'); // 'ATTENDEE' or 'ORGANIZER'

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const data = await api.login({
        email: email.trim().toLowerCase(),
        password: password
      });
      authStorage.setToken(data.access_token);
      authStorage.setUser(data);
      onLoginSuccess(data);
    } catch (err) {
      const msg = err.message || 'Incorrect email or password';
      if (msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('not found')) {
        setErrorMsg('Account not found or password incorrect. If you are new, click "Register" above to create an account!');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      setLoading(false);
      return;
    }

    try {
      // 1. Create account in database
      await api.register({
        email: email.trim().toLowerCase(),
        password: password,
        full_name: fullName.trim(),
        role: role
      });

      // 2. Automatically log in with new account
      const data = await api.login({
        email: email.trim().toLowerCase(),
        password: password
      });

      authStorage.setToken(data.access_token);
      authStorage.setUser(data);
      setSuccessMsg(`Account created successfully! Welcome, ${fullName}.`);
      
      setTimeout(() => {
        onLoginSuccess(data);
      }, 400);
    } catch (err) {
      const msg = err.message || 'Registration failed';
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('registered')) {
        setErrorMsg(`An account with "${email}" already exists. If this is you, please click the "Sign In" tab above to log in!`);
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="container" style={{ maxWidth: '460px', marginTop: '3.5rem', marginBottom: '3.5rem' }}>
      <div className="card" style={{ padding: '2.25rem', boxShadow: '0 12px 30px -5px rgba(0,0,0,0.1)' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.35rem' }}>☁️</div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
            CloudRSVP Tracker
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Real-Time Cloud Event Planning & Attendance Platform
          </p>
        </div>

        {/* Top Segmented Tabs: Sign In vs Register */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.35rem',
          background: '#f1f5f9',
          padding: '0.3rem',
          borderRadius: '10px',
          marginBottom: '1.75rem'
        }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            style={{
              padding: '0.65rem 0.5rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'signin' ? 'white' : 'transparent',
              color: activeTab === 'signin' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'signin' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            🔑 Sign In
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            style={{
              padding: '0.65rem 0.5rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'register' ? 'white' : 'transparent',
              color: activeTab === 'register' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'register' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            📝 Register / Sign Up
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div style={{
            marginBottom: '1.25rem',
            padding: '0.75rem 0.9rem',
            background: '#fee2e2',
            color: '#991b1b',
            borderRadius: '8px',
            fontSize: '0.85rem',
            lineHeight: 1.4,
            borderLeft: '4px solid #ef4444'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{
            marginBottom: '1.25rem',
            padding: '0.75rem 0.9rem',
            background: '#dcfce7',
            color: '#166534',
            borderRadius: '8px',
            fontSize: '0.85rem',
            lineHeight: 1.4,
            borderLeft: '4px solid #22c55e'
          }}>
            ✅ {successMsg}
          </div>
        )}

        {/* TAB 1: SIGN IN FORM */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn}>
            <div className="form-group" style={{ marginBottom: '1.1rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Password
              </label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Don't have an account?{' '}
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMsg(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Register here
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: REGISTER FORM WITH EXPLICIT ROLE SELECTOR BEFORE LOGIN */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister}>
            {/* Role Selector Cards */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                Choose Your Account Type:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                
                {/* Participant Card */}
                <div
                  onClick={() => setRole('ATTENDEE')}
                  style={{
                    border: role === 'ATTENDEE' ? '2px solid var(--primary)' : '1px solid #cbd5e1',
                    background: role === 'ATTENDEE' ? '#eff6ff' : '#ffffff',
                    padding: '0.85rem 0.6rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                    boxShadow: role === 'ATTENDEE' ? '0 2px 6px rgba(37,99,235,0.15)' : 'none'
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🎓</div>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: role === 'ATTENDEE' ? 'var(--primary)' : 'var(--text-main)'
                  }}>
                    Participant
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.3 }}>
                    RSVP to events, join waitlist & attend
                  </div>
                </div>

                {/* Organizer Card */}
                <div
                  onClick={() => setRole('ORGANIZER')}
                  style={{
                    border: role === 'ORGANIZER' ? '2px solid var(--primary)' : '1px solid #cbd5e1',
                    background: role === 'ORGANIZER' ? '#eff6ff' : '#ffffff',
                    padding: '0.85rem 0.6rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                    boxShadow: role === 'ORGANIZER' ? '0 2px 6px rgba(37,99,235,0.15)' : 'none'
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>👑</div>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: role === 'ORGANIZER' ? 'var(--primary)' : 'var(--text-main)'
                  }}>
                    Event Organizer
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.3 }}>
                    Host events, track live roster & broadcast
                  </div>
                </div>

              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.1rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Full Name
              </label>
              <input
                type="text"
                className="form-control"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Alex Johnson"
                required
                style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.1rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Password (minimum 6 characters)
              </label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength="6"
                required
                style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: role === 'ORGANIZER' ? '#2563eb' : '#059669'
              }}
            >
              {loading ? 'Registering...' : `Register as ${role === 'ORGANIZER' ? 'Event Organizer' : 'Participant'}`}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Already have an account?{' '}
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setErrorMsg(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Sign In here
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
