const API_BASE_URL =
import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const api = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // VERY IMPORTANT (cookies)
    ...options,
  });

  const contentType = response.headers.get("content-type");
  let data;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    throw new Error(data?.message || data || "Something went wrong");
  }

  return data;
};

// ===== EVENT API CALLS =====
export const eventAPI = {
  // Create new event
  create: (eventData) =>
    api("/events/create", {
      method: "POST",
      body: JSON.stringify(eventData),
    }),

  // Get pending events (admin only)
  getPending: () =>
    api("/events/pending/all", {
      method: "GET",
    }),

  // Get all events (admin)
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api(`/events?${queryString}`, { method: "GET" });
  },

  // Get my events
  getMyEvents: () =>
    api("/events/my-events", {
      method: "GET",
    }),

  // Get published events (public)
  getPublished: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api(`/events/published?${queryString}`, { method: "GET" });
  },

  // Get single event
  getById: (eventId) =>
    api(`/events/${eventId}`, {
      method: "GET",
    }),

  // Approve event (admin)
  approve: (eventId) =>
    api(`/events/${eventId}/approve`, {
      method: "PATCH",
    }),

  // Reject event (admin)
  reject: (eventId, reason) =>
    api(`/events/${eventId}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ rejectionReason: reason }),
    }),

  // Publish event (event creator)
  publish: (eventId) =>
    api(`/events/${eventId}/publish`, {
      method: "PATCH",
    }),

  // Update event
  update: (eventId, updateData) =>
    api(`/events/${eventId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    }),

  // Delete event
  delete: (eventId) =>
    api(`/events/${eventId}`, {
      method: "DELETE",
    }),

  // Cancel event
  cancel: (eventId, reason) =>
    api(`/events/${eventId}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),

  // Get statistics
  getStats: () =>
    api("/events/stats/dashboard", {
      method: "GET",
    }),
};

// ===== NOTIFICATION API CALLS =====
export const stallAPI = {
  getEventStalls: (eventId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const querySuffix = queryString ? `?${queryString}` : "";
    return api(`/stalls/event/${eventId}${querySuffix}`, { method: "GET" });
  },

  getById: (stallId) =>
    api(`/stalls/${stallId}`, {
      method: "GET",
    }),
};

export const notificationAPI = {
  // Get notifications
  getAll: (limit = 20, skip = 0) =>
    api(`/notifications?limit=${limit}&skip=${skip}`, {
      method: "GET",
    }),

  // Mark as read
  markAsRead: (notificationId) =>
    api(`/notifications/${notificationId}/read`, {
      method: "PATCH",
    }),

  // Mark all as read
  markAllAsRead: () =>
    api("/notifications/read/all", {
      method: "PATCH",
    }),

  // Delete notification
  delete: (notificationId) =>
    api(`/notifications/${notificationId}`, {
      method: "DELETE",
    }),
};
