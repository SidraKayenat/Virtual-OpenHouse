// src/components/Chatbot/ChatMessage.jsx

import React from "react";

const ChatMessage = ({ message }) => {
  const isBot = message.sender === "bot";
  const normalizedText = String(message?.text || "")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "  ");

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderFormattedText = (text) => {
    const lines = text.split("\n");
    return lines.map((line, lineIndex) => {
      const parts = [];
      const boldRegex = /\*\*(.+?)\*\*/g;
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.slice(lastIndex, match.index));
        }
        parts.push(
          <strong key={`bold-${lineIndex}-${match.index}`}>{match[1]}</strong>,
        );
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < line.length) {
        parts.push(line.slice(lastIndex));
      }

      return (
        <React.Fragment key={`line-${lineIndex}`}>
          {parts}
          {lineIndex < lines.length - 1 ? <br /> : null}
        </React.Fragment>
      );
    });
  };

  return (
    <div className={`chat-message ${isBot ? "bot-message" : "user-message"}`}>
      {isBot && <div className="message-avatar">🤖</div>}

      <div className="message-content">
        <div className="message-bubble">{renderFormattedText(normalizedText)}</div>
        <span className="message-time">{formatTime(message.timestamp)}</span>
      </div>
    </div>
  );
};

export default ChatMessage;
