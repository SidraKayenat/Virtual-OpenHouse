import express from "express";
import { verifyToken } from "../middleware/AuthMiddleware.js";
import { checkRole } from "../middleware/RoleMiddleware.js";
import * as userController from "../controllers/userController.js";

const router = express.Router();

// Public routes
router.get("/stats", userController.getUserStatistics);
router.get("/recent", userController.getRecentUsers);

// Protected routes (require authentication)
router.get("/:userId", verifyToken, userController.getUserById);
router.put("/:userId", verifyToken, userController.updateUser);

// Admin-only routes (require admin role)
router.get("/", verifyToken, checkRole("admin"), userController.getAllUsers);
router.delete(
  "/:userId",
  verifyToken,
  checkRole("admin"),
  userController.deleteUser,
);

export default router;
