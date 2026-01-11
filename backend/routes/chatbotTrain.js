const express = require("express");
const router = express.Router();
const trainChatbot = require("../utils/trainChatbot");

router.get("/train/:eventId", async (req, res) => {
  const { eventId } = req.params;

  try {
    const output = await trainChatbot(eventId);
    res.json({ message: `Training completed for event ID: ${eventId}`, output });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to trigger training", details: err.message });
  }
});

module.exports = router;