const API_BASE = "/api";


export const authStorage = {
  getToken: () => localStorage.getItem("rsvp_token"),
  setToken: (token) => localStorage.setItem("rsvp_token", token),
  getUser: () => {
    const u = localStorage.getItem("rsvp_user");
    return u ? JSON.parse(u) : null;
  },
  setUser: (user) => localStorage.setItem("rsvp_user", JSON.stringify(user)),
  clear: () => {
    localStorage.removeItem("rsvp_token");
    localStorage.removeItem("rsvp_user");
  }
};

async function request(endpoint, options = {}) {
  const token = authStorage.getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  } catch (netErr) {
    throw new Error("Unable to connect to server. Please verify your backend server is running.");
  }

  if (response.status === 204) return null;

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (parseErr) {
    if (!response.ok) {
      if (response.status === 500) {
        throw new Error("Server encountered an internal error. Please check server logs.");
      }
      throw new Error(`Server error (${response.status}): ${text || response.statusText}`);
    }
    throw new Error("Invalid response format from server");
  }

  if (!response.ok) {
    let msg = "Request failed";
    if (typeof data.detail === "string") {
      msg = data.detail;
    } else if (Array.isArray(data.detail)) {
      msg = data.detail.map(d => d.msg || JSON.stringify(d)).join(", ");
    } else if (data.message) {
      msg = data.message;
    }
    throw new Error(msg);
  }

  return data;
}


export const api = {
  register: (payload) => request("/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (credentials) => request("/login", { method: "POST", body: JSON.stringify(credentials) }),
  getMe: () => request("/me"),
  getEvents: (status) => request(status ? `/events?status_filter=${status}` : "/events"),
  getUpcomingEvents: () => request("/events/upcoming"),
  getEvent: (id) => request(`/events/${id}`),
  createEvent: (payload) => request("/events", { method: "POST", body: JSON.stringify(payload) }),
  updateEvent: (id, payload) => request(`/events/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  cancelEvent: (id) => request(`/events/${id}/cancel`, { method: "POST" }),
  submitRSVP: (eventId, status) => request(`/events/${eventId}/rsvp`, { method: "POST", body: JSON.stringify({ status }) }),
  getMyEventRSVP: (eventId) => request(`/events/${eventId}/my-rsvp`),
  getMyAllRSVPs: () => request("/rsvps/me"),
  getEventRSVPs: (eventId) => request(`/events/${eventId}/rsvps`),
  cancelRSVP: (eventId) => request(`/events/${eventId}/rsvp`, { method: "DELETE" }),
  getAnnouncements: (eventId) => request(`/events/${eventId}/announcements`),
  createAnnouncement: (eventId, payload) => request(`/events/${eventId}/announcements`, { method: "POST", body: JSON.stringify(payload) }),
  getEventAnalytics: (eventId) => request(`/events/${eventId}/analytics`),
  getOrganizerAnalytics: () => request("/analytics/organizer"),
  getNotifications: () => request("/notifications"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "PUT" }),
  markAllNotificationsRead: () => request("/notifications/read-all", { method: "PUT" }),
  healthCheck: () => request("/health")
};

export function subscribeToEventWS(eventId, onMessage, onStatusChange) {
  let ws;
  let active = true;
  function connect() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = (window.location.port === "5173" || window.location.port === "3000")
      ? "127.0.0.1:8000"
      : window.location.host;
    ws = new WebSocket(`${protocol}//${host}/ws/events/${eventId}`);
    ws.onopen = () => onStatusChange && onStatusChange("CONNECTED");
    ws.onmessage = (e) => {
      try { onMessage && onMessage(JSON.parse(e.data)); } catch (err) {}
    };
    ws.onclose = () => {
      onStatusChange && onStatusChange("DISCONNECTED");
      if (active) setTimeout(connect, 3000);
    };
  }
  connect();
  return () => { active = false; if (ws) ws.close(); };
}
