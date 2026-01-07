// backend/routes/chatbot.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const uploadsRoot = path.join(process.cwd(), 'uploads');

const getProjectFolder = (projectId, uploadsPath) => {
  const root = uploadsPath ? path.resolve(uploadsPath) : uploadsRoot;
  return path.join(root, projectId);
};

const ensureProjectFolder = (projectFolder, res) => {
  if (!fs.existsSync(projectFolder)) {
    res.status(404).json({
      error: 'Project files not found',
      details: `Expected files in ${projectFolder}`,
    });
    return false;
  }

  return true;
};

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
    
    const status = err.response?.status || 500;
    const details = err.response?.data || { error: "Chatbot failed", details: err.message };
    console.error("Chatbot request failed:", {
      status,
      error: details.error || err.message
    });
    res.status(status).json(details);
  }
});

router.post('/:projectId/ingest', async (req, res) => {
  const { projectId } = req.params;
  const projectFolder = getProjectFolder(projectId, req.body?.uploadsPath);

  if (!ensureProjectFolder(projectFolder, res)) {
    return;
  }

  try {
    const response = await axios.post('http://localhost:5000/ingest', {
      project_id: projectId,
      folder_path: projectFolder
    });

    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const details = err.response?.data || { error: 'Ingestion failed', details: err.message };
    console.error('Ingestion request failed:', {
      status,
      error: details.error || err.message
    });
    res.status(status).json(details);
  }
});

router.post('/:projectId/reindex', async (req, res) => {
  const { projectId } = req.params;
  const projectFolder = getProjectFolder(projectId, req.body?.uploadsPath);

  if (!ensureProjectFolder(projectFolder, res)) {
    return;
  }

  try {
    const response = await axios.post('http://localhost:5000/ingest', {
      project_id: projectId,
      folder_path: projectFolder
    });

    res.json({
      message: 'Reindex completed',
      projectId,
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