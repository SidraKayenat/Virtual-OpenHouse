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

  const { stall, downloadedCount, skippedCount } = await downloadStallFiles(stallId, folderPath);

  if (!downloadedCount) {
    return {
      botId,
      stall,
      downloadedCount,
      skippedCount,
      skipped: true,
      reason: "No PDF documents found for this stall",
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
    skipped: false,
    data,
  };
};

export const queryStallChatbot = async ({ eventId, stallId, query, context = {} }) => {
  const botId = getStallBotId(eventId, stallId);

  const systemPrefix = [
    `You are answering questions for stall \"${context.stallName || "Unknown Stall"}\" in event \"${context.eventName || "Unknown Event"}\".`,
    `Only answer about this stall and its project. If asked about another stall, explain your scope is limited to this stall.`,
  ].join(" ");

  const scopedQuery = `${systemPrefix}\n\nUser question: ${query}`;

  const { data } = await axios.post(`${FLASK_BASE_URL}/chat`, {
    query: scopedQuery,
    project_id: botId,
  });

  return { ...data, botId };
};