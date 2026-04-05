import axios from "axios";
import {
  downloadStallFiles,
  getIngestFolderForBot,
  getStallBotId,
} from "./chatbotIngest.js";

const FLASK_BASE_URL = process.env.FLASK_URL || "http://localhost:5000";

export const ingestStallChatbot = async (eventId, stallId) => {
  const botId = getStallBotId(eventId, stallId);
  const folderPath = getIngestFolderForBot(botId);

  const { stall, downloadedCount, skippedCount, failedCount, failures } =
    await downloadStallFiles(stallId, folderPath);
  if (!downloadedCount) {
    return {
      botId,
      stall,
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

  return {
    botId,
    stall,
    downloadedCount,
    skippedCount,
    failedCount,
    failures,
    skipped: false,
    data,
  };
};

export const queryStallChatbot = async ({
  eventId,
  stallId,
  query,
  context = {},
}) => {
  const botId = getStallBotId(eventId, stallId);
  const { data } = await axios.post(`${FLASK_BASE_URL}/chat`, {
    query,
    project_id: botId,
    context,
  });

  return { ...data, botId };
};
