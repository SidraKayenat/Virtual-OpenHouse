//backend/utils/chatbotService.js
import axios from "axios";
import crypto from "crypto";
import Stall from "../models/Stall.js";
import * as chatbotIngest from "./chatbotIngest.js";

const FLASK_BASE_URL = process.env.FLASK_URL || "http://localhost:5000";
const FALLBACK_SUPPORTED_EXTENSIONS = new Set([".pdf", ".docx", ".ppt", ".pptx"]);

const isSupportedDocFile = (file) => {
  if (typeof chatbotIngest.isSupportedDocFile === "function") {
    return chatbotIngest.isSupportedDocFile(file);
  }

  const raw = `${file?.filename || ""} ${file?.originalName || ""} ${file?.url || ""}`.toLowerCase();
  const mime = String(file?.fileType || "").toLowerCase();

  if ([...FALLBACK_SUPPORTED_EXTENSIONS].some((ext) => raw.includes(ext))) return true;
  return ["pdf", "docx", "word", "ppt", "pptx", "powerpoint"].some((token) => mime.includes(token));
};

const getSupportedDocFingerprint = (stall) => {
  const docs = (stall?.documents || [])
    .filter((file) => isSupportedDocFile(file))
    .map((file) => ({
      publicId: file?.publicId || "",
      url: file?.url || "",
      filename: file?.filename || "",
      fileType: file?.fileType || "",
      fileSize: file?.fileSize || 0,
    }))
    .sort((a, b) => `${a.publicId}:${a.filename}`.localeCompare(`${b.publicId}:${b.filename}`));

  return crypto.createHash("sha256").update(JSON.stringify(docs)).digest("hex");
};

const getIngestStatePath = (botId) =>
  path.join(chatbotIngest.getIngestFolderForBot(botId), INGEST_STATE_FILENAME);

export const ingestStallChatbot = async (eventId, stallId) => {
  const botId = chatbotIngest.getStallBotId(eventId, stallId);
  const folderPath = chatbotIngest.getIngestFolderForBot(botId);

  const { stall, downloadedCount, skippedCount, failedCount, failures } = await chatbotIngest.downloadStallFiles(
    stallId,
    folderPath,
  );
  const docFingerprint = getSupportedDocFingerprint(stall);

  if (!downloadedCount) {
    return {
      botId,
      stall,
      docFingerprint,
      downloadedCount,
      skippedCount,
      failedCount,
      failures,
      skipped: true,
      reason: failedCount
        ? "Supported documents were found, but downloads failed. Check file accessibility/permissions."
        : "No supported documents found for this stall (PDF, DOCX, PPT, PPTX)",
    };
  }

  const { data } = await axios.post(`${FLASK_BASE_URL}/ingest`, {
    project_id: botId,
    folder_path: folderPath,
  });
    await Stall.updateOne(
    { _id: stallId },
    {
      $set: {
        chatbotDocFingerprint: docFingerprint,
        chatbotLastIngestedAt: new Date(),
      },
    },
  );

  return {
    botId,
    stall,
    docFingerprint,
    downloadedCount,
    skippedCount,
    failedCount,
    failures,
    skipped: false,
    data,
  };
};

const ensureFreshStallIngestion = async (eventId, stallId) => {
  const stall = await Stall.findById(stallId)
    .select("documents chatbotDocFingerprint")
    .lean();
  if (!stall) {
    throw new Error("Stall not found");
  }

  const currentFingerprint = getSupportedDocFingerprint(stall);

  if (!stall.chatbotDocFingerprint || stall.chatbotDocFingerprint !== currentFingerprint) {
    await ingestStallChatbot(eventId, stallId);
  }
};

export const queryStallChatbot = async ({ eventId, stallId, query, context = {} }) => {
  const botId = chatbotIngest.getStallBotId(eventId, stallId);
  await ensureFreshStallIngestion(eventId, stallId);

  const { data } = await axios.post(`${FLASK_BASE_URL}/chat`, {
    query,
    project_id: botId,
    context,
  });

  return { ...data, botId };
};