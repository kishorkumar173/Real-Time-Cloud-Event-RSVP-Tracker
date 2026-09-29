import React, { useState, useEffect } from 'react';
import { api, subscribeToEventWS } from '../api';
import EventCard from '../components/EventCard';

export default function AttendeeDashboard({ user, viewMode }) {
  const [events, setEvents] = useState([]);
  const [myRsvps, setMyRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      const [eventsList, rsvpsList] = await Promise.all([
        api.getEvents(),
        api.getMyAllRSVPs()
      ]);
      setEvents(eventsList);
      setMyRsvps(rsvpsList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Listen to WebSocket broadcasts for all visible events to ensure live counts
  useEffect(() => {
    if (events.length === 0) return;
    const unsubscribes = events.map(ev => {
      return subscribeToEventWS(ev.event_id, (message) => {
        if (message.type === 'RSVP_UPDATE') {
          setEvents(prev => prev.map(e => {
            if (e.event_id === message.event_id) {
              return {
                ...e,
                current_going: message.data.current_going,
                status: message.data.status
              };
            }
            return e;
          }));
        }
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [events.length]);

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.event_name.toLowerCase().includes(search.toLowerCase()) ||
                          (e.description && e.description.toLowerCase().includes(search.toLowerCase()));
    if (viewMode === 'my-rsvps') {
      const r = myRsvps.find(r => r.event_id === e.event_id);
      return matchesSearch && r && (r.status === 'GOING' || r.status === 'MAYBE');
    }
    return matchesSearch;
  });

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {viewMode === 'my-rsvps' ? 'My Reserved Events' : 'Discover Events'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {viewMode === 'my-rsvps'
              ? 'Events you have registered or waitlisted for.'
              : 'Real-time cloud RSVP tracking with automatic waitlist and QR invitations.'}
          </p>
        </div>

        <div style={{ width: '300px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          Loading live events...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 0' }}>
          <h3>No events found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            {viewMode === 'my-rsvps'
              ? "You haven't RSVPed to any events yet. Explore upcoming events to participate!"
              : 'No matching events found. Check back later!'}
          </p>
        </div>
      ) : (
        <div className="grid-3">
          {filteredEvents.map(event => {
            const userRsvp = myRsvps.find(r => r.event_id === event.event_id)?.status || 'NONE';
            return (
              <EventCard
                key={event.event_id}
                event={event}
                userRsvp={userRsvp}
                onRsvpChanged={loadData}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
