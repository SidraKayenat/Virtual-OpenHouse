// backend/routes/chatbot.js
import express from "express";
import axios from "axios";
import {
  downloadEventFiles,
  getEventIngestFolder
} from "../utils/chatbotIngest.js";

const router = express.Router();

const FLASK_BASE_URL = process.env.FLASK_URL || "http://localhost:5000";

const triggerEventIngestion = async (eventId, ingestFolder) => {
  try {
    const { projectCount, downloadedCount, skippedCount } =
      await downloadEventFiles(eventId, ingestFolder);

    if (projectCount === 0 || downloadedCount === 0) {
      console.warn("Nothing to ingest", { eventId, projectCount, downloadedCount });
      return;
    }

    await axios.post(`${FLASK_BASE_URL}/ingest`, {
      project_id: eventId,
      folder_path: ingestFolder,
    });

    console.log("Ingestion queued", { eventId, projectCount, downloadedCount, skippedCount });
  } catch (err) {
    console.error("Ingestion request failed", {
      eventId,
      error: err.response?.data || err.message,
    });
  }
};

router.post("/:eventId", async (req, res) => {
  const { query } = req.body;
  const { eventId } = req.params;

  try {
    const response = await axios.post(`${FLASK_BASE_URL}/chat`, {
      query,
      project_id: eventId,
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({
      error: "Chatbot failed",
      details: err.response?.data || err.message,
    });
  }
});

router.post("/:eventId/ingest", async (req, res) => {
  const { eventId } = req.params;
  const ingestFolder = getEventIngestFolder(eventId);

  setImmediate(() => triggerEventIngestion(eventId, ingestFolder));

  res.status(202).json({ message: "Ingestion queued", eventId });
});

export default router;
