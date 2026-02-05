// src/components/Chatbot/ChatMessage.jsx

import React from "react";

const ChatMessage = ({ message }) => {
  const isBot = message.sender === "bot";

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className={`chat-message ${isBot ? "bot-message" : "user-message"}`}>
      {isBot && <div className="message-avatar">🤖</div>}

      <div className="message-content">
        <div className="message-bubble">{message.text}</div>
        <span className="message-time">{formatTime(message.timestamp)}</span>
      </div>
    </div>
  );
};

export default ChatMessage;
