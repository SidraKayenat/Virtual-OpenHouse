import { exec } from "child_process";
import path from "path";
import { downloadEventFiles, getEventIngestFolder } from "./chatbotIngest.js";

export default async function trainChatbot(eventId) {
  const ingestFolder = getEventIngestFolder(eventId);
  const { projectCount, downloadedCount } = await downloadEventFiles(
    eventId,
    ingestFolder,
  );

  if (!projectCount || !downloadedCount) {
    throw new Error("Nothing to ingest");
  }

  const scriptPath = path.resolve(
    process.cwd(),
    "..",
    "ai-chatbot",
    "generate_embeddings.py",
  );

  return new Promise((resolve, reject) => {
    exec(
      `python "${scriptPath}" "${ingestFolder}" "${eventId}"`,
      (err, out) => {
        if (err) reject(err);
        else resolve(out);
      },
    );
  });
}
