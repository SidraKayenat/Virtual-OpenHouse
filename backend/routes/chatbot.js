// backend/routes/chatbot.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { downloadEventFiles, getEventIngestFolder } = require("../chatbotIngest.js");

const triggerEventIngestion = async (eventId, ingestFolder) => {
  try {
    const { projectCount, downloadedCount, skippedCount } = await downloadEventFiles(
      eventId,
      ingestFolder
    );
    if (projectCount === 0) {
      console.warn(`No stalls found for event ${eventId}`);
      return;
    }
    if (downloadedCount === 0) {
      console.warn(`No PDF files found for event ${eventId}`);
      return;
    }

    const response = await axios.post("http://localhost:5000/ingest", {
      project_id: eventId,
      folder_path: ingestFolder,
    });

    console.log("Ingestion queued:", {
      eventId,
      status: response.status,
      projectCount,
      downloadedCount,
      skippedCount,
    });
  } catch (err) {
    const status = err.response?.status || 500;
    const details = err.response?.data || { error: "Ingestion failed", details: err.message };
    console.error("Ingestion request failed:", {
      eventId,
      status,
      error: details.error || err.message,
    });
  }
};

router.post('/:eventId', async (req, res) => {
  const { query } = req.body;
  const { eventId } = req.params;

  try {
    const response = await axios.post('http://localhost:5000/chat', {
      query,
      project_id: eventId
    });

    res.json(response.data);
  } catch (err) {
    
    const status = err.response?.status || 500;
    const details = err.response?.data || { error: "Chatbot failed", details: err.message };
    console.error("Chatbot request failed:", {
      status,
      error: details.error || err.message
    });
    res.status(status).json(details);
  }
});

router.post('/:eventId/ingest', async (req, res) => {
  const { eventId } = req.params;
  const ingestFolder = getEventIngestFolder(eventId);

  setImmediate(() => {
    triggerEventIngestion(eventId, ingestFolder);
  });

  res.status(202).json({
    message: "Ingestion queued",
    eventId,
  });
});

router.post('/:eventId/reindex', async (req, res) => {
  const { eventId } = req.params;
  const ingestFolder = getEventIngestFolder(eventId);

  try {
    const { projectCount, downloadedCount, skippedCount } = await downloadEventFiles(
      eventId,
      ingestFolder
    );
    if (projectCount === 0) {
      return res.status(404).json({
        error: "No stalls found for this event",
        details: `No projects found for event ${eventId}`,
      });
    }
    if (downloadedCount === 0) {
      return res.status(404).json({
        error: "No PDF files found for this event",
        details: `Checked ${projectCount} stalls but found no PDF documents`,
      });
    }

    const response = await axios.post("http://localhost:5000/ingest", {
      project_id: eventId,
      folder_path: ingestFolder,
    });

    res.json({
      message: 'Reindex completed',
      eventId,
      projectCount,
      downloadedCount,
      skippedCount,
      ...response.data,
    });
  } catch (err) {
    const status = err.response?.status || 500;
    const details = err.response?.data || { error: 'Reindex failed', details: err.message };
    console.error('Reindex request failed:', {
      status,
      error: details.error || err.message
    });
    res.status(status).json(details);
  }
});

module.exports = router;