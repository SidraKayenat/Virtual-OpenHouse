// src/components/Chatbot/TypingIndicator.jsx

import React from "react";

const TypingIndicator = () => {
  return (
    <div className="chat-message bot-message">
      <div className="message-avatar">🤖</div>
      <div className="message-content">
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
