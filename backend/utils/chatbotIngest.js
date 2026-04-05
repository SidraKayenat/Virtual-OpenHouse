import axios from "axios";
import fs from "fs";
import path from "path";
import Stall from "../models/Stall.js";

const INGEST_ROOT = path.join(process.cwd(), "chatbot_ingest");

const SUPPORTED_EXTENSIONS = new Set([".pdf", ".docx", ".ppt", ".pptx"]);

const getFileExtension = (value) => {
  if (!value) return "";
  const normalized = String(value).toLowerCase().split(/[?#]/)[0];
  const ext = path.extname(normalized);
  return ext && SUPPORTED_EXTENSIONS.has(ext) ? ext : "";
};

const inferExtension = (file) => {
  const directChecks = [
    getFileExtension(file?.filename),
    getFileExtension(file?.originalName),
    getFileExtension(file?.url),
  ];
  const matchedDirect = directChecks.find(Boolean);
  if (matchedDirect) return matchedDirect;

  const type = String(file?.fileType || "").toLowerCase();
  if (type.includes("pdf")) return ".pdf";
  if (type.includes("docx") || type.includes("word")) return ".docx";
  if (
    type.includes("pptx") ||
    type.includes("ppt") ||
    type.includes("powerpoint")
  )
    return ".pptx";
  return "";
};

const isSupportedDocFile = (file) => {
  if (!file) return false;
  return Boolean(inferExtension(file));
};

const safe = (value) => String(value).replace(/[^\w.-]/g, "_");

export const getStallBotId = (eventId, stallId) =>
  `${safe(eventId)}__${safe(stallId)}`;

export const getIngestFolderForBot = (botId) =>
  path.join(INGEST_ROOT, safe(botId));

export const getEventIngestFolder = (eventId) =>
  getIngestFolderForBot(`event_${eventId}`);

const downloadFile = async (url, destination) => {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(destination, response.data);
};

export const downloadStallFiles = async (stallId, destinationFolder) => {
  const stall = await Stall.findById(stallId).lean();
  if (!stall) {
    throw new Error("Stall not found");
  }

  fs.rmSync(destinationFolder, { recursive: true, force: true });
  fs.mkdirSync(destinationFolder, { recursive: true });

  let downloadedCount = 0;
  let skippedCount = 0;

  for (const file of stall.documents || []) {
    if (!isSupportedDocFile(file) || !file.url) {
      skippedCount++;
      continue;
    }

    const ext = inferExtension(file);
    const originalBase = path
      .basename(String(file.filename || file.url || "document"))
      .split(/[?#]/)[0];
    const nameWithoutExt =
      path.basename(originalBase, path.extname(originalBase)) ||
      `document_${downloadedCount + 1}`;
    const safeName = `${safe(stall._id)}_${safe(nameWithoutExt)}${ext}`;
    const dest = path.join(destinationFolder, safeName);

    await downloadFile(file.url, dest);
    downloadedCount++;
  }

  return { stall, downloadedCount, skippedCount };
};

export const downloadEventFiles = async (eventId, destinationFolder) => {
  const stalls = await Stall.find({ event: eventId }).lean();

  fs.rmSync(destinationFolder, { recursive: true, force: true });
  fs.mkdirSync(destinationFolder, { recursive: true });

  let downloadedCount = 0;
  let skippedCount = 0;

  for (const stall of stalls) {
    for (const file of stall.documents || []) {
      if (!isSupportedDocFile(file) || !file.url) {
        skippedCount++;
        continue;
      }

      const ext = inferExtension(file);
      const originalBase = path
        .basename(String(file.filename || file.url || "document"))
        .split(/[?#]/)[0];
      const nameWithoutExt =
        path.basename(originalBase, path.extname(originalBase)) ||
        `document_${downloadedCount + 1}`;
      const safeName = `${safe(stall._id)}_${safe(nameWithoutExt)}${ext}`;
      const dest = path.join(destinationFolder, safeName);

      await downloadFile(file.url, dest);
      downloadedCount++;
    }
  }

  return { projectCount: stalls.length, downloadedCount, skippedCount };
};
