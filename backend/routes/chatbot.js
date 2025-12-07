// backend/routes/chatbot.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/:projectId', async (req, res) => {
  const { query } = req.body;
  const { projectId } = req.params;

  try {
    const response = await axios.post('http://localhost:5000/chat', {
      query,
      project_id: projectId
    });

    res.json(response.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Chatbot failed", details: err.message });
  }
});

module.exports = router;
