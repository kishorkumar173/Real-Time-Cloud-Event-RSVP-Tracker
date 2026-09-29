import React, { useState, useEffect } from "react";
import { api, authStorage } from "./api";
import Navbar from "./components/Navbar";
import AttendeeDashboard from "./pages/AttendeeDashboard";
import OrganizerView from "./pages/OrganizerView";
import LoginPage from "./pages/LoginPage";

export default function App() {
  const [user, setUser] = useState(authStorage.getUser());
  const [activeTab, setActiveTab] = useState(
    authStorage.getUser()
      ? (authStorage.getUser().role === "ORGANIZER" ? "organizer" : "events")
      : "login"
  );

  useEffect(() => {
    if (authStorage.getToken()) {
      api.getMe()
        .then((u) => {
          setUser(u);
          authStorage.setUser(u);
        })
        .catch(() => {
          authStorage.clear();
          setUser(null);
          setActiveTab("login");
        });
    } else {
      authStorage.clear();
      setUser(null);
      setActiveTab("login");
    }
  }, []);

  const handleLogout = () => {
    authStorage.clear();
    setUser(null);
    setActiveTab("login");
  };

  return (
    <div>
      <Navbar
        user={user}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <main>
        {!user || activeTab === "login" ? (
          <LoginPage
            onLoginSuccess={(u) => {
              setUser(u);
              setActiveTab(u.role === "ORGANIZER" ? "organizer" : "events");
            }}
          />
        ) : activeTab === "organizer" && user.role === "ORGANIZER" ? (
          <OrganizerView user={user} />
        ) : (
          <AttendeeDashboard user={user} viewMode={activeTab} />
        )}
      </main>
    </div>
  );
}
