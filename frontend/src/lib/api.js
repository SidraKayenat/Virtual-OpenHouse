export const API_BASE_URL = "http://localhost:8747/api";
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
    // Remove undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== ""),
    );
    const queryString = new URLSearchParams(cleanParams).toString();
    const url = queryString ? `/events?${queryString}` : "/events";
    return api(url, { method: "GET" });
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

  // Get single event  -Auth required
  getById: (eventId) =>
    api(`/events/${eventId}`, {
      method: "GET",
    }),

  // NEW: Public event view - NO AUTH REQUIRED
  getPublicById: (eventId) => {
    return fetch(`${API_BASE_URL}/events/public/${eventId}`, {
      method: "GET",
      credentials: "include",
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch event");
      }
      return res.json();
    });
  },

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

  uploadThumbnail: (eventId, formData) => {
    return fetch(`${API_BASE_URL}/events/${eventId}/upload-thumbnail`, {
      method: "POST",
      credentials: "include",
      body: formData,
    }).then((res) => res.json());
  },

  uploadBackground: (eventId, formData) => {
    return fetch(`${API_BASE_URL}/events/${eventId}/upload-background`, {
      method: "POST",
      credentials: "include",
      body: formData,
    }).then((res) => res.json());
  },
};

// ===== NOTIFICATION API CALLS =====
// Add this to your api.js file after the other API definitions

// ===== NOTIFICATION API CALLS =====
export const notificationAPI = {
  // Get all notifications for current user
  getAll: (limit = 20, skip = 0) =>
    api(`/notifications?limit=${limit}&skip=${skip}`, {
      method: "GET",
    }),

  // Get unread count only (lightweight)
  getUnreadCount: () =>
    api(`/notifications/unread-count`, {
      method: "GET",
    }),

  // Mark a specific notification as read
  markAsRead: (notificationId) =>
    api(`/notifications/${notificationId}/read`, {
      method: "PATCH",
    }),

  // Mark all notifications as read
  markAllAsRead: () =>
    api("/notifications/read/all", {
      method: "PATCH",
    }),

  // Delete a notification
  delete: (notificationId) =>
    api(`/notifications/${notificationId}`, {
      method: "DELETE",
    }),
};

// ===== REGISTRATION API CALLS =====
export const registrationAPI = {
  // Create registration
  create: (eventId, registrationData) =>
    api(`/registrations/events/${eventId}/register`, {
      method: "POST",
      body: JSON.stringify(registrationData),
    }),

  // Get my registrations
  getMyRegistrations: (status = null) => {
    const queryString = status ? `?status=${status}` : "";
    return api(`/registrations/my-registrations${queryString}`, {
      method: "GET",
    });
  },

  // Get event registrations (event admin only)
  getEventRegistrations: (eventId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api(
      `/registrations/events/${eventId}/all${queryString ? "?" + queryString : ""}`,
      {
        method: "GET",
      },
    );
  },

  // ⭐ GET REGISTRATION STATISTICS
  getStats: (eventId) =>
    api(`/registrations/events/${eventId}/statistics`, {
      method: "GET",
    }),

  // Get single registration
  getById: (registrationId) =>
    api(`/registrations/${registrationId}`, {
      method: "GET",
    }),

  // Approve registration
  approve: (registrationId, stallNumber) =>
    api(`/registrations/${registrationId}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ stallNumber }),
    }),

  // Reject registration
  reject: (registrationId, rejectionReason) =>
    api(`/registrations/${registrationId}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ rejectionReason }),
    }),

  // Update registration
  update: (registrationId, updateData) =>
    api(`/registrations/${registrationId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    }),

  // Cancel registration
  cancel: (registrationId) =>
    api(`/registrations/${registrationId}/cancel`, {
      method: "PATCH",
    }),
};

// ===== STALL API CALLS =====
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

  // Create stall (after approval)
  create: (registrationId) =>
    api("/stalls/create", {
      method: "POST",
      body: JSON.stringify({ registrationId }),
    }),

  // Get my stalls
  getMyStalls: () =>
    api("/stalls/my-stalls", {
      method: "GET",
    }),

  // Get stall by ID
  getById: (stallId) =>
    api(`/stalls/${stallId}`, {
      method: "GET",
    }),

  // Update stall (title, description, team, etc.)
  update: (stallId, data) =>
    api(`/stalls/${stallId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Publish stall
  publish: (stallId) =>
    api(`/stalls/${stallId}/publish`, {
      method: "PATCH",
    }),

  // Unpublish stall
  unpublish: (stallId) =>
    api(`/stalls/${stallId}/unpublish`, {
      method: "PATCH",
    }),

  // Toggle active
  toggleActive: (stallId) =>
    api(`/stalls/${stallId}/toggle-active`, {
      method: "PATCH",
    }),

  // Delete stall
  delete: (stallId) =>
    api(`/stalls/${stallId}`, {
      method: "DELETE",
    }),

  // ===== MEDIA =====

  // Upload images
  uploadImages: (stallId, files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    return fetch(`${API_BASE_URL}/stalls/${stallId}/upload-images`, {
      method: "POST",
      credentials: "include",
      body: formData,
    }).then((res) => res.json());
  },

  // Upload banner
  uploadBanner: (stallId, file) => {
    const formData = new FormData();
    formData.append("banner", file);

    return fetch(`${API_BASE_URL}/stalls/${stallId}/upload-banner`, {
      method: "POST",
      credentials: "include",
      body: formData,
    }).then((res) => res.json());
  },

  // Delete image
  deleteImage: (stallId, publicId) =>
    api(`/stalls/${stallId}/images/${publicId}`, {
      method: "DELETE",
    }),

  // Update image caption
  updateImageCaption: (stallId, publicId, caption) =>
    api(`/stalls/${stallId}/images/${publicId}/caption`, {
      method: "PATCH",
      body: JSON.stringify({ caption }),
    }),

  // Reorder images
  reorderImages: (stallId, images) =>
    api(`/stalls/${stallId}/images/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ images }),
    }),

  // Upload video
  uploadVideo: (stallId, file) => {
    const formData = new FormData();
    formData.append("video", file);

    return fetch(`${API_BASE_URL}/stalls/${stallId}/upload-video`, {
      method: "POST",
      credentials: "include",
      body: formData,
    }).then((res) => res.json());
  },

  // Upload documents
  uploadDocuments: (stallId, files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("documents", file));

    return fetch(`${API_BASE_URL}/stalls/${stallId}/upload-documents`, {
      method: "POST",
      credentials: "include",
      body: formData,
    }).then((res) => res.json());
  },
};

// ===== USER API CALLS =====
export const userAPI = {
  // Get user statistics (total users & admins) - Public
  getStats: () => api("/users/stats", { method: "GET" }),

  // Get recent users (latest 3 users with role "user") - Public
  getRecentUsers: (limit = 3) =>
    api(`/users/recent?limit=${limit}`, { method: "GET" }),

  // Get all users - Admin only
  getAllUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const querySuffix = queryString ? `?${queryString}` : "";
    return api(`/users${querySuffix}`, { method: "GET" });
  },

  // Get user by ID - Authenticated
  getById: (userId) => api(`/users/${userId}`, { method: "GET" }),

  // Update user profile - Authenticated
  update: (userId, userData) =>
    api(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    }),

  // Delete user - Admin only
  delete: (userId) => api(`/users/${userId}`, { method: "DELETE" }),

  activateUser: (id) =>
    api(`/users/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ isActive: true }),
    }),

  deactivateUser: (id) =>
    api(`/users/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ isActive: false }),
    }),

  // Update user role (admin only)
  updateRole: (userId, role) =>
    api(`/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
};
