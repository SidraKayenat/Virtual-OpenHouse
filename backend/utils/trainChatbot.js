const { exec } = require("child_process");
const path = require("path");

function trainChatbot(stallId) {
  const folderPath = path.join(__dirname, "..", "..", "uploads", stallId);

  const command = `python ../ai-chatbot/generate_embeddings.py "${folderPath}" "${stallId}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Chatbot training failed for ${stallId}:`, error.message);
      return;
    }
    console.log(`✅ Chatbot trained for ${stallId}:\n`, stdout);
  });
}

module.exports = trainChatbot;
