import express from "express";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";
import { verifyToken } from "../middleware/AuthMiddleware.js";

const notificationRoutes = express.Router();

// Get user's notifications
notificationRoutes.get("/", verifyToken, getUserNotifications);

// Mark specific notification as read
notificationRoutes.patch("/:notificationId/read", verifyToken, markAsRead);

// Mark all notifications as read
notificationRoutes.patch("/read/all", verifyToken, markAllAsRead);

// Delete notification
notificationRoutes.delete("/:notificationId", verifyToken, deleteNotification);

export default notificationRoutes;
