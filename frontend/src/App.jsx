import React, { useState, useEffect } from 'react';
import { api, authStorage } from './api';
import Navbar from './components/Navbar';
import AttendeeDashboard from './pages/AttendeeDashboard';
import OrganizerView from './pages/OrganizerView';
import LoginPage from './pages/LoginPage';

export default function App() {
  const [user, setUser] = useState(authStorage.getUser());
  const [activeTab, setActiveTab] = useState('events');

  useEffect(() => {
    // If token exists, verify with backend /api/me
    if (authStorage.getToken()) {
      api.getMe()
        .then(u => {
          setUser(u);
          authStorage.setUser(u);
        })
        .catch(() => {
          authStorage.clear();
          setUser(null);
        });
    } else {
      // Default to Organizer demo account for seamless instant trial
      handleSwitchUser('organizer@cloud.edu');
    }
  }, []);

  const handleSwitchUser = async (targetEmail) => {
    try {
      const data = await api.login({ email: targetEmail, password: 'Cloud2026!' });
      authStorage.setToken(data.access_token);
      authStorage.setUser(data);
      setUser(data);
      if (data.role === 'ORGANIZER') {
        setActiveTab('organizer');
      } else {
        setActiveTab('events');
      }
    } catch (err) {
      console.error("Auto login error:", err);
    }
  };

  const handleLogout = () => {
    authStorage.clear();
    setUser(null);
    setActiveTab('login');
  };

  return (
    <div>
      <Navbar
        user={user}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main>
        {!user || activeTab === 'login' ? (
          <LoginPage onLoginSuccess={(u) => {
            setUser(u);
            setActiveTab(u.role === 'ORGANIZER' ? 'organizer' : 'events');
          }} />
        ) : activeTab === 'organizer' && user.role === 'ORGANIZER' ? (
          <OrganizerView user={user} />
        ) : (
          <AttendeeDashboard user={user} viewMode={activeTab} />
        )}
      </main>
    </div>
  );
}
