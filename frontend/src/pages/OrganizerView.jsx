import React, { useState, useEffect } from 'react';
import { api, subscribeToEventWS } from '../api';
import AnalyticsPanel from '../components/AnalyticsPanel';
import AnnouncementFeed from '../components/AnnouncementFeed';

export default function OrganizerView({ user }) {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [wsStatus, setWsStatus] = useState('CONNECTING');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Event Form State
  const [formData, setFormData] = useState({
    event_name: '',
    description: '',
    event_type: 'IN_PERSON',
    event_date: '2026-10-25',
    start_time: '14:00',
    end_time: '17:00',
    venue: '',
    online_link: '',
    maximum_capacity: 50,
    status: 'PUBLISHED'
  });

  const fetchEvents = async () => {
    try {
      const data = await api.getEvents();
      setEvents(data);
      if (data.length > 0 && !selectedEventId) {
        setSelectedEventId(data[0].event_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadEventDetails = async (eventId) => {
    try {
      const [analyticsData, rsvps, announcementsList] = await Promise.all([
        api.getEventAnalytics(eventId),
        api.getEventRSVPs(eventId),
        api.getAnnouncements(eventId)
      ]);
      setAnalytics(analyticsData);
      setAttendees(rsvps);
      setAnnouncements(announcementsList);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;

    loadEventDetails(selectedEventId);

    // Subscribe to live WebSockets for this event!
    const unsubscribe = subscribeToEventWS(
      selectedEventId,
      (message) => {
        console.log("WebSocket event message received:", message);
        if (message.type === 'RSVP_UPDATE') {
          // Instantly update analytics without page reload!
          setAnalytics(message.data);
          // Refresh attendee list in background
          api.getEventRSVPs(selectedEventId).then(setAttendees).catch(console.error);
        } else if (message.type === 'ANNOUNCEMENT') {
          setAnnouncements(prev => [message.data, ...prev]);
        }
      },
      (status) => setWsStatus(status)
    );

    return () => unsubscribe();
  }, [selectedEventId]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const newEvent = await api.createEvent({
        ...formData,
        maximum_capacity: parseInt(formData.maximum_capacity, 10)
      });
      setShowCreateModal(false);
      await fetchEvents();
      setSelectedEventId(newEvent.event_id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelEvent = async () => {
    if (!selectedEventId) return;
    if (!window.confirm("Are you sure you want to cancel this event? All attendees will be notified.")) return;
    try {
      await api.cancelEvent(selectedEventId);
      await fetchEvents();
      loadEventDetails(selectedEventId);
    } catch (err) {
      alert(err.message);
    }
  };

  const selectedEvent = events.find(e => e.event_id === selectedEventId);

  return (
    <div className="container">
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Organizer Studio</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage events, monitor live RSVPs, enforce capacity, and broadcast alerts in real-time.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create New Event
        </button>
      </div>

      {/* Event Selection Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        {events.map(ev => (
          <button
            key={ev.event_id}
            onClick={() => setSelectedEventId(ev.event_id)}
            className={`btn ${selectedEventId === ev.event_id ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.825rem', whiteSpace: 'nowrap' }}
          >
            {ev.event_name} ({ev.current_going}/{ev.maximum_capacity})
          </button>
        ))}
      </div>

      {selectedEvent && (
        <div className="grid-2">
          {/* Left Column: Analytics & Attendee Roster */}
          <div>
            <AnalyticsPanel analytics={analytics} wsStatus={wsStatus} />

            {/* Attendee Roster */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Live Attendee Roster</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Total Responses: {attendees.length}
                </span>
              </div>

              {attendees.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>
                  No RSVPs recorded yet for this event.
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.5rem' }}>Attendee</th>
                        <th style={{ padding: '0.5rem' }}>Email</th>
                        <th style={{ padding: '0.5rem' }}>RSVP Status</th>
                        <th style={{ padding: '0.5rem' }}>Responded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendees.map(a => (
                        <tr key={a.rsvp_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.5rem', fontWeight: 600 }}>{a.user_name}</td>
                          <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{a.user_email}</td>
                          <td style={{ padding: '0.5rem' }}>
                            <span className={`badge ${
                              a.status === 'GOING' ? 'badge-published' : a.status === 'MAYBE' ? 'badge-organizer' : 'badge-full'
                            }`}>
                              {a.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {a.responded_at ? new Date(a.responded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Event Details, Cancellation, Announcements */}
          <div>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Event Settings</h3>
                <span className={`badge ${selectedEvent.status === 'FULL' ? 'badge-full' : 'badge-published'}`}>
                  {selectedEvent.status}
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div><strong>Date:</strong> {selectedEvent.event_date}</div>
                <div><strong>Time:</strong> {selectedEvent.start_time} - {selectedEvent.end_time}</div>
                <div><strong>Venue:</strong> {selectedEvent.venue || 'Virtual'}</div>
                <div><strong>Max Capacity:</strong> {selectedEvent.maximum_capacity} attendees</div>
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-danger"
                  style={{ width: '100%', fontSize: '0.8rem' }}
                  onClick={handleCancelEvent}
                  disabled={selectedEvent.status === 'CANCELLED'}
                >
                  {selectedEvent.status === 'CANCELLED' ? 'Event Cancelled' : 'Cancel Event'}
                </button>
              </div>
            </div>

            {/* Announcement Broadcast Section */}
            <AnnouncementFeed
              eventId={selectedEvent.event_id}
              announcements={announcements}
              isOrganizer={true}
              onAnnouncementCreated={() => loadEventDetails(selectedEvent.event_id)}
            />
          </div>
        </div>
      )}

      {/* Modal: Create Event */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Create New Event</h2>
            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label>Event Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.event_name}
                  onChange={e => setFormData({ ...formData, event_name: e.target.value })}
                  placeholder="e.g., Cloud Architecture Summit"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Topics, agenda, prerequisites..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.event_date}
                    onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Max Capacity</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={formData.maximum_capacity}
                    onChange={e => setFormData({ ...formData, maximum_capacity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Start Time (HH:MM)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.start_time}
                    onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Time (HH:MM)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.end_time}
                    onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Venue (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.venue}
                  onChange={e => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="Hall A / Room 204"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
