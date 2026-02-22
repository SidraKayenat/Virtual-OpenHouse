import express from "express";
import {
  createRegistration,
  getEventRegistrations,
  getPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  getMyRegistrations,
  getRegistrationById,
  cancelRegistration,
  updateRegistration,
  getRegistrationStatistics,
} from "../controllers/registrationController.js";
import { verifyToken } from "../middleware/AuthMiddleware.js";
import { checkRole } from "../middleware/RoleMiddleware.js";

const registrationRoutes = express.Router();

// ===== USER ROUTES (Participants/Attendees) =====

// Register for an event
registrationRoutes.post(
  "/events/:eventId/register",
  verifyToken,
  createRegistration
);

// Get my registrations
registrationRoutes.get(
  "/my-registrations",
  verifyToken,
  getMyRegistrations
);

// Get single registration
registrationRoutes.get(
  "/:registrationId",
  verifyToken,
  getRegistrationById
);

// Update registration (participant info only, when status is pending)
registrationRoutes.put(
  "/:registrationId",
  verifyToken,
  updateRegistration
);

// Cancel registration
registrationRoutes.patch(
  "/:registrationId/cancel",
  verifyToken,
  cancelRegistration
);

// ===== EVENT ADMIN ROUTES =====

// Get all registrations for an event
registrationRoutes.get(
  "/events/:eventId/all",
  verifyToken,
  getEventRegistrations
);

// Get pending registrations for an event
registrationRoutes.get(
  "/events/:eventId/pending",
  verifyToken,
  getPendingRegistrations
);

// Approve registration (assign stall number)
registrationRoutes.patch(
  "/:registrationId/approve",
  verifyToken,
  approveRegistration
);

// Reject registration
registrationRoutes.patch(
  "/:registrationId/reject",
  verifyToken,
  rejectRegistration
);

// Get registration statistics for an event
registrationRoutes.get(
  "/events/:eventId/statistics",
  verifyToken,
  getRegistrationStatistics
);

export default registrationRoutes;