// backend/routes/chatbot.js
import express from "express";
import Stall from "../models/Stall.js";
import { ingestStallChatbot, queryStallChatbot } from "../utils/chatbotService.js";

const router = express.Router();

const ensureStallInEvent = async (eventId, stallId) => {
  const stall = await Stall.findOne({ _id: stallId, event: eventId }).lean();
  if (!stall) return null;
  if (!stall.isPublished || !stall.isActive) return null;
  return stall;
};

const normalizeAxiosDetails = (details) => {
  if (!details) return null;
  if (Buffer.isBuffer(details)) {
    const text = details.toString("utf8").trim();
    if (!text) return { raw: null, message: "Upstream service returned an empty response body." };
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }
  return details;
};


router.post("/events/:eventId/stalls/:stallId", async (req, res) => {
  const { query } = req.body;
  const { eventId, stallId } = req.params;

  if (!query?.trim()) {
    return res.status(400).json({ error: "Missing query" });
  }

  try {
    const stall = await ensureStallInEvent(eventId, stallId);
    if (!stall) {
      return res.status(404).json({ error: "Stall not found in this event" });
    }

        try {
      const response = await queryStallChatbot({
        eventId,
        stallId,
        query,
       context: { stallName: stall.projectTitle, eventName: String(stall.event || eventId) },

      });
      return res.json(response);
    } catch (err) {
      const status = err.response?.status;
      if (status !== 404) {
        throw err;
      }

          const ingestResult = await ingestStallChatbot(eventId, stallId);
      if (ingestResult.skipped) {
        return res.status(400).json({
          error: "This stall does not have supported documents for chatbot training yet.",
          details: ingestResult.reason,
        });
      }

      const response = await queryStallChatbot({
        eventId,
        stallId,
        query,
        context: { stallName: stall.projectTitle, eventName: String(stall.event || eventId) },
      });

      return res.json({ ...response, ingestionTriggered: true });
    }
  } catch (err) {
    return res.status(500).json({
      error: "Chatbot failed",
      details: normalizeAxiosDetails(err.response?.data) || err.message,
    });
  }
});

  router.post("/events/:eventId/stalls/:stallId/ingest", async (req, res) => {
    const { eventId, stallId } = req.params;


  try {
    const stall = await ensureStallInEvent(eventId, stallId);
    if (!stall) {
      return res.status(404).json({ error: "Stall not found in this event" });
    }

    const result = await ingestStallChatbot(eventId, stallId);
    if (result.skipped) {
      return res.status(400).json({
        error: "No supported documents available for ingestion",
        details: result.reason,
      });
    }

    return res.json({ message: "Ingestion completed", result });
  } catch (err) {
    return res.status(500).json({
      error: "Ingestion failed",
      details: normalizeAxiosDetails(err.response?.data) || err.message,
    });
  }
});

export default router;
