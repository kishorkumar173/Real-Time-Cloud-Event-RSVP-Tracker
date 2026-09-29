import React, { useState } from "react";
import { api } from "../api";

export default function RsvpWidget({ eventId, currentStatus, onRsvpUpdated, disabled }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSelect = async (status) => {
    setLoading(true);
    setMsg(null);
    try {
      await api.submitRSVP(eventId, status);
      setMsg({ type: "success", text: `Your RSVP has been recorded: ${status}` });
      if (onRsvpUpdated) onRsvpUpdated();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await api.cancelRSVP(eventId);
      setMsg({ type: "success", text: "Your RSVP has been cancelled." });
      if (onRsvpUpdated) onRsvpUpdated();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>YOUR RSVP:</span>
        {currentStatus && currentStatus !== "NONE" && (
          <button onClick={handleCancel} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.7rem", cursor: "pointer" }}>Cancel RSVP</button>
        )}
      </div>

      <div className="rsvp-group">
        <button disabled={disabled || loading} onClick={() => handleSelect("GOING")} className={`rsvp-btn ${currentStatus === "GOING" ? "active-going" : ""}`}>✅ Going</button>
        <button disabled={disabled || loading} onClick={() => handleSelect("MAYBE")} className={`rsvp-btn ${currentStatus === "MAYBE" ? "active-maybe" : ""}`}>🤔 Maybe</button>
        <button disabled={disabled || loading} onClick={() => handleSelect("NOT_GOING")} className={`rsvp-btn ${currentStatus === "NOT_GOING" ? "active-not-going" : ""}`}>❌ Not Going</button>
      </div>

      {msg && (
        <div style={{ marginTop: "0.5rem", padding: "0.4rem 0.6rem", background: msg.type === "success" ? "#dcfce7" : "#fee2e2", color: msg.type === "success" ? "#166534" : "#991b1b", borderRadius: "6px", fontSize: "0.75rem" }}>
          {msg.text}
        </div>
      )}
    </div>
  );
}
