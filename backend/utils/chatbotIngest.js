import axios from "axios";
import fs from "fs";
import path from "path";
import Project from "../models/Project.js";

const INGEST_ROOT = path.join(process.cwd(), "chatbot_ingest");

export const getEventIngestFolder = (eventId) => {
  const safeEventId = String(eventId).replace(/[^\w.-]/g, "_");
  return path.join(INGEST_ROOT, safeEventId);
};

const isPdfFile = (file) => {
  if (!file) return false;
  const candidates = [
    file.originalName,
    file.filename,
    file.url,
    file.fileType,
  ].filter(Boolean).join(" ").toLowerCase();
  return candidates.includes(".pdf") || candidates.includes("application/pdf");
};

const collectProjectFiles = (project) => {
  const files = [];
  if (project?.files) {
    files.push(project.files.thesis, project.files.poster);
    if (Array.isArray(project.files.additionalFiles)) {
      files.push(...project.files.additionalFiles);
    }
  }
  return files.filter(Boolean);
};

export const downloadEventFiles = async (eventId, destinationFolder) => {
  const projects = await Project.find({ openHouseId: eventId }).lean();

  fs.rmSync(destinationFolder, { recursive: true, force: true });
  fs.mkdirSync(destinationFolder, { recursive: true });

  let downloadedCount = 0;
  let skippedCount = 0;

  for (const project of projects) {
    for (const file of collectProjectFiles(project)) {
      if (!isPdfFile(file) || !file.url) {
        skippedCount++;
        continue;
      }

      const safeName = `${project._id}_${path.basename(file.url)}`.replace(/[^\w.-]/g, "_");
      const dest = path.join(destinationFolder, safeName);

      const response = await axios.get(file.url, { responseType: "arraybuffer" });
      fs.writeFileSync(dest, response.data);
      downloadedCount++;
    }
  }

  return { projectCount: projects.length, downloadedCount, skippedCount };
};
