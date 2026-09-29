import React from "react";
import NotificationBell from "./NotificationBell";

export default function Navbar({ user, onLogout, activeTab, setActiveTab }) {
  return (
    <header className="navbar">
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <a
          href="#"
          className="nav-brand"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab(user ? (user.role === "ORGANIZER" ? "organizer" : "events") : "login");
          }}
          style={{ textDecoration: "none" }}
        >
          <span>☁️ CloudRSVP</span>
        </a>

        {user && (
          <nav style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className={`btn ${activeTab === "events" ? "btn-primary" : "btn-outline"}`}
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.825rem" }}
              onClick={() => setActiveTab("events")}
            >
              📅 Explore Events
            </button>

            {user.role === "ORGANIZER" && (
              <button
                className={`btn ${activeTab === "organizer" ? "btn-primary" : "btn-outline"}`}
                style={{ padding: "0.4rem 0.8rem", fontSize: "0.825rem" }}
                onClick={() => setActiveTab("organizer")}
              >
                👑 Organizer Studio
              </button>
            )}

            <button
              className={`btn ${activeTab === "my-rsvps" ? "btn-primary" : "btn-outline"}`}
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.825rem" }}
              onClick={() => setActiveTab("my-rsvps")}
            >
              🎟️ My RSVPs
            </button>
          </nav>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {user ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-main)" }}>
                👤 {user.full_name}
              </span>
              <span
                className={`badge ${user.role === "ORGANIZER" ? "badge-organizer" : "badge-attendee"}`}
                style={{ fontSize: "0.75rem", padding: "0.2rem 0.55rem" }}
              >
                {user.role === "ORGANIZER" ? "👑 Organizer" : "🎓 Participant"}
              </span>
            </div>

            <NotificationBell />

            <button
              className="btn btn-outline"
              onClick={onLogout}
              style={{ padding: "0.4rem 0.85rem", fontSize: "0.825rem" }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() => setActiveTab("login")}
            style={{ padding: "0.4rem 0.9rem", fontSize: "0.85rem" }}
          >
            Sign In / Register
          </button>
        )}
      </div>
    </header>
  );
}
