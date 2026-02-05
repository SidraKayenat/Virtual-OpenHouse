// src/components/Chatbot/ChatInput.jsx

import React, { useState } from "react";

const ChatInput = ({ onSendMessage, disabled }) => {
  const [inputText, setInputText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() && !disabled) {
      onSendMessage(inputText);
      setInputText("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="chatbot-input-area" onSubmit={handleSubmit}>
      <input
        type="text"
        className="chatbot-input"
        placeholder="Type your message..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled}
      />
      <button
        type="submit"
        className="chatbot-send-btn"
        disabled={!inputText.trim() || disabled}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </form>
  );
};

export default ChatInput;
