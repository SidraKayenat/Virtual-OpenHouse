// src/components/UI/StallPopup.jsx

import React from "react";
import "./StallPopup.css";

const StallPopup = ({ stallData, onClose }) => {
  if (!stallData) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-inner" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <h2>{stallData.name}</h2>
        <p>{stallData.description}</p>

        {stallData.tech && (
          <div className="popup-section">
            <h3>Tech Stack</h3>
            <ul>
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
          <button className="action-btn">🤖 Talk to ExpoBot</button>
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
  );
};

export default StallPopup;
