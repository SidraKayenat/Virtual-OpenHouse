// import express from "express";
// import {
//   registerAdmin,
//   loginAdmin,
//   getCurrentAdmin,
//   deleteAdmin,
//   logoutAdmin,
// } from "../controllers/authController.js";
// import { verifyToken } from "../middleware/AuthMiddleware.js";
// //import { protect } from "../middleware/AuthMiddleware.js";

// const authRoutes = express.Router();

// authRoutes.post("/register", registerAdmin);     
// authRoutes.post("/login", loginAdmin);
// authRoutes.get("/me", protect, getCurrentAdmin);
// authRoutes.delete("/delete", protect, deleteAdmin);
// authRoutes.post("/logout", protect, logoutAdmin);

// export default authRoutes;


import express from "express";
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/AuthMiddleware.js";

const authRoutes = express.Router();

// Public routes
authRoutes.post("/register", register);
authRoutes.post("/login", login);

// Protected routes (all require verifyToken)
authRoutes.post("/logout", verifyToken, logout);
authRoutes.get("/profile", verifyToken, getProfile);
authRoutes.put("/profile", verifyToken, updateProfile);
authRoutes.put("/change-password", verifyToken, changePassword);

export default authRoutes;