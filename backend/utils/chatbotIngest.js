const axios = require("axios");
const fs = require("fs");
const path = require("path");
const Project = require("../models/Project");

const INGEST_ROOT = path.join(process.cwd(), "chatbot_ingest");

const getEventIngestFolder = (eventId) => {
  const safeEventId = String(eventId).replace(/[^\w.-]/g, "_");
  return path.join(INGEST_ROOT, safeEventId);
};

const isPdfFile = (file) => {
  if (!file) {
    return false;
  }
  const candidates = [
    file.originalName,
    file.filename,
    file.url,
    file.fileType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return candidates.includes(".pdf") || candidates.includes("application/pdf");
};

const getFileName = (file, fallback) => {
  if (file?.originalName) {
    return file.originalName;
  }
  if (file?.filename) {
    return file.filename;
  }
  if (file?.url) {
    try {
      return path.basename(new URL(file.url).pathname);
    } catch (error) {
      return fallback;
    }
  }
  return fallback;
};

const collectProjectFiles = (project) => {
  const fileEntries = [];
  if (project?.files) {
    fileEntries.push(project.files.thesis);
    fileEntries.push(project.files.demoVideo);
    fileEntries.push(project.files.poster);
    if (Array.isArray(project.files.additionalFiles)) {
      fileEntries.push(...project.files.additionalFiles);
    }
  }
  return fileEntries.filter(Boolean);
};

const downloadEventFiles = async (eventId, destinationFolder) => {
  const projects = await Project.find({ openHouseId: eventId }).lean();
  fs.rmSync(destinationFolder, { recursive: true, force: true });
  fs.mkdirSync(destinationFolder, { recursive: true });

  let downloadedCount = 0;
  let skippedCount = 0;

  for (const project of projects) {
    const entries = collectProjectFiles(project);
    let fileIndex = 0;
    for (const entry of entries) {
      if (!isPdfFile(entry)) {
        skippedCount += 1;
        continue;
      }
      if (!entry.url) {
        skippedCount += 1;
        continue;
      }
      fileIndex += 1;
      const baseName = getFileName(entry, `${project._id}-${fileIndex}.pdf`);
      const safeName = String(baseName).replace(/[^\w.-]/g, "_");
      const fileName = safeName.toLowerCase().endsWith(".pdf")
        ? safeName
        : `${safeName}.pdf`;
      const destinationPath = path.join(destinationFolder, `${project._id}_${fileName}`);

      const response = await axios.get(entry.url, {
        responseType: "arraybuffer",
        timeout: 30000,
      });
      fs.writeFileSync(destinationPath, response.data);
      downloadedCount += 1;
    }
  }

  return {
    projectCount: projects.length,
    downloadedCount,
    skippedCount,
  };
};

module.exports = {
  downloadEventFiles,
  getEventIngestFolder,
};