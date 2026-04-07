// frontend/src/components/Chatbot/ChatbotWindow.jsx

import React, { useState, useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import { sendMessageToBot } from "./chatbotService";
import "./Chatbot.css";

const ChatbotWindow = ({ stallData, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      text: `Hi! I'm ExpoBot. Ask me anything about ${stallData?.name || "this stall"}!`,
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle sending messages
  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    // Add user message immediately
    const userMessage = {
      id: `user-${Date.now()}`,
      text: text.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // 🔥 YOUR TEAMMATE WILL IMPLEMENT THIS FUNCTION
      const botResponse = await sendMessageToBot(text, stallData);

      // Add bot response
      const botMessage = {
        id: `bot-${Date.now()}`,
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      const reason = error?.message ? ` (${error.message})` : "";

      // Error message
      const errorMessage = {
        id: `error-${Date.now()}`,
        text: `Sorry, I'm having trouble connecting. Please try again!${reason}`,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chatbot-overlay" onClick={onClose}>
      <div className="chatbot-window" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="bot-avatar">🤖</div>
            <div>
              <h3>ExpoBot</h3>
              <p className="bot-status">
                <span className="status-dot"></span>
                Online
              </p>
            </div>
          </div>
          <button className="chatbot-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Messages Area */}
        <div className="chatbot-messages">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isTyping && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
      </div>
    </div>
  );
};

export default ChatbotWindow;
