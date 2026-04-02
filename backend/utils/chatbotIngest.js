import axios from "axios";
import fs from "fs";
import path from "path";
import Stall from "../models/Stall.js";

const INGEST_ROOT = path.join(process.cwd(), "chatbot_ingest");

const isPdfFile = (file) => {
  if (!file) return false;
    const candidates = [file.filename, file.originalName, file.url, file.fileType]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return candidates.includes(".pdf") || candidates.includes("application/pdf") || candidates.includes("pdf");
};

    const safe = (value) => String(value).replace(/[^\w.-]/g, "_");

    export const getStallBotId = (eventId, stallId) => `${safe(eventId)}__${safe(stallId)}`;

    export const getIngestFolderForBot = (botId) => path.join(INGEST_ROOT, safe(botId));

    export const getEventIngestFolder = (eventId) => getIngestFolderForBot(`event_${eventId}`);

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
    if (!isPdfFile(file) || !file.url) {
      skippedCount++;
      continue;
    }
    
    const safeName = `${safe(stall._id)}_${path.basename(file.url)}`.replace(/[^\w.-]/g, "_");
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
      if (!isPdfFile(file) || !file.url) {
        skippedCount++;
        continue;
      }

      const safeName = `${safe(stall._id)}_${path.basename(file.url)}`.replace(/[^\w.-]/g, "_");
      const dest = path.join(destinationFolder, safeName);

      await downloadFile(file.url, dest);
      downloadedCount++;
    }
  }

  return { projectCount: stalls.length, downloadedCount, skippedCount };
};
