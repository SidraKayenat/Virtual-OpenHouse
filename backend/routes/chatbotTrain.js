const express = require("express");
const router = express.Router();
const trainChatbot = require("../utils/trainChatbot");

router.get("/train/:stallId", async (req, res) => {
  const { stallId } = req.params;

  try {
    await trainChatbot(stallId); // await in case it's async
    res.json({ message: `Training started for stall ID: ${stallId}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to trigger training", details: err.message });
  }
});

module.exports = router;
