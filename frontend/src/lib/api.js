export const API_BASE_URL = "http://localhost:8747/api";

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
  create: (eventData) =>
    api("/events/create", {
      method: "POST",
      body: JSON.stringify(eventData),
    }),

  getPending: () =>
    api("/events/pending/all", {
      method: "GET",
    }),

  getAll: (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== ""),
    );
    const queryString = new URLSearchParams(cleanParams).toString();
    const url = queryString ? `/events?${queryString}` : "/events";
    return api(url, { method: "GET" });
  },

  getMyEvents: () =>
    api("/events/my-events", {
      method: "GET",
    }),

  getPublished: (params = {}) => {
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (
        params[key] !== undefined &&
        params[key] !== "" &&
        params[key] !== null
      ) {
        cleanParams[key] = params[key];
      }
    });
    const queryString = new URLSearchParams(cleanParams).toString();
    const url = queryString
      ? `/events/published?${queryString}`
      : "/events/published";
    console.log("API URL:", url);
    return api(url, { method: "GET" });
  },

  getById: (eventId) =>
    api(`/events/${eventId}`, {
      method: "GET",
    }),

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

  approve: (eventId) =>
    api(`/events/${eventId}/approve`, {
      method: "PATCH",
    }),

  reject: (eventId, reason) =>
    api(`/events/${eventId}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ rejectionReason: reason }),
    }),

  publish: (eventId) =>
    api(`/events/${eventId}/publish`, {
      method: "PATCH",
    }),

  update: (eventId, updateData) =>
    api(`/events/${eventId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    }),

  delete: (eventId) =>
    api(`/events/${eventId}`, {
      method: "DELETE",
    }),

  cancel: (eventId, reason) =>
    api(`/events/${eventId}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),

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
export const notificationAPI = {
  getAll: (limit = 20, skip = 0) =>
    api(`/notifications?limit=${limit}&skip=${skip}`, {
      method: "GET",
    }),

  getUnreadCount: () =>
    api(`/notifications/unread-count`, {
      method: "GET",
    }),

  markAsRead: (notificationId) =>
    api(`/notifications/${notificationId}/read`, {
      method: "PATCH",
    }),

  markAllAsRead: () =>
    api("/notifications/read/all", {
      method: "PATCH",
    }),

  delete: (notificationId) =>
    api(`/notifications/${notificationId}`, {
      method: "DELETE",
    }),
};

// ===== REGISTRATION API CALLS =====
export const registrationAPI = {
  create: (eventId, registrationData) =>
    api(`/registrations/events/${eventId}/register`, {
      method: "POST",
      body: JSON.stringify(registrationData),
    }),

  getMyRegistrations: (status = null) => {
    const queryString = status ? `?status=${status}` : "";
    return api(`/registrations/my-registrations${queryString}`, {
      method: "GET",
    });
  },

  getEventRegistrations: (eventId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api(
      `/registrations/events/${eventId}/all${queryString ? "?" + queryString : ""}`,
      {
        method: "GET",
      },
    );
  },

  getStats: (eventId) =>
    api(`/registrations/events/${eventId}/statistics`, {
      method: "GET",
    }),

  getById: (registrationId) =>
    api(`/registrations/${registrationId}`, {
      method: "GET",
    }),

  approve: (registrationId, stallNumber) =>
    api(`/registrations/${registrationId}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ stallNumber }),
    }),

  reject: (registrationId, rejectionReason) =>
    api(`/registrations/${registrationId}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ rejectionReason }),
    }),

  update: (registrationId, updateData) =>
    api(`/registrations/${registrationId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    }),

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

  getMyStalls: () =>
    api("/stalls/my-stalls", {
      method: "GET",
    }),

  getById: (stallId) =>
    api(`/stalls/${stallId}`, {
      method: "GET",
    }),

  create: (registrationId) =>
    api("/stalls/create", {
      method: "POST",
      body: JSON.stringify({ registrationId }),
    }),

  update: (stallId, data) =>
    api(`/stalls/${stallId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  publish: (stallId) =>
    api(`/stalls/${stallId}/publish`, {
      method: "PATCH",
    }),

  unpublish: (stallId) =>
    api(`/stalls/${stallId}/unpublish`, {
      method: "PATCH",
    }),

  toggleActive: (stallId) =>
    api(`/stalls/${stallId}/toggle-active`, {
      method: "PATCH",
    }),

  delete: (stallId) =>
    api(`/stalls/${stallId}`, {
      method: "DELETE",
    }),

  uploadImages: (stallId, files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    return fetch(`${API_BASE_URL}/stalls/${stallId}/upload-images`, {
      method: "POST",
      credentials: "include",
      body: formData,
    }).then((res) => res.json());
  },

  uploadBanner: (stallId, file) => {
    const formData = new FormData();
    formData.append("banner", file);
    return fetch(`${API_BASE_URL}/stalls/${stallId}/upload-banner`, {
      method: "POST",
      credentials: "include",
      body: formData,
    }).then((res) => res.json());
  },

  deleteImage: (stallId, publicId) =>
    api(`/stalls/${stallId}/images/${publicId}`, {
      method: "DELETE",
    }),

  updateImageCaption: (stallId, publicId, caption) =>
    api(`/stalls/${stallId}/images/${publicId}/caption`, {
      method: "PATCH",
      body: JSON.stringify({ caption }),
    }),

  reorderImages: (stallId, images) =>
    api(`/stalls/${stallId}/images/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ images }),
    }),

  uploadVideo: (stallId, file) => {
    const formData = new FormData();
    formData.append("video", file);
    return fetch(`${API_BASE_URL}/stalls/${stallId}/upload-video`, {
      method: "POST",
      credentials: "include",
      body: formData,
    }).then((res) => res.json());
  },

  uploadDocuments: (stallId, files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("documents", file));
    return fetch(`${API_BASE_URL}/stalls/${stallId}/upload-documents`, {
      method: "POST",
      credentials: "include",
      body: formData,
    }).then(async (res) => {
      const text = await res.text();

      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("Non-JSON response:", text);
        throw new Error("Server error (not JSON)");
      }
    });
  },

  deleteDocument: (stallId, publicId) => {
    return fetch(`${API_BASE_URL}/stalls/${stallId}/documents/${publicId}`, {
      method: "DELETE",
      credentials: "include",
    }).then((res) => res.json());
  },
};

// ===== USER API CALLS =====
export const userAPI = {
  getStats: () => api("/users/stats", { method: "GET" }),

  getRecentUsers: (limit = 3) =>
    api(`/users/recent?limit=${limit}`, { method: "GET" }),

  getAllUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const querySuffix = queryString ? `?${queryString}` : "";
    return api(`/users${querySuffix}`, { method: "GET" });
  },

  getById: (userId) => api(`/users/${userId}`, { method: "GET" }),

  update: (userId, userData) =>
    api(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    }),

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

  updateRole: (userId, role) =>
    api(`/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
};

// ===== SETTINGS API CALLS (Merged New Stuff) =====
export const settingsAPI = {
  getSettings: () => api("/events/admin/settings", { method: "GET" }),

  updateSystemSettings: (settings) =>
    api("/events/admin/settings/system", {
      method: "PUT",
      body: JSON.stringify(settings),
    }),

  uploadDefaultBackground: (formData) => {
    return fetch(`${API_BASE_URL}/events/admin/set-default-background`, {
      method: "POST",
      credentials: "include",
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to upload background");
      }
      return res.json();
    });
  },

  removeDefaultBackground: () =>
    api("/events/admin/settings/default-background", {
      method: "DELETE",
    }),
};
