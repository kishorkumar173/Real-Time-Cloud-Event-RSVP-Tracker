import React from "react";

export default function AnalyticsPanel({ analytics, wsStatus }) {
  if (!analytics) return <div className="card"><p>Loading live analytics...</p></div>;
  const { event_name, maximum_capacity, going_count, maybe_count, not_going_count, waitlist_count, available_seats, capacity_utilization, is_full } = analytics;

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Real-Time Cloud Analytics</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{event_name}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--success)" }}>
          <span className="pulse-dot"></span>
          <span>{wsStatus === "CONNECTED" ? "LIVE SYNC" : "CONNECTING..."}</span>
        </div>
      </div>

      <div className="grid-stats">
        <div className="stat-card" style={{ borderLeft: "4px solid #10b981" }}>
          <span className="stat-label">Going</span>
          <span className="stat-value" style={{ color: "#10b981" }}>{going_count}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <span className="stat-label">Maybe</span>
          <span className="stat-value" style={{ color: "#f59e0b" }}>{maybe_count}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #ef4444" }}>
          <span className="stat-label">Not Going</span>
          <span className="stat-value" style={{ color: "#ef4444" }}>{not_going_count}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #8b5cf6" }}>
          <span className="stat-label">Waitlist</span>
          <span className="stat-value" style={{ color: "#8b5cf6" }}>{waitlist_count}</span>
        </div>
      </div>

      <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 700 }}>
          <span>Capacity Utilization: {capacity_utilization}%</span>
          <span>Available Seats: {available_seats} / {maximum_capacity}</span>
        </div>
        <div className="progress-bar" style={{ height: "10px" }}>
          <div className="progress-fill" style={{ width: `${Math.min(100, capacity_utilization)}%`, background: is_full ? "var(--danger)" : "var(--primary)" }} />
        </div>
        {is_full && <p style={{ fontSize: "0.75rem", color: "var(--danger)", fontWeight: 700, marginTop: "0.25rem" }}>⚠️ MAXIMUM CAPACITY REACHED — Additional "Going" RSVPs will enter priority waitlist.</p>}
      </div>
    </div>
  );
}
