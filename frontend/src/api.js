const API_BASE = '/api';

export const authStorage = {
  getToken: () => localStorage.getItem('rsvp_token'),
  setToken: (token) => localStorage.setItem('rsvp_token', token),
  getUser: () => {
    const u = localStorage.getItem('rsvp_user');
    return u ? JSON.parse(u) : null;
  },
  setUser: (user) => localStorage.setItem('rsvp_user', JSON.stringify(user)),
  clear: () => {
    localStorage.removeItem('rsvp_token');
    localStorage.removeItem('rsvp_user');
  }
};

async function request(endpoint, options = {}) {
  const token = authStorage.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) return null;

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'API request failed');
  }
  return data;
}

export const api = {
  // Auth
  register: (payload) => request('/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (credentials) => request('/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => request('/me'),

  // Events
  getEvents: (status) => request(status ? `/events?status_filter=${status}` : '/events'),
  getUpcomingEvents: () => request('/events/upcoming'),
  getEvent: (id) => request(`/events/${id}`),
  createEvent: (payload) => request('/events', { method: 'POST', body: JSON.stringify(payload) }),
  updateEvent: (id, payload) => request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  cancelEvent: (id) => request(`/events/${id}/cancel`, { method: 'POST' }),

  // RSVP
  submitRSVP: (eventId, status) => request(`/events/${eventId}/rsvp`, {
    method: 'POST',
    body: JSON.stringify({ status })
  }),
  getMyEventRSVP: (eventId) => request(`/events/${eventId}/my-rsvp`),
  getMyAllRSVPs: () => request('/rsvps/me'),
  getEventRSVPs: (eventId) => request(`/events/${eventId}/rsvps`),
  cancelRSVP: (eventId) => request(`/events/${eventId}/rsvp`, { method: 'DELETE' }),

  // Announcements
  getAnnouncements: (eventId) => request(`/events/${eventId}/announcements`),
  createAnnouncement: (eventId, payload) => request(`/events/${eventId}/announcements`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Analytics
  getEventAnalytics: (eventId) => request(`/events/${eventId}/analytics`),
  getOrganizerAnalytics: () => request('/analytics/organizer'),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),
  healthCheck: () => request('/health')
};

// WebSocket factory with auto-reconnection
export function subscribeToEventWS(eventId, onMessage, onStatusChange) {
  let ws;
  let reconnectTimer;
  let active = true;

  function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/events/${eventId}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      if (onStatusChange) onStatusChange('CONNECTED');
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (onMessage) onMessage(payload);
      } catch (err) {
        console.error('Failed to parse WebSocket message', err);
      }
    };

    ws.onclose = () => {
      if (onStatusChange) onStatusChange('DISCONNECTED');
      if (active) {
        reconnectTimer = setTimeout(connect, 3000);
      }
    };

    ws.onerror = (err) => {
      if (onStatusChange) onStatusChange('ERROR');
      ws.close();
    };
  }

  connect();

  return () => {
    active = false;
    clearTimeout(reconnectTimer);
    if (ws) ws.close();
  };
}
