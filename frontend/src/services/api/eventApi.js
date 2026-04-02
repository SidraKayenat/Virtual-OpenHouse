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

export const fetchEventData = async (eventId) => {
  const [eventResponse, stallsResponse] = await Promise.all([
    eventAPI.getById(eventId),
    stallAPI.getEventStalls(eventId, { published: true, limit: 100 }),
  ]);

 const event = eventResponse?.data || {};
  const stalls = (stallsResponse?.data || []).map(normalizeStall);

    return {
    id: event._id,
    name: event.name,
    description: event.description,
    environmentType: event.environmentType || "indoor",
    stallCount: event.numberOfStalls || stalls.length || 0,
    liveDate: event.liveDate,
    status: event.status,
    stalls,
    rawEvent: event,
  };
};
