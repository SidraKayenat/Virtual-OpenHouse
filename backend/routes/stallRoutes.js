import express from "express";
import {
  createStall,
  getMyStalls,
  getStallById,
  getEventStalls,
  updateStall,
  publishStall,
  unpublishStall,
  deleteStall,
  toggleStallActive,
  likeStall,
  searchStalls,
  getFeaturedStalls,
  getStallStatistics,
  updateStallPosition,
} from "../controllers/stallController.js";

import {
  uploadStallImages,
  uploadStallVideo,
  uploadStallDocuments,
  uploadStallBanner,
  deleteStallImage,
  deleteStallVideo,
  deleteStallDocument,
  updateImageCaption,
  reorderImages,
} from "../controllers/fileUploadController.js";

import {
  uploadImages,
  uploadVideo,
  uploadDocument,
  uploadBanner,
} from "../config/cloudinary.js";

import { verifyToken } from "../middleware/AuthMiddleware.js";

const stallRoutes = express.Router();

// ===== HELPER: OPTIONAL AUTHENTICATION =====
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    verifyToken(req, res, next);
  } else {
    next();
  }
};

// ===== PUBLIC ROUTES (No authentication required) =====
stallRoutes.get("/event/:eventId", getEventStalls);
stallRoutes.get("/event/:eventId/search", searchStalls);
stallRoutes.get("/event/:eventId/featured", getFeaturedStalls);
stallRoutes.post("/:stallId/like", likeStall);

// ===== PROTECTED ROUTES - SPECIFIC ROUTES FIRST =====
stallRoutes.post("/create", verifyToken, createStall);
stallRoutes.get("/my-stalls", verifyToken, getMyStalls);
stallRoutes.get("/stats/dashboard", verifyToken, getStallStatistics);

// ===== SINGLE STALL ROUTE - OPTIONAL AUTH =====
stallRoutes.get("/:stallId", verifyToken, getStallById);

// ===== PROTECTED MODIFICATION ROUTES =====
stallRoutes.put("/:stallId", verifyToken, updateStall);
stallRoutes.patch("/:stallId/publish", verifyToken, publishStall);
stallRoutes.patch("/:stallId/unpublish", verifyToken, unpublishStall);
stallRoutes.patch("/:stallId/toggle-active", verifyToken, toggleStallActive);
stallRoutes.patch("/:stallId/position", verifyToken, updateStallPosition);
stallRoutes.delete("/:stallId", verifyToken, deleteStall);

// ===== FILE UPLOAD ROUTES =====
stallRoutes.post(
  "/:stallId/upload-images",
  verifyToken,
  uploadImages.array("images", 10),
  uploadStallImages,
);

stallRoutes.post(
  "/:stallId/upload-video",
  verifyToken,
  uploadVideo.single("video"),
  uploadStallVideo,
);

stallRoutes.post(
  "/:stallId/upload-documents",
  verifyToken,
  uploadDocument.array("documents", 10),
  uploadStallDocuments,
);

stallRoutes.post(
  "/:stallId/upload-banner",
  verifyToken,
  uploadBanner.single("banner"),
  uploadStallBanner,
);

stallRoutes.delete("/:stallId/images/:publicId", verifyToken, deleteStallImage);

stallRoutes.delete("/:stallId/videos/:publicId", verifyToken, deleteStallVideo);

stallRoutes.delete(
  "/:stallId/documents/:publicId",
  verifyToken,
  deleteStallDocument,
);

stallRoutes.patch(
  "/:stallId/images/:publicId/caption",
  verifyToken,
  updateImageCaption,
);

stallRoutes.patch("/:stallId/images/reorder", verifyToken, reorderImages);

export default stallRoutes;
