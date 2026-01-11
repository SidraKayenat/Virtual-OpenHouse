const { exec } = require("child_process");
const path = require("path");
const { downloadEventFiles, getEventIngestFolder } = require("../chatbotIngest.js");

function trainChatbot(eventId) {
  const ingestFolder = getEventIngestFolder(eventId);

  return downloadEventFiles(eventId, ingestFolder).then(
    ({ projectCount, downloadedCount }) => {
      if (projectCount === 0) {
        throw new Error(`No stalls found for event ${eventId}`);
      }
      if (downloadedCount === 0) {
        throw new Error(`No PDF files found for event ${eventId}`);
      }

      const scriptPath = path.resolve(
        process.cwd(),
        "..",
        "ai-chatbot",
        "generate_embeddings.py"
      );
      const command = `python "${scriptPath}" "${ingestFolder}" "${eventId}"`;

      return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(stdout || stderr);
        });
      });
    }
  );
}

module.exports = trainChatbot;