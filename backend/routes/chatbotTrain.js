// backend/routes/chatbotTrain.js
import express from "express";
import trainChatbot from "../utils/trainChatbot.js";

const router = express.Router();

/**
 * DEV ONLY
 * Triggers embedding generation for an event
 */
router.post("/train/:eventId", async (req, res) => {
  const { eventId } = req.params;

  try {
    const output = await trainChatbot(eventId);
    res.json({
      message: "Training completed",
      eventId,
      output,
    });
  } catch (err) {
    res.status(500).json({
      error: "Training failed",
      details: err.message,
    });
  }
});

export default router;
