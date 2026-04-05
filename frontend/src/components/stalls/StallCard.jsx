import { Link } from "react-router-dom";
import {
  Eye,
  Heart,
  Radio,
  EyeOff,
  MoreVertical,
  Calendar,
  Hash,
  Users,
  Image,
  ChevronRight,
  Building,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { stallAPI } from "@/lib/api";

// ─── Constants ────────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  technology: "#60a5fa",
  business: "#34d399",
  art: "#f472b6",
  science: "#a78bfa",
  other: "#fb923c",
};

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

// ─── Overflow menu ────────────────────────────────────────────────────────
function StallMenu({ stall, onToggleActive, onDelete }) {
  const [open, setOpen] = useState(false);

  const actions = [
    {
      label: "Edit Stall",
      to: `/user/stalls/${stall._id}`,
      color: "#a78bfa",
    },
    {
      label: stall.isActive ? "Deactivate" : "Activate",
      action: () => {
        onToggleActive(stall._id);
        setOpen(false);
      },
      color: stall.isActive ? "#fbbf24" : "#34d399",
    },
    {
      label: "Delete",
      action: () => {
        onDelete(stall._id);
        setOpen(false);
      },
      color: "#f87171",
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
        style={{
          color: "rgba(255,255,255,0.35)",
          background: open ? "rgba(255,255,255,0.08)" : "transparent",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(255,255,255,0.07)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = open
            ? "rgba(255,255,255,0.08)"
            : "transparent")
        }
      >
        <MoreVertical size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.13 }}
              className="absolute right-0 top-full mt-1.5 w-40 rounded-xl overflow-hidden z-40"
              style={{
                background: "#1a1728",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
              }}
            >
              {actions.map(({ label, to, action, color }) =>
                to ? (
                  <Link
                    key={label}
                    to={to}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[12.5px] transition-colors"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.05)";
                      e.currentTarget.style.color = color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                    }}
                    onClick={() => setOpen(false)}
                  >
                    {label}
                  </Link>
                ) : (
                  <button
                    key={label}
                    onClick={action}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[12.5px] transition-colors text-left"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.05)";
                      e.currentTarget.style.color = color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                    }}
                  >
                    {label}
                  </button>
                ),
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Stall Card (Grid) ────────────────────────────────────────────────────
export function StallCard({
  stall,
  onToggleActive,
  onDelete,
  viewMode = "grid",
}) {
  const catColor = CATEGORY_COLORS[stall.category] || "#a78bfa";
  const banner = stall.bannerImage?.url;
  const imgCount = stall.images?.length || 0;
  const docCount = stall.documents?.length || 0;
  const teamCount = stall.teamMembers?.length || 0;
  const event = stall.event || {};

  if (viewMode === "list") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-150 group"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(255,255,255,0.045)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "rgba(255,255,255,0.02)")
        }
      >
        {/* Thumb */}
        <div
          className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative"
          style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
        >
          {banner ? (
            <img src={banner} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building size={16} className="text-white opacity-50" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-white font-semibold text-[13.5px] truncate">
              {stall.projectTitle}
            </p>
          </div>
          <p
            className="text-[11px] truncate"
            style={{ color: "rgba(255,255,255,0.32)" }}
          >
            {event.name || "—"} · Stall #{stall.stallNumber}
          </p>
        </div>

        {/* Category */}
        {stall.category && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize hidden sm:inline flex-shrink-0"
            style={{
              background: `${catColor}18`,
              color: catColor,
              border: `1px solid ${catColor}30`,
            }}
          >
            {stall.category}
          </span>
        )}

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          <span
            className="flex items-center gap-1 text-[11px]"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            <Eye size={11} /> {stall.viewCount || 0}
          </span>
          <span
            className="flex items-center gap-1 text-[11px]"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            <Heart size={11} /> {stall.likeCount || 0}
          </span>
        </div>

        {/* Published badge */}
        <span
          className="flex items-center gap-1.5 text-[10.5px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
          style={
            stall.isPublished
              ? {
                  background: "rgba(52,211,153,0.12)",
                  color: "#34d399",
                  border: "1px solid rgba(52,211,153,0.22)",
                }
              : {
                  background: "rgba(251,191,36,0.1)",
                  color: "#fbbf24",
                  border: "1px solid rgba(251,191,36,0.22)",
                }
          }
        >
          {stall.isPublished ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />{" "}
              Published
            </>
          ) : (
            "Draft"
          )}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            to={`/user/stalls/${stall._id}`}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "rgba(124,58,237,0.2)", color: "#c4b5fd" }}
          >
            <ChevronRight size={14} />
          </Link>
          <StallMenu
            stall={stall}
            onToggleActive={onToggleActive}
            onDelete={onDelete}
          />
        </div>
      </motion.div>
    );
  }

  // ── Grid card ──────────────────────────────────────────────────────────
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col rounded-2xl overflow-hidden group transition-all duration-200"
      style={{
        background: "#141320",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.border = "1px solid rgba(167,139,250,0.28)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* ── Banner ── */}
      <div
        className="relative h-36 overflow-hidden"
        style={{ background: "linear-gradient(135deg,#1e1b30,#2d1f5e)" }}
      >
        {banner ? (
          <img
            src={banner}
            alt={stall.projectTitle}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-1.5">
              <Image size={24} style={{ color: "rgba(255,255,255,0.12)" }} />
              <p
                className="text-[10px]"
                style={{ color: "rgba(255,255,255,0.18)" }}
              >
                No banner
              </p>
            </div>
          </div>
        )}

        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top,#141320,transparent 55%)",
          }}
        />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          {/* Published status */}
          <span
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
            style={
              stall.isPublished
                ? {
                    background: "rgba(52,211,153,0.25)",
                    color: "#6ee7b7",
                    border: "1px solid rgba(52,211,153,0.35)",
                    backdropFilter: "blur(8px)",
                  }
                : {
                    background: "rgba(10,10,20,0.6)",
                    color: "#fbbf24",
                    border: "1px solid rgba(251,191,36,0.25)",
                    backdropFilter: "blur(8px)",
                  }
            }
          >
            {stall.isPublished && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            )}
            {stall.isPublished ? "Published" : "Draft"}
          </span>

          {/* Overflow menu */}
          <StallMenu
            stall={stall}
            onToggleActive={onToggleActive}
            onDelete={onDelete}
          />
        </div>

        {/* Stall number */}
        <div className="absolute bottom-3 right-3">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded"
            style={{
              background: "rgba(0,0,0,0.55)",
              color: "rgba(255,255,255,0.5)",
              backdropFilter: "blur(4px)",
            }}
          >
            #{stall.stallNumber}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Event name chip */}
        <div className="flex items-center gap-1.5 -mt-0.5">
          <Calendar
            size={10}
            style={{ color: "rgba(255,255,255,0.28)", flexShrink: 0 }}
          />
          <p
            className="text-[10.5px] truncate"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            {event.name || "Unknown Event"}
            {event.liveDate && (
              <span style={{ color: "rgba(255,255,255,0.22)" }}>
                {" "}
                · {fmt(event.liveDate)}
              </span>
            )}
          </p>
        </div>

        {/* Title */}
        <div>
          <h3
            className="text-white font-bold text-[14px] leading-tight line-clamp-1"
            style={{ fontFamily: "'Syne',sans-serif" }}
          >
            {stall.projectTitle}
          </h3>
          {stall.projectDescription && (
            <p
              className="text-[11.5px] mt-1 line-clamp-2 leading-relaxed"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              {stall.projectDescription}
            </p>
          )}
        </div>

        {/* Category */}
        {stall.category && (
          <span
            className="self-start text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize"
            style={{
              background: `${catColor}15`,
              color: catColor,
              border: `1px solid ${catColor}28`,
            }}
          >
            {stall.category}
          </span>
        )}

        {/* Media + team row */}
        <div
          className="flex items-center gap-3 flex-wrap mt-auto pt-1"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: 10,
          }}
        >
          <span
            className="flex items-center gap-1 text-[11px]"
            style={{ color: "rgba(255,255,255,0.32)" }}
          >
            <Image size={11} /> {imgCount} image{imgCount !== 1 ? "s" : ""}
          </span>
          <span
            className="flex items-center gap-1 text-[11px]"
            style={{ color: "rgba(255,255,255,0.32)" }}
          >
            <Users size={11} /> {teamCount} member{teamCount !== 1 ? "s" : ""}
          </span>
          <span
            className="flex items-center gap-1 text-[11px] ml-auto"
            style={{ color: "rgba(255,255,255,0.32)" }}
          >
            <Eye size={11} /> {stall.viewCount || 0}
          </span>
          <span
            className="flex items-center gap-1 text-[11px]"
            style={{ color: "rgba(255,255,255,0.32)" }}
          >
            <Heart size={11} /> {stall.likeCount || 0}
          </span>
        </div>

        {/* Active toggle + Edit CTA */}
        <div className="flex gap-2">
          <Link
            to={`/user/stalls/${stall._id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
            style={{
              background: "rgba(124,58,237,0.18)",
              color: "#c4b5fd",
              border: "1px solid rgba(124,58,237,0.25)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(124,58,237,0.28)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(124,58,237,0.18)")
            }
          >
            Edit Stall
          </Link>

          {/* Active toggle */}
          <button
            onClick={() => onToggleActive(stall._id)}
            className="flex items-center justify-center px-3 py-2 rounded-xl text-[12px] transition-all"
            title={stall.isActive ? "Deactivate" : "Activate"}
            style={
              stall.isActive
                ? {
                    background: "rgba(52,211,153,0.1)",
                    color: "#34d399",
                    border: "1px solid rgba(52,211,153,0.2)",
                  }
                : {
                    background: "rgba(255,255,255,0.04)",
                    color: "rgba(255,255,255,0.3)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }
            }
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {stall.isActive ? <Radio size={13} /> : <EyeOff size={13} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default StallCard;
