import { setDefaultResultOrder } from "dns";
import { setServers } from "dns";

setDefaultResultOrder("ipv4first");
setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import dotenv from "dotenv";
// This loads variables from a .env file into process.env
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import stallRoutes from "./routes/stallRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";

// app: Initializes an Express application.
const app = express();
const port = process.env.PORT || 3001;
const databaseURL = process.env.DATABASE_URL;

console.log("DATABASE_URL =", process.env.DATABASE_URL);

app.use(
  cors({
    origin: [process.env.ORIGIN], // Only allow requests from this origin (e.g., frontend at localhost:5173).
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], // Allow specified HTTP methods.
    credentials: true, // Include cookies in cross-origin requests
  }),
);

// app.use("/uploads/profiles", express.static("uploads/profiles"));
// app.use("/uploads/files", express.static("uploads/files"))
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/stalls", stallRoutes);
app.use("/api/registrations", registrationRoutes);

const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
mongoose.set("debug", true);

mongoose
  .connect(databaseURL)
  .then(() => console.log("DB Connection Successfull"))
  .catch((err) => {
    console.error("❌ MongoDB connection error");
    console.error("Name:", err.name);
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
  });

mongoose.connection.on("connecting", () => {
  console.log("🔄 MongoDB connecting...");
});

mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB connected");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB runtime error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected");
});

mongoose.connection.on("connected", () => {
  console.log("Connected to database:", mongoose.connection.db.databaseName);
});
