// src/components/UI/StallPopup.jsx

import React, { useEffect, useState, useCallback, useRef } from "react";
import ChatbotWindow from "../Chatbot/ChatbotWindow";
import { stallAPI } from "@/lib/api";
import "./StallPopup.css";

/* ─────────────────────────────────────────────
   LIGHTBOX COMPONENT
───────────────────────────────────────────── */
const Lightbox = ({ images, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft")
        setIdx((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, onClose]);

  const img = images[idx];
  return (
    <div className="popup-lightbox-overlay" onClick={onClose}>
      <button
        className="popup-modal-close"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        ✕
      </button>

      {images.length > 1 && (
        <>
          <button
            className="popup-lightbox-nav prev"
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => (i - 1 + images.length) % images.length);
            }}
          >
            ‹
          </button>
          <button
            className="popup-lightbox-nav next"
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => (i + 1) % images.length);
            }}
          >
            ›
          </button>
        </>
      )}

      <img
        src={img.url}
        alt={img.caption || "Stall image"}
        className="popup-lightbox-img"
        onClick={(e) => e.stopPropagation()}
      />

      {img.caption && <p className="popup-lightbox-caption">{img.caption}</p>}

      {images.length > 1 && (
        <p className="popup-lightbox-counter">
          {idx + 1} / {images.length} · ← → to navigate · Esc to close
        </p>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   VIDEO MODAL COMPONENT
───────────────────────────────────────────── */
const VideoModal = ({ video, onClose }) => {
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.play().catch(() => {});
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="popup-video-overlay" onClick={onClose}>
      <button className="popup-modal-close" onClick={onClose}>
        ✕
      </button>
      <video
        ref={ref}
        src={video.url}
        controls
        className="popup-video-player"
        onClick={(e) => e.stopPropagation()}
      />
      {video.title && <p className="popup-video-title">{video.title}</p>}
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN POPUP COMPONENT
───────────────────────────────────────────── */
const StallPopup = ({ stallData, onClose }) => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [fullStall, setFullStall] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);

  const handleClose = useCallback(() => {
    setIsChatbotOpen(false);
    if (onClose) onClose();
  }, [onClose]);

  useEffect(() => {
    if (!stallData?.id) return;
    setLoading(true);
    stallAPI
      .getById(stallData.id)
      .then((res) => {
        const raw = res?.data || res || {};
        console.log("FULL STALL DATA:", raw);
        setFullStall(raw);
      })
      .catch((err) => {
        console.log("ERROR FETCHING STALL:", err);
        setFullStall(null);
      })
      .finally(() => setLoading(false));
  }, [stallData?.id]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && stallData) {
        if (lightboxIdx !== null) return;
        if (activeVideo) return;
        if (isChatbotOpen) {
          setIsChatbotOpen(false);
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [stallData, isChatbotOpen, handleClose, lightboxIdx, activeVideo]);

  if (!stallData) return null;

  const d = fullStall || stallData.raw || stallData;

  const name = d.projectTitle || stallData.name || "Stall";
  const description = d.projectDescription || stallData.description || "";
  const category = d.category || stallData.category;
  const tags = Array.isArray(d.tags) ? d.tags : stallData.tech || [];
  const teamMembers = d.teamMembers || stallData.teamMembers || [];
  const contact = stallData.contact;
  const website = stallData.website;

  const bannerUrl =
    d.bannerImage?.url || stallData.media?.bannerImage?.url || null;
  const images = d.images || stallData.media?.images || [];
  const videos =
    (d.videos && d.videos.length > 0
      ? d.videos
      : d.documents?.filter((doc) => doc.url?.match(/\.(mp4|webm|ogg)$/i))) ||
    [];

  console.log("DOCUMENTS:", d.documents);

  return (
    <>
      {/* ── MAIN POPUP ── */}
      <div className="popup-overlay" onClick={handleClose}>
        <div className="popup-card" onClick={(e) => e.stopPropagation()}>
          {/* Banner */}
          {bannerUrl ? (
            <img src={bannerUrl} alt="Banner" className="popup-banner" />
          ) : (
            <div className="popup-banner-placeholder">🏛️</div>
          )}

          {/* Close */}
          <button
            className="popup-close-btn"
            onClick={handleClose}
            aria-label="Close"
          >
            ✕
          </button>

          <div className="popup-body">
            {/* Title */}
            <h2 className="popup-title">{name}</h2>

            {/* Category */}
            {category && (
              <span className="popup-category-badge">{category}</span>
            )}

            {/* Description */}
            {description && <p className="popup-description">{description}</p>}

            {/* Loading */}
            {loading && <div className="popup-loading-box">Loading media…</div>}

            {/* ── IMAGES ── */}
            {images.length > 0 && (
              <div className="popup-section">
                <p className="popup-section-title">Photos ({images.length})</p>
                <div className="popup-img-grid">
                  {images.map((img, i) => (
                    <img
                      key={img.publicId || i}
                      src={img.url}
                      alt={img.caption || `Photo ${i + 1}`}
                      className="popup-img-thumb"
                      title={img.caption}
                      onClick={() => setLightboxIdx(i)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── VIDEOS ── */}
            {videos.length > 0 && (
              <div className="popup-section">
                <p className="popup-section-title">Videos ({videos.length})</p>
                <div className="popup-img-grid">
                  {videos.map((vid, i) => (
                    <div
                      key={vid.publicId || i}
                      className="popup-video-wrapper"
                      onClick={() => setActiveVideo(vid)}
                    >
                      <video
                        src={vid.url}
                        className="popup-video-thumb"
                        muted
                        preload="metadata"
                      />
                      <div className="popup-video-play-icon">▶</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAGS ── */}
            {tags.length > 0 && (
              <div className="popup-section">
                <p className="popup-section-title">Tags</p>
                <div className="popup-tag-row">
                  {tags.map((t, i) => (
                    <span key={i} className="popup-tag">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── TEAM ── */}
            {teamMembers.length > 0 && (
              <div className="popup-section">
                <p className="popup-section-title">Team</p>
                <div className="popup-team-list">
                  {teamMembers.map((m, i) => {
                    const ci = m.contactInfo || {};
                    const social = ci.socialLinks || {};
                    return (
                      <div key={`${m.name}-${i}`} className="popup-member-row">
                        {/* Avatar */}
                        <div className="popup-member-avatar">
                          {m.image ? (
                            <img src={m.image} alt={m.name} />
                          ) : (
                            <span>{(m.name || "?")[0].toUpperCase()}</span>
                          )}
                        </div>

                        {/* Name + role */}
                        <div className="popup-member-identity">
                          <p className="popup-member-name">{m.name}</p>
                          {m.role && (
                            <p className="popup-member-role">{m.role}</p>
                          )}
                        </div>

                        {/* Contact chips */}
                        <div className="popup-member-contacts">
                          {ci.email && (
                            <a
                              href={`mailto:${ci.email}`}
                              className="popup-contact-chip"
                              title={ci.email}
                            >
                              <span className="popup-contact-icon">✉</span>
                              <span className="popup-contact-label">
                                {ci.email}
                              </span>
                            </a>
                          )}
                          {ci.phone && (
                            <a
                              href={`tel:${ci.phone}`}
                              className="popup-contact-chip"
                              title={ci.phone}
                            >
                              <span className="popup-contact-icon">📞</span>
                              <span className="popup-contact-label">
                                {ci.phone}
                              </span>
                            </a>
                          )}
                          {social.linkedin && (
                            <a
                              href={social.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="popup-contact-chip"
                            >
                              <span className="popup-contact-icon">in</span>
                              <span className="popup-contact-label">
                                {social.linkedin.replace(
                                  /^https?:\/\/(www\.)?linkedin\.com\/in\//i,
                                  "",
                                )}
                              </span>
                            </a>
                          )}
                          {ci.website && (
                            <a
                              href={ci.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="popup-contact-chip"
                            >
                              <span className="popup-contact-icon">🌐</span>
                              <span className="popup-contact-label">
                                {ci.website.replace(/^https?:\/\//i, "")}
                              </span>
                            </a>
                          )}
                          {social.github && (
                            <a
                              href={social.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="popup-contact-chip"
                            >
                              <span className="popup-contact-icon">⌥</span>
                              <span className="popup-contact-label">
                                {social.github.replace(
                                  /^https?:\/\/(www\.)?github\.com\//i,
                                  "",
                                )}
                              </span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── ACTIONS ── */}
            <div className="popup-actions">
              <button
                className="popup-action-btn"
                onClick={() => setIsChatbotOpen(true)}
              >
                🤖 Talk to ExpoBot
              </button>
              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="popup-action-btn-secondary"
                >
                  🌐 Visit Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── LIGHTBOX ── */}
      {lightboxIdx !== null && (
        <Lightbox
          images={images}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      {/* ── VIDEO MODAL ── */}
      {activeVideo && (
        <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
      )}

      {/* ── CHATBOT ── */}
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
