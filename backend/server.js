// backend/server.js
//import express from "express";
import { setDefaultResultOrder, setServers } from "dns";
setDefaultResultOrder("ipv4first");
setServers(["8.8.8.8", "8.8.4.4"]);

import dotenv from "dotenv";
// This loads variables from a .env file into process.env
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import cron from "node-cron";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import stallRoutes from "./routes/stallRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import {
  sendEventReminders,
  updateLiveEventStatuses,
  updateCompletedEventStatuses,
  sendEventStartingSoonNotifications,
  sendReminder24hBeforeStart,
  sendReminder1hBeforeStart,
  sendEventEndedNotifications,
} from "./services/scheduledTaskService.js";
import userRoutes from "./routes/userRoutes.js";



import uploadsRoutes from "./routes/uploads.js";
import chatbotRoutes from "./routes/chatbot.js";
import chatbotTrainRoutes from "./routes/chatbotTrain.js";
// This loads variables from a .env file into process.env
dotenv.config();
// app: Initializes an Express application.
const app = express();
const port = process.env.PORT || 3001;
const databaseURL = process.env.DATABASE_URL;

app.use(
  cors({
    origin: [process.env.ORIGIN], // Only allow requests from this origin (e.g., frontend at localhost:5173).
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], // Allow specified HTTP methods.
    credentials: true, // Include cookies in cross-origin requests
  }),
);

// app.use("/uploads/profiles", express.static("uploads/profiles"));
// app.use("/uploads/files", express.static("uploads/files"))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
    app.use(cookieParser());
    app.use(express.json());
    // app.use("/api/contacts",contactsRoutes);
    // app.use("/api/messages",messagesRoutes);
    // app.use("/api/channel",channelRoutes);
    app.use('/api/auth',authRoutes);
    app.use('/api/chatbot', chatbotRoutes);
    app.use('/api/dev', chatbotTrainRoutes);
    app.use('/api/uploads', uploadsRoutes);

app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/stalls", stallRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/users", userRoutes);

const server = app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});

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
  console.log("✅ MongoDB connected to", mongoose.connection.db.databaseName);
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
    mongoose.connection.on("connected", () => {
        console.log("Connected to database:", mongoose.connection.db.databaseName);
      });





// ===== SETUP CRON JOBS FOR SCHEDULED NOTIFICATIONS =====
// Only setup cron jobs once connection is established
mongoose.connection.once("open", () => {
  console.log("🕐 Setting up scheduled notification cron jobs...");

  // Send event reminders - 24 hours before event goes live
  // Runs every hour at the top of the hour
  cron.schedule("0 * * * *", async () => {
    console.log("⏰ Running: Event reminder check...");
    try {
      const result = await sendEventReminders();
      if (result.sent > 0) {
        console.log(`✅ Sent ${result.sent} event reminder notifications`);
      } else {
        console.log("📭 No events to remind");
      }
    } catch (error) {
      console.error("❌ Error in event reminder cron job:", error);
    }
  });

  // Send event starting soon notifications - 24 hours before event starts
  // Runs every hour at the top of the hour
  cron.schedule("0 * * * *", async () => {
    console.log("⏰ Running: Event starting soon check...");
    try {
      const result = await sendEventStartingSoonNotifications();
      if (result.events > 0) {
        console.log(`✅ Sent ${result.totalNotificationsSent} event starting soon notifications for ${result.events} events`);
      } else {
        console.log("📭 No events starting soon");
      }
    } catch (error) {
      console.error("❌ Error in event starting soon cron job:", error);
    }
  });

  // Update event statuses to "live" when liveDate is reached
  // Runs every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    console.log("⏰ Running: Live event status update...");
    try {
      const result = await updateLiveEventStatuses();
      if (result.updated > 0) {
        console.log(`✅ Updated ${result.updated} events to "live" status`);
      }
    } catch (error) {
      console.error("❌ Error updating live event statuses:", error);
    }
  });

  // Update event statuses to "completed" when liveDate started AND endTime passed
  // Runs every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    console.log("⏰ Running: Completed event status update...");
    try {
      const result = await updateCompletedEventStatuses();
      if (result.updated > 0) {
        console.log(`✅ Updated ${result.updated} events to "completed" status`);
      }
    } catch (error) {
      console.error("❌ Error updating completed event statuses:", error);
    }
  });

  // Send 24-hour reminder before event starts
  // Runs every hour at the top of the hour
  cron.schedule("0 * * * *", async () => {
    console.log("⏰ Running: 24-hour event reminder check...");
    try {
      const result = await sendReminder24hBeforeStart();
      if (result.totalNotificationsSent > 0) {
        console.log(`✅ Sent ${result.totalNotificationsSent} 24-hour event reminders for ${result.events} events`);
      } else {
        console.log("📭 No 24-hour event reminders to send");
      }
    } catch (error) {
      console.error("❌ Error in 24-hour reminder cron job:", error);
    }
  });

  // Send 1-hour reminder before event starts
  // Runs every 15 minutes for better precision
  cron.schedule("*/15 * * * *", async () => {
    console.log("⏰ Running: 1-hour event reminder check...");
    try {
      const result = await sendReminder1hBeforeStart();
      if (result.totalNotificationsSent > 0) {
        console.log(`✅ Sent ${result.totalNotificationsSent} 1-hour event reminders for ${result.events} events`);
      } else {
        console.log("📭 No 1-hour event reminders to send");
      }
    } catch (error) {
      console.error("❌ Error in 1-hour reminder cron job:", error);
    }
  });

  // Send event ended notifications
  // Runs every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    console.log("⏰ Running: Event ended notification check...");
    try {
      const result = await sendEventEndedNotifications();
      if (result.totalNotificationsSent > 0) {
        console.log(`✅ Sent ${result.totalNotificationsSent} event ended notifications for ${result.events} events`);
      } else {
        console.log("📭 No event ended notifications to send");
      }
    } catch (error) {
      console.error("❌ Error in event ended notification cron job:", error);
    }
  });

  console.log("✅ All cron jobs initialized successfully!");
});
