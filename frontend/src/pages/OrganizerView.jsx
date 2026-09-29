import React, { useState, useEffect } from "react";
import { api, subscribeToEventWS } from "../api";
import AnalyticsPanel from "../components/AnalyticsPanel";
import AnnouncementFeed from "../components/AnnouncementFeed";

export default function OrganizerView({ user }) {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [wsStatus, setWsStatus] = useState("CONNECTING");

  // Create Event Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [newEvent, setNewEvent] = useState({
    event_name: "",
    description: "",
    event_type: "IN_PERSON",
    event_date: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
    start_time: "10:00",
    end_time: "13:00",
    venue: "Main Auditorium Hall A",
    online_link: "",
    maximum_capacity: 50,
    registration_deadline: new Date(Date.now() + 86400000 * 6).toISOString().split("T")[0]
  });

  const loadData = async () => {
    try {
      const data = await api.getEvents();
      setEvents(data);
      if (data.length > 0) {
        if (!selectedEventId || !data.some(e => e.event_id === selectedEventId)) {
          setSelectedEventId(data[0].event_id);
        }
      } else {
        setSelectedEventId(null);
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    }
  };

  const loadDetails = async (id) => {
    try {
      const [an, rsvps, anns] = await Promise.all([
        api.getEventAnalytics(id),
        api.getEventRSVPs(id),
        api.getAnnouncements(id)
      ]);
      setAnalytics(an);
      setAttendees(rsvps);
      setAnnouncements(anns);
    } catch (err) {
      console.error("Failed to load event details:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    loadDetails(selectedEventId);
    const unsub = subscribeToEventWS(selectedEventId, (msg) => {
      if (msg.type === "RSVP_UPDATE") {
        setAnalytics(msg.data);
        api.getEventRSVPs(selectedEventId).then(setAttendees).catch(() => {});
      } else if (msg.type === "ANNOUNCEMENT") {
        setAnnouncements(prev => [msg.data, ...prev]);
      }
    }, setWsStatus);
    return () => unsub();
  }, [selectedEventId]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      const payload = {
        event_name: newEvent.event_name.trim(),
        description: newEvent.description.trim(),
        event_type: newEvent.event_type,
        event_date: newEvent.event_date,
        start_time: newEvent.start_time,
        end_time: newEvent.end_time,
        venue: newEvent.event_type !== "VIRTUAL" ? newEvent.venue.trim() : null,
        online_link: newEvent.event_type !== "IN_PERSON" ? newEvent.online_link.trim() : null,
        maximum_capacity: parseInt(newEvent.maximum_capacity, 10),
        registration_deadline: newEvent.registration_deadline,
        status: "PUBLISHED"
      };

      const created = await api.createEvent(payload);
      setShowCreateModal(false);
      setNewEvent({
        event_name: "",
        description: "",
        event_type: "IN_PERSON",
        event_date: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
        start_time: "10:00",
        end_time: "13:00",
        venue: "Main Auditorium Hall A",
        online_link: "",
        maximum_capacity: 50,
        registration_deadline: new Date(Date.now() + 86400000 * 6).toISOString().split("T")[0]
      });
      await loadData();
      setSelectedEventId(created.event_id);
    } catch (err) {
      setCreateError(err.message || "Failed to create event");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container">
      {/* Top Header & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }}>
            👑 Organizer Studio
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>
            Create events, monitor real-time RSVP counts, view live attendee rosters & broadcast announcements.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 1.1rem", fontSize: "0.9rem", fontWeight: 700 }}
        >
          ➕ Create New Event
        </button>
      </div>

      {/* Event Selection Pills */}
      {events.length > 0 ? (
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
          {events.map(ev => (
            <button
              key={ev.event_id}
              onClick={() => setSelectedEventId(ev.event_id)}
              className={`btn ${selectedEventId === ev.event_id ? "btn-primary" : "btn-outline"}`}
              style={{ whiteSpace: "nowrap", fontSize: "0.85rem", padding: "0.45rem 0.85rem" }}
            >
              {ev.event_name} ({ev.current_going}/{ev.maximum_capacity})
            </button>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: "3rem 2rem", textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📅</div>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>No Events Created Yet</h3>
          <p style={{ color: "var(--text-muted)", maxWidth: "450px", margin: "0 auto 1.5rem auto", fontSize: "0.9rem" }}>
            You haven't created any events yet. Click the button below to launch your first cloud event!
          </p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            ➕ Create Your First Event
          </button>
        </div>
      )}

      {selectedEventId && (
        <div className="grid-2">
          <div>
            <AnalyticsPanel analytics={analytics} wsStatus={wsStatus} />
            <div className="card" style={{ marginTop: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
                  Attendee Roster ({attendees.length})
                </h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Live synced with Cloud DB
                </span>
              </div>
              {attendees.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", padding: "1rem 0" }}>
                  No attendees have RSVP'd to this event yet.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ textAlign: "left", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                        <th style={{ padding: "0.6rem 0.5rem" }}>Name</th>
                        <th style={{ padding: "0.6rem 0.5rem" }}>Email</th>
                        <th style={{ padding: "0.6rem 0.5rem" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendees.map(a => (
                        <tr key={a.rsvp_id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "0.6rem 0.5rem", fontWeight: 600 }}>{a.user_name}</td>
                          <td style={{ padding: "0.6rem 0.5rem", color: "var(--text-muted)" }}>{a.user_email}</td>
                          <td style={{ padding: "0.6rem 0.5rem" }}>
                            <span className={`badge ${a.status === "GOING" ? "badge-published" : a.status === "WAITLISTED" ? "badge-full" : "badge-draft"}`}>
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div>
            <AnnouncementFeed
              eventId={selectedEventId}
              announcements={announcements}
              isOrganizer={true}
              onAnnouncementCreated={() => loadDetails(selectedEventId)}
            />
          </div>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {showCreateModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1rem"
        }}>
          <div className="card" style={{
            maxWidth: "520px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "2rem",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0 }}>➕ Create New Event</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>

            {createError && (
              <div style={{
                marginBottom: "1rem",
                padding: "0.65rem 0.85rem",
                background: "#fee2e2",
                color: "#991b1b",
                borderRadius: "8px",
                fontSize: "0.85rem"
              }}>
                ⚠️ {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                  Event Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={newEvent.event_name}
                  onChange={(e) => setNewEvent({ ...newEvent, event_name: e.target.value })}
                  placeholder="e.g., Cloud Architecture & AI Summit"
                  required
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                  Description
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Briefly describe what this event is about..."
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div className="form-group">
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                    Event Type
                  </label>
                  <select
                    className="form-control"
                    value={newEvent.event_type}
                    onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px" }}
                  >
                    <option value="IN_PERSON">In-Person</option>
                    <option value="VIRTUAL">Virtual</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                    Capacity Limit *
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={newEvent.maximum_capacity}
                    onChange={(e) => setNewEvent({ ...newEvent, maximum_capacity: e.target.value })}
                    required
                    style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div className="form-group">
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                    Event Date *
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={newEvent.event_date}
                    onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                    required
                    style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px" }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                    Registration Deadline
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={newEvent.registration_deadline}
                    onChange={(e) => setNewEvent({ ...newEvent, registration_deadline: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div className="form-group">
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                    Start Time *
                  </label>
                  <input
                    type="time"
                    className="form-control"
                    value={newEvent.start_time}
                    onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                    required
                    style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px" }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                    End Time *
                  </label>
                  <input
                    type="time"
                    className="form-control"
                    value={newEvent.end_time}
                    onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                    required
                    style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px" }}
                  />
                </div>
              </div>

              {newEvent.event_type !== "VIRTUAL" && (
                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                    Venue / Physical Location
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={newEvent.venue}
                    onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                    placeholder="e.g., Auditorium Hall A"
                    style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px" }}
                  />
                </div>
              )}

              {newEvent.event_type !== "IN_PERSON" && (
                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                    Online Meeting Link
                  </label>
                  <input
                    type="url"
                    className="form-control"
                    value={newEvent.online_link}
                    onChange={(e) => setNewEvent({ ...newEvent, online_link: e.target.value })}
                    placeholder="https://meet.google.com/..."
                    style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: "0.65rem" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-primary"
                  style={{ flex: 2, padding: "0.65rem", fontWeight: 700 }}
                >
                  {creating ? "Creating..." : "Publish Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
