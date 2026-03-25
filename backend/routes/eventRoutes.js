import express from "express";
import { verifyToken } from "../middleware/AuthMiddleware.js";
import * as eventController from "../controllers/eventController.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/published", eventController.getPublishedEvents);

// Protected routes (require authentication)
router.post("/create", verifyToken, eventController.createEvent);
router.get("/my-events", verifyToken, eventController.getMyEvents);
router.get("/stats/dashboard", verifyToken, eventController.getEventStatistics);
router.get("/pending/all", verifyToken, eventController.getPendingEvents);
router.get("/:eventId", verifyToken, eventController.getEventById);
router.get("/:eventId", eventController.getEventById);

// Admin-only routes (system_admin role required)
router.patch("/:eventId/approve", verifyToken, eventController.approveEvent);
router.patch("/:eventId/reject", verifyToken, eventController.rejectEvent);

// Event creator routes
router.patch("/:eventId/publish", verifyToken, eventController.publishEvent);
router.put("/:eventId", verifyToken, eventController.updateEvent);
router.delete("/:eventId", verifyToken, eventController.deleteEvent);
router.patch("/:eventId/cancel", verifyToken, eventController.cancelEvent);

// Admin route - get all events
router.get("/", verifyToken, eventController.getAllEvents);

export default router;
