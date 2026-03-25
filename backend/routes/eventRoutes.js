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
router.get("/published", eventController.getPublishedEvents);
router.get("/default-background", eventController.getDefaultBackground);
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
  eventController.uploadEventThumbnail
);

// Upload custom background
router.post(
  "/:eventId/upload-background",
  verifyToken,
  uploadEventBackground.single("background"),
  eventController.uploadEventBackground
);

// Set default background (admin only)
router.post(
  "/admin/set-default-background",
  verifyToken,
  uploadEventDefaultBackground.single("defaultBackground"),
  eventController.setDefaultBackground
);

// Update background type (switch between default and custom)
router.patch(
  "/:eventId/background-type",
  verifyToken,
  eventController.updateBackgroundType
);

// Delete thumbnail
router.delete(
  "/:eventId/thumbnail",
  verifyToken,
  eventController.deleteEventThumbnail
);

// Delete custom background
router.delete(
  "/:eventId/background",
  verifyToken,
  eventController.deleteCustomBackground
);

// Admin route - get all events
router.get("/", verifyToken, eventController.getAllEvents);

export default router;
