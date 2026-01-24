import express from "express";
import {
  createEvent,
  getAllEvents,
  getPendingEvents,
  approveEvent,
  rejectEvent,
  publishEvent,
  getPublishedEvents,
  getEventById,
  getMyEvents,
  updateEvent,
  deleteEvent,
  cancelEvent,
  getEventStatistics,
} from "../controllers/eventController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
//import { authorizeRoles } from "../middleware/roleMiddleware.js";

const eventRoutes = express.Router();

// ===== PUBLIC ROUTES =====
// Anyone can view published events
eventRoutes.get("/published", getPublishedEvents);
eventRoutes.get("/:eventId", getEventById); // Single event details

// ===== PROTECTED ROUTES (All require authentication) =====

// --- EVENT ADMIN ROUTES ---
// Create event request (Event Admin only)
eventRoutes.post(
  "/create",
  verifyToken,
 // authorizeRoles("event_admin"),
  createEvent
);

// Get my events (Event Admin only)
eventRoutes.get(
  "/my-events",
  verifyToken,
 // authorizeRoles("event_admin"),
  getMyEvents
);

// Update event (Event Admin - own events only)
eventRoutes.put(
  "/:eventId",
  verifyToken,
 // authorizeRoles("event_admin"),
  updateEvent
);

// Publish event (Event Admin - own approved events)
eventRoutes.patch(
  "/:eventId/publish",
  verifyToken,
 // authorizeRoles("event_admin"),
  publishEvent
);

// Cancel event (Event Admin - own events)
eventRoutes.patch(
  "/:eventId/cancel",
  verifyToken,
 // authorizeRoles("event_admin"),
  cancelEvent
);

// --- SYSTEM ADMIN ROUTES ---
// Get all events (System Admin only)
eventRoutes.get(
  "/",
  verifyToken,
 // authorizeRoles("system_admin"),
  getAllEvents
);

// Get pending events for approval (System Admin only)
eventRoutes.get(
  "/pending/all",
  verifyToken,
 // authorizeRoles("system_admin"),
  getPendingEvents
);

// Approve event (System Admin only)
eventRoutes.patch(
  "/:eventId/approve",
  verifyToken,
 // authorizeRoles("system_admin"),
  approveEvent
);

// Reject event (System Admin only)
eventRoutes.patch(
  "/:eventId/reject",
  verifyToken,
 // authorizeRoles("system_admin"),
  rejectEvent
);

// Delete event (System Admin or Event Admin)
eventRoutes.delete(
  "/:eventId",
  verifyToken,
 // authorizeRoles("system_admin", "event_admin"),
  deleteEvent
);

// --- STATISTICS ROUTE (Admin Dashboard) ---
eventRoutes.get(
  "/stats/dashboard",
  verifyToken,
 // authorizeRoles("system_admin", "event_admin"),
  getEventStatistics
);

export default eventRoutes;