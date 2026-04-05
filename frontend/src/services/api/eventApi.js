// src/services/api/eventApi.js
import { eventAPI, stallAPI } from "@/lib/api";

const normalizeStall = (stall) => ({
  id: stall._id,
  eventId: stall.event?._id || stall.event,
  name: stall.projectTitle || `Stall ${stall.stallNumber}`,
  description: stall.projectDescription || "No description available",
  tech: Array.isArray(stall.tags) ? stall.tags : [],
  contact:
    stall.teamMembers?.[0]?.contactInfo?.email ||
    stall.owner?.email ||
    "No contact provided",
  website: stall.teamMembers?.[0]?.contactInfo?.website || "",
  teamMembers: stall.teamMembers || [],
  category: stall.category,
  media: {
    images: stall.images || [],
    videos: stall.videos || [],
    documents: stall.documents || [],
    bannerImage: stall.bannerImage || null,
  },
  raw: stall,
});

// ===== PUBLIC VERSION - No authentication required =====
export const fetchPublicEventData = async (eventId) => {
  try {
    // Use public event endpoint (no auth required)
    const eventResponse = await eventAPI.getPublicById(eventId);
    const event = eventResponse?.data || eventResponse || {};

    // Stall endpoint is already public in your backend (line 29 in stallRoutes)
    const stallsResponse = await stallAPI.getEventStalls(eventId, {
      published: true,
      limit: 100,
    });

    // ADD THESE:
    console.log("Raw stalls from API:", stallsResponse?.data || stallsResponse);
    console.log(
      "Total stalls count:",
      (stallsResponse?.data || stallsResponse)?.length,
    );
    const stalls = (stallsResponse?.data || stallsResponse || [])
      .filter((s) => s.status === "approved" || s.isPublished === true)
      .map(normalizeStall);

    console.log(
      "Normalized stalls:",
      stalls.map((s) => ({
        id: s.id,
        name: s.name,
        raw_isPublished: s.raw?.isPublished,
        raw_isActive: s.raw?.isActive,
      })),
    );
    return {
      id: event._id,
      name: event.name,
      description: event.description,
      environmentType: event.environmentType || "indoor",
      backgroundType: event.backgroundType || "default",
      customBackground: event.customBackground || null,
      stallCount: event.numberOfStalls || stalls.length || 0,
      liveDate: event.liveDate,
      status: event.status,
      stalls,
      rawEvent: event,
    };
  } catch (error) {
    console.error("Error fetching public event data:", error);
    throw error;
  }
};

// ===== AUTHENTICATED VERSION - Requires login (for editing, managing) =====
export const fetchAuthenticatedEventData = async (eventId) => {
  try {
    const [eventResponse, stallsResponse] = await Promise.all([
      eventAPI.getById(eventId),
      stallAPI.getEventStalls(eventId, { limit: 100 }),
    ]);

    const event = eventResponse?.data || {};
    const stalls = (stallsResponse?.data || stallsResponse || [])
      .filter((s) => s.status === "approved" || s.isPublished === true)
      .map(normalizeStall);

    return {
      id: event._id,
      name: event.name,
      description: event.description,
      environmentType: event.environmentType || "indoor",
      backgroundType: event.backgroundType || "default", // ADD THIS
      customBackground: event.customBackground || null, // ADD THIS
      stallCount: event.numberOfStalls || stalls.length || 0,
      liveDate: event.liveDate,
      status: event.status,
      stalls,
      rawEvent: event,
    };
  } catch (error) {
    console.error("Error fetching authenticated event data:", error);
    throw error;
  }
};

// ===== SMART FETCH - Tries public first, then authenticated if available =====
export const fetchEventData = async (eventId, user = null) => {
  try {
    // First try public (always works for published events)
    const publicData = await fetchPublicEventData(eventId);

    // If user is logged in, also try to get user-specific data
    if (user) {
      try {
        const authenticatedData = await fetchAuthenticatedEventData(eventId);
        // Merge user-specific data (like registration status)
        return {
          ...publicData,
          userRegistration: authenticatedData.userRegistration,
          userStalls: authenticatedData.userStalls,
        };
      } catch (authError) {
        console.warn("Could not fetch authenticated data:", authError);
        // Still return public data even if authenticated fetch fails
        return publicData;
      }
    }

    return publicData;
  } catch (error) {
    console.error("Failed to fetch event data:", error);
    throw error;
  }
};

// ===== For backward compatibility - use public version by default =====
export const fetchEventDataPublic = fetchPublicEventData;
