import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Eye,
  ChevronRight,
  RotateCcw,
  Calendar,
  MapPin,
  Building,
  Users,
  Tag,
  AlertCircle,
  X,
  ShieldAlert,
  LayoutGrid,
  List,
  Filter,
  RefreshCw,
  Info,
} from "lucide-react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { eventAPI } from "@/lib/api";

// ─── Constants ────────────────────────────────────────────────────────────
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

const fmtFull = (d) =>
  d
    ? new Date(d).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const fmtRelative = (d) => {
  if (!d) return "—";
  const diff = Date.now() - new Date(d);
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${days}d ago`;
};

const EVENT_TYPE_COLORS = {
  conference: "#60a5fa",
  exhibition: "#a78bfa",
  fair: "#34d399",
  workshop: "#fbbf24",
  seminar: "#fb923c",
  other: "#94a3b8",
};

// ─── Styled inputs ────────────────────────────────────────────────────────
const inputBase = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.88)",
  borderRadius: 12,
  outline: "none",
  width: "100%",
  padding: "10px 14px",
  fontSize: 13.5,
  transition: "border-color 0.18s",
};

function StyledTextarea({ ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      style={{
        ...inputBase,
        resize: "vertical",
        minHeight: 85,
        borderColor: focused
          ? "rgba(167,139,250,0.5)"
          : "rgba(255,255,255,0.1)",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

// ─── Confirm modal ────────────────────────────────────────────────────────
function ApproveModal({ event, onConfirm, onCancel, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
        style={{
          background: "#1a1728",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(52,211,153,0.12)",
              border: "1px solid rgba(52,211,153,0.28)",
            }}
          >
            <CheckCircle size={18} style={{ color: "#34d399" }} />
          </div>
          <div>
            <h3
              className="text-white font-bold text-[15px]"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              Approve Event
            </h3>
            <p
              className="text-[12px]"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Event admin will be notified
            </p>
          </div>
        </div>
        <div
          className="p-3.5 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <p className="text-white font-semibold text-[13.5px]">{event.name}</p>
          <p
            className="text-[12px] mt-0.5"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            by {event.createdBy?.name}
            {event.createdBy?.organization
              ? ` · ${event.createdBy.organization}`
              : ""}
          </p>
        </div>
        <p
          className="text-[12.5px]"
          style={{ color: "rgba(255,255,255,0.42)" }}
        >
          Approving allows the event admin to publish this event. You can still
          reject it later if needed.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
            style={{
              color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white"
            style={{
              background: "rgba(52,211,153,0.25)",
              border: "1px solid rgba(52,211,153,0.4)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <CheckCircle size={14} />
            )}
            {loading ? "Approving…" : "Confirm Approval"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RejectModal({ event, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
        style={{
          background: "#1a1728",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(248,113,113,0.12)",
              border: "1px solid rgba(248,113,113,0.28)",
            }}
          >
            <XCircle size={18} style={{ color: "#f87171" }} />
          </div>
          <div>
            <h3
              className="text-white font-bold text-[15px]"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              Reject Event
            </h3>
            <p
              className="text-[12px]"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              A reason is required
            </p>
          </div>
        </div>
        <div
          className="p-3.5 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <p className="text-white font-semibold text-[13.5px]">{event.name}</p>
          <p
            className="text-[12px] mt-0.5"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            by {event.createdBy?.name}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Rejection Reason <span style={{ color: "#f87171" }}>*</span>
          </label>
          <StyledTextarea
            placeholder="Explain why this event is being rejected. Be specific so the event admin can resubmit correctly…"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setErr("");
            }}
            rows={3}
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            {err ? (
              <p className="text-[11.5px]" style={{ color: "#f87171" }}>
                {err}
              </p>
            ) : (
              <span />
            )}
            <span
              className="text-[10.5px]"
              style={{ color: "rgba(255,255,255,0.22)" }}
            >
              {reason.length}/500
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
            style={{
              color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!reason.trim()) {
                setErr("Reason is required");
                return;
              }
              onConfirm(reason);
            }}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white"
            style={{
              background: "rgba(248,113,113,0.22)",
              border: "1px solid rgba(248,113,113,0.38)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <XCircle size={14} />
            )}
            {loading ? "Rejecting…" : "Confirm Rejection"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Event detail expansion ───────────────────────────────────────────────
function EventExpandedDetails({ event }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div
        className="px-4 pb-4 pt-2 flex flex-col gap-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Description */}
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            Description
          </p>
          <p
            className="text-[12.5px] leading-relaxed"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            {event.description}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Live Date", value: fmt(event.liveDate) },
            {
              label: "Time",
              value: event.startTime
                ? `${event.startTime}${event.endTime ? ` – ${event.endTime}` : ""}`
                : "TBD",
            },
            { label: "Venue", value: event.venue || "Virtual" },
            { label: "Environment", value: event.environmentType || "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <p
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                {label}
              </p>
              <p
                className="text-[12.5px] font-medium capitalize"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Tags */}
        {event.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10.5px] font-medium px-2.5 py-0.5 rounded-full"
                style={{
                  background: "rgba(167,139,250,0.1)",
                  color: "#c4b5fd",
                  border: "1px solid rgba(167,139,250,0.18)",
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Submitted */}
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.28)" }}>
          Submitted {fmtFull(event.createdAt)}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Event request card ───────────────────────────────────────────────────
function EventRequestCard({
  event,
  viewMode,
  onApprove,
  onReject,
  actionLoading,
}) {
  const [expanded, setExpanded] = useState(false);
  const typeColor = EVENT_TYPE_COLORS[event.eventType] || "#94a3b8";

  if (viewMode === "list") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Row */}
        <div className="flex items-center gap-4 p-4">
          {/* Thumb */}
          <div
            className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
          >
            {event.thumbnailUrl ? (
              <img
                src={event.thumbnailUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-lg">
                {event.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white font-semibold text-[13.5px] truncate">
                {event.name}
              </p>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize flex-shrink-0"
                style={{
                  background: `${typeColor}18`,
                  color: typeColor,
                  border: `1px solid ${typeColor}30`,
                }}
              >
                {event.eventType}
              </span>
            </div>
            <p
              className="text-[11px] mt-0.5"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              {event.createdBy?.name}
              {event.createdBy?.organization
                ? ` · ${event.createdBy.organization}`
                : ""}
              {" · "}
              <span style={{ color: "rgba(255,255,255,0.25)" }}>
                {fmtRelative(event.createdAt)}
              </span>
            </p>
          </div>

          {/* Stalls + date */}
          <div className="hidden sm:flex flex-col items-end flex-shrink-0 gap-0.5">
            <span
              className="text-[11px]"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              {event.numberOfStalls} stalls
            </span>
            <span
              className="text-[11px]"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              {fmt(event.liveDate)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{
                background: expanded
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.45)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <ChevronRight
                size={13}
                className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
              />
            </button>
            <button
              onClick={() => onApprove(event)}
              disabled={actionLoading === event._id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
              style={{
                background: "rgba(52,211,153,0.15)",
                color: "#34d399",
                border: "1px solid rgba(52,211,153,0.25)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(52,211,153,0.25)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(52,211,153,0.15)")
              }
            >
              <CheckCircle size={12} /> Approve
            </button>
            <button
              onClick={() => onReject(event)}
              disabled={actionLoading === event._id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
              style={{
                background: "rgba(248,113,113,0.12)",
                color: "#fca5a5",
                border: "1px solid rgba(248,113,113,0.22)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(248,113,113,0.22)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(248,113,113,0.12)")
              }
            >
              <XCircle size={12} /> Reject
            </button>
          </div>
        </div>

        {/* Expandable details */}
        <AnimatePresence>
          {expanded && <EventExpandedDetails event={event} />}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ── Grid card ──────────────────────────────────────────────────────────
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col rounded-2xl overflow-hidden group"
      style={{
        background: "#141320",
        border: "1px solid rgba(255,255,255,0.07)",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(167,139,250,0.22)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.35)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Thumbnail */}
      <div
        className="relative h-36 overflow-hidden"
        style={{ background: "linear-gradient(135deg,#1e1b30,#2d1f5e)" }}
      >
        {event.thumbnailUrl ? (
          <img
            src={event.thumbnailUrl}
            alt={event.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p
              className="text-[40px] font-bold text-white opacity-20"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              {event.name?.charAt(0)?.toUpperCase()}
            </p>
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top,#141320,transparent 55%)",
          }}
        />
        {/* Event type chip */}
        <span
          className="absolute top-3 left-3 text-[10.5px] font-bold px-2.5 py-1 rounded-full capitalize"
          style={{
            background: `${typeColor}25`,
            color: typeColor,
            border: `1px solid ${typeColor}40`,
            backdropFilter: "blur(8px)",
          }}
        >
          {event.eventType}
        </span>
        {/* Stalls badge */}
        <span
          className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded"
          style={{
            background: "rgba(0,0,0,0.55)",
            color: "rgba(255,255,255,0.5)",
            backdropFilter: "blur(4px)",
          }}
        >
          {event.numberOfStalls} stalls
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3
            className="text-white font-bold text-[14px] line-clamp-1"
            style={{ fontFamily: "'Syne',sans-serif" }}
          >
            {event.name}
          </h3>
          <p
            className="text-[11.5px] mt-0.5 line-clamp-2 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            {event.description}
          </p>
        </div>

        {/* Submitter */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}
          >
            {event.createdBy?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold truncate text-white">
              {event.createdBy?.name}
            </p>
            {event.createdBy?.organization && (
              <p
                className="text-[10.5px] truncate"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {event.createdBy.organization}
              </p>
            )}
          </div>
          <p
            className="text-[10.5px] ml-auto flex-shrink-0"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
            {fmtRelative(event.createdAt)}
          </p>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="flex items-center gap-1 text-[11px]"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <Calendar size={10} /> {fmt(event.liveDate)}
          </span>
          {event.venue && (
            <span
              className="flex items-center gap-1 text-[11px] truncate"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              <MapPin size={10} /> {event.venue}
            </span>
          )}
        </div>

        {/* Tags */}
        {event.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[9.5px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(167,139,250,0.1)",
                  color: "#c4b5fd",
                  border: "1px solid rgba(167,139,250,0.18)",
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          <button
            onClick={() => onApprove(event)}
            disabled={actionLoading === event._id}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12.5px] font-semibold transition-all"
            style={{
              background: "rgba(52,211,153,0.15)",
              color: "#34d399",
              border: "1px solid rgba(52,211,153,0.25)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(52,211,153,0.25)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(52,211,153,0.15)")
            }
          >
            {actionLoading === event._id ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-green-400/40 border-t-green-400 animate-spin" />
            ) : (
              <CheckCircle size={13} />
            )}
            Approve
          </button>
          <button
            onClick={() => onReject(event)}
            disabled={actionLoading === event._id}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12.5px] font-semibold transition-all"
            style={{
              background: "rgba(248,113,113,0.12)",
              color: "#fca5a5",
              border: "1px solid rgba(248,113,113,0.22)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(248,113,113,0.22)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(248,113,113,0.12)")
            }
          >
            <XCircle size={13} /> Reject
          </button>
          <Link
            to={`/events/${event._id}`}
            className="flex items-center justify-center px-3 py-2.5 rounded-xl transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.38)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.color = "rgba(255,255,255,0.38)";
            }}
          >
            <Eye size={13} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────
function Skeleton({ viewMode }) {
  if (viewMode === "list") {
    return (
      <div
        className="flex items-center gap-4 p-4 rounded-2xl animate-pulse"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.07)" }}
        />
        <div className="flex-1 flex flex-col gap-2">
          <div
            className="h-4 rounded w-2/3"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
          <div
            className="h-3 rounded w-1/3"
            style={{ background: "rgba(255,255,255,0.04)" }}
          />
        </div>
        <div className="flex gap-2">
          <div
            className="h-8 w-20 rounded-xl"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
          <div
            className="h-8 w-20 rounded-xl"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
        </div>
      </div>
    );
  }
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse"
      style={{
        background: "#141320",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="h-36" style={{ background: "rgba(255,255,255,0.06)" }} />
      <div className="p-4 flex flex-col gap-3">
        <div
          className="h-4 rounded w-2/3"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        <div
          className="h-3 rounded w-full"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
        <div
          className="h-3 rounded w-1/2"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
        <div className="flex gap-2 mt-2">
          <div
            className="h-9 flex-1 rounded-xl"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
          <div
            className="h-9 flex-1 rounded-xl"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function EventRequests() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [actionLoading, setActionLoading] = useState(null);

  // Modal state
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await eventAPI.getPending();
      setEvents(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  // ── Approve ─────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!approveTarget) return;
    try {
      setActionLoading(approveTarget._id);
      await eventAPI.approve(approveTarget._id);
      setEvents((prev) => prev.filter((e) => e._id !== approveTarget._id));
      setApproveTarget(null);
      toast.success(`"${approveTarget.name}" approved successfully`);
    } catch (err) {
      toast.error(err.message || "Failed to approve event", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Reject ───────────────────────────────────────────────────────────
  const handleReject = async (reason) => {
    if (!rejectTarget) return;
    try {
      setActionLoading(rejectTarget._id);
      await eventAPI.reject(rejectTarget._id, reason);
      setEvents((prev) => prev.filter((e) => e._id !== rejectTarget._id));
      setRejectTarget(null);
      toast.success(`"${rejectTarget.name}" rejected`);
    } catch (err) {
      toast.error(err.message || "Failed to reject event", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Filter ───────────────────────────────────────────────────────────
  const filtered = events.filter((e) => {
    const matchSearch =
      !search ||
      [e.name, e.description, e.createdBy?.name, e.createdBy?.organization]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchType = !typeFilter || e.eventType === typeFilter;
    return matchSearch && matchType;
  });

  const typeCounts = events.reduce((acc, e) => {
    acc[e.eventType] = (acc[e.eventType] || 0) + 1;
    return acc;
  }, {});

  const hasFilters = search || typeFilter;

  return (
    <div
      className="h-screen flex"
      style={{
        background: "#0c0c0f",
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Syne:wght@700;800&display=swap');
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.22); }
        select option { background: #1a1728; color: white; }
      `}</style>

      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto px-6 md:px-8 py-7">
          {/* Error */}
          {error && (
            <div
              className="mb-5 p-4 rounded-xl text-sm flex items-center justify-between gap-3"
              style={{
                background: "rgba(248,113,113,0.1)",
                border: "1px solid rgba(248,113,113,0.2)",
                color: "#fca5a5",
              }}
            >
              <span>
                <AlertCircle size={13} className="inline mr-1.5" />
                {error}
              </span>
              <button onClick={() => setError(null)}>
                <X size={13} />
              </button>
            </div>
          )}

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between mb-7 gap-4"
          >
            <div>
              <div className="flex items-center gap-3">
                <h1
                  className="text-white text-2xl font-bold"
                  style={{ fontFamily: "'Syne',sans-serif" }}
                >
                  Event Requests
                </h1>
                {/* Live count badge */}
                {!loading && events.length > 0 && (
                  <span
                    className="flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-1 rounded-full"
                    style={{
                      background: "rgba(251,191,36,0.12)",
                      color: "#fbbf24",
                      border: "1px solid rgba(251,191,36,0.25)",
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                    {events.length} pending
                  </span>
                )}
              </div>
              <p
                className="text-[13px] mt-0.5"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Review and approve or reject event submissions from event admins
              </p>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-medium transition-all flex-shrink-0"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.09)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.09)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
              }
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />{" "}
              Refresh
            </button>
          </motion.div>

          {/* ── Stats row ── */}
          {!loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
            >
              {[
                {
                  label: "Total Pending",
                  value: events.length,
                  color: "#fbbf24",
                  icon: Clock,
                },
                {
                  label: "Conferences",
                  value: typeCounts.conference || 0,
                  color: "#60a5fa",
                  icon: Users,
                },
                {
                  label: "Workshops",
                  value: (typeCounts.workshop || 0) + (typeCounts.seminar || 0),
                  color: "#34d399",
                  icon: Tag,
                },
                {
                  label: "Other Types",
                  value:
                    events.length -
                    (typeCounts.conference || 0) -
                    (typeCounts.workshop || 0) -
                    (typeCounts.seminar || 0),
                  color: "#a78bfa",
                  icon: Building,
                },
              ].map(({ label, value, color, icon: Icon }) => (
                <div
                  key={label}
                  className="flex flex-col gap-2 p-4 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: `${color}18` }}
                  >
                    <Icon size={15} style={{ color }} strokeWidth={2} />
                  </div>
                  <div>
                    <p
                      className="text-[24px] font-bold leading-none text-white"
                      style={{ fontFamily: "'Syne',sans-serif" }}
                    >
                      {value}
                    </p>
                    <p
                      className="text-[11.5px] mt-1"
                      style={{ color: "rgba(255,255,255,0.38)" }}
                    >
                      {label}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* ── Toolbar ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl mb-6"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {/* Row 1: search + view toggle */}
            <div
              className="flex items-center justify-between gap-4 px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative flex-1 max-w-sm">
                  <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  />
                  <input
                    type="text"
                    placeholder="Search by event name, organizer, org…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 rounded-xl text-[13px] outline-none"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.88)",
                    }}
                    onFocus={(e) =>
                      (e.target.style.border =
                        "1px solid rgba(167,139,250,0.45)")
                    }
                    onBlur={(e) =>
                      (e.target.style.border =
                        "1px solid rgba(255,255,255,0.08)")
                    }
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2"
                    >
                      <X
                        size={11}
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      />
                    </button>
                  )}
                </div>
                <span
                  className="text-[12px] flex-shrink-0"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {filtered.length} request{filtered.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div
                className="flex rounded-xl overflow-hidden p-0.5 flex-shrink-0"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {[
                  { id: "grid", Icon: LayoutGrid },
                  { id: "list", Icon: List },
                ].map(({ id, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setViewMode(id)}
                    className="p-2 rounded-lg transition-all duration-150"
                    style={
                      viewMode === id
                        ? {
                            background: "rgba(124,58,237,0.35)",
                            color: "#c4b5fd",
                          }
                        : { color: "rgba(255,255,255,0.3)" }
                    }
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: event type filter tabs */}
            <div
              className="flex items-center gap-1 px-4 py-2.5 overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {[
                { value: "", label: "All Types" },
                ...Object.keys(EVENT_TYPE_COLORS).map((t) => ({
                  value: t,
                  label: t.charAt(0).toUpperCase() + t.slice(1),
                })),
              ].map(({ value, label }) => {
                const count =
                  value === "" ? events.length : typeCounts[value] || 0;
                const c = EVENT_TYPE_COLORS[value];
                return (
                  <button
                    key={value}
                    onClick={() => setTypeFilter(value)}
                    className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-medium transition-all duration-150 flex-shrink-0"
                    style={
                      typeFilter === value
                        ? {
                            background: c ? `${c}18` : "rgba(167,139,250,0.18)",
                            color: c || "#c4b5fd",
                            border: `1px solid ${c ? c + "35" : "rgba(167,139,250,0.3)"}`,
                          }
                        : {
                            color: "rgba(255,255,255,0.38)",
                            background: "transparent",
                            border: "1px solid transparent",
                          }
                    }
                  >
                    {label}
                    {count > 0 && (
                      <span
                        className="text-[9.5px] font-bold px-1.5 py-px rounded-full min-w-[18px] text-center"
                        style={{
                          background:
                            typeFilter === value
                              ? "rgba(255,255,255,0.12)"
                              : "rgba(255,255,255,0.07)",
                          color:
                            typeFilter === value
                              ? "white"
                              : "rgba(255,255,255,0.3)",
                        }}
                      >
                        {count}
                      </span>
                    )}
                    {typeFilter === value && (
                      <motion.span
                        layoutId="adminTypeTab"
                        className="absolute bottom-0 left-3 right-3 h-px rounded-full"
                        style={{
                          background: c
                            ? `linear-gradient(90deg,${c},${c}88)`
                            : "linear-gradient(90deg,#7c3aed,#a78bfa)",
                        }}
                      />
                    )}
                  </button>
                );
              })}
              {hasFilters && (
                <button
                  onClick={() => {
                    setSearch("");
                    setTypeFilter("");
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11.5px] font-medium ml-auto flex-shrink-0 transition-all"
                  style={{
                    color: "#f87171",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.15)",
                  }}
                >
                  <RotateCcw size={11} /> Reset
                </button>
              )}
            </div>
          </motion.div>

          {/* ── Event list ── */}
          {loading ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                  : "flex flex-col gap-3"
              }
            >
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} viewMode={viewMode} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-28 gap-4"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {events.length === 0 ? (
                  <CheckCircle
                    size={26}
                    style={{ color: "rgba(52,211,153,0.35)" }}
                  />
                ) : (
                  <Search
                    size={26}
                    style={{ color: "rgba(255,255,255,0.14)" }}
                  />
                )}
              </div>
              <p className="text-white font-semibold text-[16px]">
                {events.length === 0 ? "All caught up!" : "No requests match"}
              </p>
              <p
                className="text-[13px]"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {events.length === 0
                  ? "No pending event requests at this time. Check back later."
                  : search
                    ? `No results for "${search}"`
                    : "Try changing your type filter"}
              </p>
              {hasFilters && events.length > 0 && (
                <button
                  onClick={() => {
                    setSearch("");
                    setTypeFilter("");
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium mt-1"
                  style={{
                    background: "rgba(124,58,237,0.15)",
                    color: "#c4b5fd",
                    border: "1px solid rgba(124,58,237,0.25)",
                  }}
                >
                  <RotateCcw size={13} /> Clear filters
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              layout
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                  : "flex flex-col gap-3"
              }
            >
              {filtered.map((event, i) => (
                <motion.div
                  key={event._id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: Math.min(i * 0.04, 0.25),
                    duration: 0.3,
                  }}
                >
                  <EventRequestCard
                    event={event}
                    viewMode={viewMode}
                    onApprove={(e) => setApproveTarget(e)}
                    onReject={(e) => setRejectTarget(e)}
                    actionLoading={actionLoading}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </main>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {approveTarget && (
          <ApproveModal
            event={approveTarget}
            onConfirm={handleApprove}
            onCancel={() => setApproveTarget(null)}
            loading={actionLoading === approveTarget._id}
          />
        )}
        {rejectTarget && (
          <RejectModal
            event={rejectTarget}
            onConfirm={handleReject}
            onCancel={() => setRejectTarget(null)}
            loading={actionLoading === rejectTarget._id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
