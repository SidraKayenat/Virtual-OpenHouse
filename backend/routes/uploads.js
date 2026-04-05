import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";

const router = express.Router();
const uploadsRoot = path.join(process.cwd(), "uploads");

const getProjectFolder = (projectId, uploadsPath) => {
  const root = uploadsPath ? path.resolve(uploadsPath) : uploadsRoot;
  return path.join(root, projectId);
};

const ensureProjectFolder = (projectFolder, res) => {
  if (!fs.existsSync(projectFolder)) {
    res.status(404).json({
      error: "Project files not found",
      details: `Expected files in ${projectFolder}`,
    });
    return false;
  }

  return true;
};

const triggerIngestion = (projectId, projectFolder) => {
  axios
    .post("http://localhost:5000/ingest", {
      project_id: projectId,
      folder_path: projectFolder,
    })
    .then((response) => {
      console.log("Ingestion queued:", {
        projectId,
        status: response.status,
      });
    })
    .catch((err) => {
      const status = err.response?.status || 500;
      const details = err.response?.data || {
        error: "Ingestion failed",
        details: err.message,
      };
      console.error("Ingestion request failed:", {
        projectId,
        status,
        error: details.error || err.message,
      });
    });
};

router.post("/projects/:projectId/ingest", (req, res) => {
  const { projectId } = req.params;
  const projectFolder = getProjectFolder(projectId, req.body?.uploadsPath);

  if (!ensureProjectFolder(projectFolder, res)) {
    return;
  }

  triggerIngestion(projectId, projectFolder);

  res.status(202).json({
    message: "Ingestion queued",
    projectId,
  });
});

export default router;
