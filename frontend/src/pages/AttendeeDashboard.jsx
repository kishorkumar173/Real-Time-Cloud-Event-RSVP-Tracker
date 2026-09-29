import React, { useState, useEffect } from "react";
import { api, subscribeToEventWS } from "../api";
import EventCard from "../components/EventCard";

export default function AttendeeDashboard({ user, viewMode }) {
  const [events, setEvents] = useState([]);
  const [myRsvps, setMyRsvps] = useState([]);

  const loadData = async () => {
    try {
      const [evList, rsvpList] = await Promise.all([api.getEvents(), api.getMyAllRSVPs()]);
      setEvents(evList);
      setMyRsvps(rsvpList);
    } catch (err) {}
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (events.length === 0) return;
    const unsubs = events.map(ev => subscribeToEventWS(ev.event_id, (msg) => {
      if (msg.type === "RSVP_UPDATE") {
        setEvents(prev => prev.map(e => e.event_id === msg.event_id ? { ...e, current_going: msg.data.current_going, status: msg.data.status } : e));
      }
    }));
    return () => unsubs.forEach(u => u());
  }, [events.length]);

  return (
    <div className="container">
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "1.5rem" }}>
        {viewMode === "my-rsvps" ? "My Reserved Events" : "Discover Events"}
      </h1>
      <div className="grid-3">
        {events.map(event => {
          const userRsvp = myRsvps.find(r => r.event_id === event.event_id)?.status || "NONE";
          return <EventCard key={event.event_id} event={event} userRsvp={userRsvp} onRsvpChanged={loadData} />;
        })}
      </div>
    </div>
  );
}
