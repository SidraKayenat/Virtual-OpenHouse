// src/components/UI/StallPopup.jsx

import React, { useEffect, useState, useCallback } from "react";
import ChatbotWindow from "../Chatbot/ChatbotWindow";
import "./StallPopup.css";

const StallPopup = ({ stallData, onClose }) => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // 🔥 USE useCallback TO MEMOIZE THE FUNCTION
  const handleClose = useCallback(() => {
    setIsChatbotOpen(false);
    if (onClose) {
      onClose();
    }
  }, [onClose]); // Only recreate if onClose changes

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && stallData) {
        if (isChatbotOpen) {
          setIsChatbotOpen(false);
        } else {
          handleClose();
        }
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [stallData, isChatbotOpen, handleClose]); // 🔥 Now safe to include

  const handleOpenChatbot = () => {
    setIsChatbotOpen(true);
  };

  if (!stallData) return null;

  return (
    <>
      <div className="popup-overlay" onClick={handleClose}>
        <div className="popup-inner" onClick={(e) => e.stopPropagation()}>
          <button
            className="close-btn"
            onClick={handleClose}
            aria-label="Close"
          >
            ✕
          </button>

          <h2 className="popup-title">{stallData.name || "Stall"}</h2>

          {stallData.description && (
            <p className="popup-description">{stallData.description}</p>
          )}

          {stallData.tech && stallData.tech.length > 0 && (
            <div className="popup-section">
              <h3>Tech Stack</h3>
              <ul className="tech-list">
                {stallData.tech.map((tech, index) => (
                  <li key={index}>{tech}</li>
                ))}
              </ul>
            </div>
          )}

          {stallData.contact && (
            <div className="popup-section">
              <h3>Contact</h3>
              <p>{stallData.contact}</p>
            </div>
          )}

          <div className="popup-actions">
            <button className="action-btn" onClick={handleOpenChatbot}>
              🤖 Talk to ExpoBot
            </button>

            {stallData.website && (
              <a
                href={stallData.website}
                target="_blank"
                rel="noopener noreferrer"
                className="action-btn secondary"
              >
                🌐 Visit Website
              </a>
            )}
          </div>
        </div>
      </div>

      {isChatbotOpen && (
        <ChatbotWindow
          stallData={stallData}
          onClose={() => setIsChatbotOpen(false)}
        />
      )}
    </>
  );
};

export default StallPopup;
