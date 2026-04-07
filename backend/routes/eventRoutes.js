import express from "express";
import { verifyToken } from "../middleware/AuthMiddleware.js";
import * as eventController from "../controllers/eventController.js";
import {
  uploadEventThumbnail,
  uploadEventBackground,
  uploadEventDefaultBackground,
} from "../config/cloudinary.js";

const router = express.Router();

// Public routes (no authentication required)
// Get public archived events (past events)
router.get("/public/archived", eventController.getPublicArchivedEvents);
router.get("/browse", eventController.getBrowseEvents);
router.get("/published", eventController.getPublishedEvents);
router.get("/default-backgrounds", eventController.getDefaultBackgrounds);
router.get("/public/:eventId", eventController.getPublicEventById); // ADD THIS - Public event vie

// Protected routes (require authentication)
router.post("/create", verifyToken, eventController.createEvent);
router.get("/my-events", verifyToken, eventController.getMyEvents);
router.get("/stats/dashboard", verifyToken, eventController.getEventStatistics);
router.get("/pending/all", verifyToken, eventController.getPendingEvents);
router.get("/:eventId", verifyToken, eventController.getEventById);

// Admin-only routes (system_admin role required)
router.patch("/:eventId/approve", verifyToken, eventController.approveEvent);
router.patch("/:eventId/reject", verifyToken, eventController.rejectEvent);

// Event creator routes
router.patch("/:eventId/publish", verifyToken, eventController.publishEvent);
router.put("/:eventId", verifyToken, eventController.updateEvent);
router.delete("/:eventId", verifyToken, eventController.deleteEvent);
router.patch("/:eventId/cancel", verifyToken, eventController.cancelEvent);

// ===== EVENT IMAGE UPLOAD ROUTES =====

// Upload thumbnail
router.post(
  "/:eventId/upload-thumbnail",
  verifyToken,
  uploadEventThumbnail.single("thumbnail"),
  eventController.uploadEventThumbnail,
);

// Upload custom background
router.post(
  "/:eventId/upload-background",
  verifyToken,
  uploadEventBackground.single("background"),
  eventController.uploadEventBackground,
);

// Set default backgrounds (up to 5, admin only)
router.post(
  "/admin/set-default-backgrounds",
  verifyToken,
  uploadEventDefaultBackground.array("defaultBackgrounds", 5),
  eventController.setDefaultBackgrounds,
);

// Update background type (switch between default and custom)
router.patch(
  "/:eventId/background-type",
  verifyToken,
  eventController.updateBackgroundType,
);

// Delete thumbnail
router.delete(
  "/:eventId/thumbnail",
  verifyToken,
  eventController.deleteEventThumbnail,
);

// Delete custom background
router.delete(
  "/:eventId/background",
  verifyToken,
  eventController.deleteCustomBackground,
);

// ===== EVENT REMINDER ROUTES =====
// Set a reminder for the event (24 hours before going live)
router.post(
  "/:eventId/reminder",
  verifyToken,
  eventController.setEventReminder,
);

// Remove a reminder for the event
router.delete(
  "/:eventId/reminder",
  verifyToken,
  eventController.removeEventReminder,
);

// Check if user has set a reminder
router.get(
  "/:eventId/reminder/status",
  verifyToken,
  eventController.hasUserSetReminder,
);

// ===== EVENT ARCHIVE ROUTES =====
// Toggle archive status for an event (creator only)
router.patch(
  "/:eventId/archive",
  verifyToken,
  eventController.toggleArchiveEvent,
);

// Get user's archived (past) events
router.get(
  "/archived/my-past-events",
  verifyToken,
  eventController.getArchivedEvents,
);

// Admin route - get all events
router.get("/", verifyToken, eventController.getAllEvents);

router.get(
  "/top-events",
  verifyToken,
  eventController.getTopEventsByRegistrations,
);

export default router;
