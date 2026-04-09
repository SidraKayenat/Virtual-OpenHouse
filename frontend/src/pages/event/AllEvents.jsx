import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";

import {
  Calendar,
  Search,
  LayoutGrid,
  List,
  RotateCcw,
  X,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Radio,
  Archive,
  Ban,
  ChevronRight,
  Eye,
  Trash2,
  Filter,
  TrendingUp,
  Users,
  Building,
} from "lucide-react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { eventAPI } from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

const fmtRelative = (d) => {
  if (!d) return "—";
  const diff = Date.now() - new Date(d);
  const m = Math.floor(diff / 60000),
    h = Math.floor(diff / 3600000),
    days = Math.floor(diff / 86400000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${days}d ago`;
};

const STATUS_META = {
  pending: {
    label: "Pending",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    border: "rgba(251,191,36,0.25)",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
    border: "rgba(167,139,250,0.25)",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
    border: "rgba(248,113,113,0.25)",
    icon: XCircle,
  },
  published: {
    label: "Published",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
    border: "rgba(96,165,250,0.25)",
    icon: Globe,
  },
  live: {
    label: "Live",
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
    border: "rgba(52,211,153,0.25)",
    icon: Radio,
  },
  completed: {
    label: "Ended",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.1)",
    border: "rgba(148,163,184,0.2)",
    icon: Archive,
  },
  cancelled: {
    label: "Cancelled",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.12)",
    border: "rgba(251,146,60,0.25)",
    icon: Ban,
  },
};

const EVENT_TYPE_COLORS = {
  conference: "#60a5fa",
  exhibition: "#a78bfa",
  fair: "#34d399",
  workshop: "#fbbf24",
  seminar: "#fb923c",
  other: "#94a3b8",
};

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "live", label: "Live" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Ended" },
  { value: "cancelled", label: "Cancelled" },
];

// ─── Toast ───────────────────────────────────────────────────────────────
// ─── Status badge ─────────────────────────────────────────────────────────
function StatusBadge({ status, pulse }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-1 rounded-full capitalize"
      style={{
        background: meta.bg,
        color: meta.color,
        border: `1px solid ${meta.border}`,
      }}
    >
      {(pulse || status === "live") && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: meta.color }}
        />
      )}
      {meta.label}
    </span>
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
        <div
          className="w-20 h-7 rounded-xl"
          style={{ background: "rgba(255,255,255,0.05)" }}
        />
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
      <div className="h-36" style={{ background: "rgba(255,255,255,0.07)" }} />
      <div className="p-4 flex flex-col gap-3">
        <div
          className="h-4 rounded w-2/3"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        <div
          className="h-3 rounded w-full"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
        <div className="flex gap-2 mt-2">
          <div
            className="h-8 flex-1 rounded-xl"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
          <div
            className="h-8 w-8 rounded-xl"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Event row (list view) ─────────────────────────────────────────────────
function EventRow({ event, onApprove, onReject, onDelete, actionLoading }) {
  const navigate = useNavigate();
  const typeColor = EVENT_TYPE_COLORS[event.eventType] || "#94a3b8";
  const isActing = actionLoading === event._id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 rounded-2xl group cursor-pointer transition-all"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
      onClick={() => navigate(`/admin/events/${event._id}`)}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "rgba(255,255,255,0.025)")
      }
    >
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
          <div
            className="w-full h-full flex items-center justify-center text-white text-lg font-bold"
            style={{ fontFamily: "'Syne',sans-serif" }}
          >
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
          className="text-[11.5px] mt-0.5 truncate"
          style={{ color: "rgba(255,255,255,0.38)" }}
        >
          {event.createdBy?.name}
          {event.createdBy?.organization
            ? ` · ${event.createdBy.organization}`
            : ""}
          {" · "}
          {fmtRelative(event.createdAt)}
        </p>
      </div>

      {/* Date + stalls */}
      <div className="hidden sm:flex flex-col items-end gap-0.5 flex-shrink-0">
        <p
          className="text-[11.5px]"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          {fmt(event.liveDate)}
        </p>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.28)" }}>
          {event.numberOfStalls} stalls
        </p>
      </div>

      {/* Status */}
      <StatusBadge status={event.status} />

      {/* Actions */}
      <div
        className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {event.status === "pending" && (
          <>
            <button
              onClick={() => onApprove(event)}
              disabled={isActing}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all"
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
              <CheckCircle size={11} /> Approve
            </button>
            <button
              onClick={() => onReject(event)}
              disabled={isActing}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all"
              style={{
                background: "rgba(248,113,113,0.1)",
                color: "#fca5a5",
                border: "1px solid rgba(248,113,113,0.2)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(248,113,113,0.2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(248,113,113,0.1)")
              }
            >
              <XCircle size={11} /> Reject
            </button>
          </>
        )}
        <button
          onClick={() => navigate(`/admin/events/${event._id}`)}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: "rgba(124,58,237,0.18)", color: "#c4b5fd" }}
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Event card (grid view) ────────────────────────────────────────────────
function EventCard({ event, onApprove, onReject, actionLoading }) {
  const navigate = useNavigate();
  const typeColor = EVENT_TYPE_COLORS[event.eventType] || "#94a3b8";
  const isActing = actionLoading === event._id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col rounded-2xl overflow-hidden group cursor-pointer"
      style={{
        background: "#141320",
        border: "1px solid rgba(255,255,255,0.07)",
        transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
      }}
      onClick={() => navigate(`/admin/events/${event._id}`)}
      onMouseEnter={(e) => {
        e.currentTarget.style.border = "1px solid rgba(167,139,250,0.22)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Banner */}
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
              className="text-5xl font-bold opacity-15 text-white"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              {event.name?.charAt(0)?.toUpperCase()}
            </p>
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top,#141320,transparent 60%)",
          }}
        />
        <div className="absolute top-3 left-3">
          <StatusBadge status={event.status} />
        </div>
        <span
          className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded capitalize"
          style={{
            background: `${typeColor}25`,
            color: typeColor,
            border: `1px solid ${typeColor}40`,
            backdropFilter: "blur(6px)",
          }}
        >
          {event.eventType}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <div>
          <h3
            className="text-white font-bold text-[14px] line-clamp-1"
            style={{ fontFamily: "'Syne',sans-serif" }}
          >
            {event.name}
          </h3>
          <p
            className="text-[11.5px] mt-0.5"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            {event.createdBy?.name}
            {event.createdBy?.organization
              ? ` · ${event.createdBy.organization}`
              : ""}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="flex items-center gap-1 text-[11px]"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            <Calendar size={10} /> {fmt(event.liveDate)}
          </span>
          <span
            className="text-[11px]"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
            {event.numberOfStalls} stalls
          </span>
        </div>

        {event.description && (
          <p
            className="text-[11.5px] line-clamp-2 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            {event.description}
          </p>
        )}

        {/* Actions */}
        <div
          className="flex gap-2 mt-auto pt-1"
          onClick={(e) => e.stopPropagation()}
        >
          {event.status === "pending" ? (
            <>
              <button
                onClick={() => onApprove(event)}
                disabled={isActing}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
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
                {isActing ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-green-400/40 border-t-green-400 animate-spin" />
                ) : (
                  <CheckCircle size={12} />
                )}
                Approve
              </button>
              <button
                onClick={() => onReject(event)}
                disabled={isActing}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
                style={{
                  background: "rgba(248,113,113,0.1)",
                  color: "#fca5a5",
                  border: "1px solid rgba(248,113,113,0.2)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(248,113,113,0.2)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(248,113,113,0.1)")
                }
              >
                <XCircle size={12} /> Reject
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate(`/admin/events/${event._id}`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
              style={{
                background: "rgba(124,58,237,0.15)",
                color: "#c4b5fd",
                border: "1px solid rgba(124,58,237,0.22)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(124,58,237,0.25)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(124,58,237,0.15)")
              }
            >
              <Eye size={12} /> View Details
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Quick reject modal ───────────────────────────────────────────────────
function QuickRejectModal({ event, onConfirm, onCancel, loading }) {
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
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
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
          <p className="text-white font-semibold text-[13.5px]">
            {event?.name}
          </p>
          <p
            className="text-[12px] mt-0.5"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            by {event?.createdBy?.name}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Rejection Reason <span style={{ color: "#f87171" }}>*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            maxLength={500}
            onChange={(e) => {
              setReason(e.target.value);
              setErr("");
            }}
            placeholder="Explain why this event is being rejected…"
            className="w-full rounded-2xl text-[13px] outline-none resize-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${err ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)"}`,
              color: "rgba(255,255,255,0.88)",
              padding: "10px 14px",
            }}
          />
          <div className="flex items-center justify-between">
            {err ? (
              <p className="text-[11px]" style={{ color: "#f87171" }}>
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
              onConfirm(reason.trim());
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

// ─── Main page ────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "latest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "asc_alphabetically", label: "A → Z" },
  { value: "desc_alphabetically", label: "Z → A" },
];

export default function AllEvents() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [viewMode, setViewMode] = useState("grid");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  // const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const LIMIT = 12;

  const load = useCallback(
    async (p = 1) => {
      try {
        setLoading(true);
        const params = { page: p, limit: LIMIT, sortBy };
        if (statusFilter) params.status = statusFilter;
        if (search) params.search = search;
        const res = await eventAPI.getAll(params);
        setEvents(res.data || []);
        setPagination(res.pagination || null);
        setPage(p);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, search, sortBy],
  );

  const loadStats = useCallback(async () => {
    try {
      const res = await eventAPI.getStats();
      setStats(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(1), search ? 350 : 0);
    return () => clearTimeout(t);
  }, [search, statusFilter, sortBy]);

  useEffect(() => {
    loadStats();
  }, []);

  // ── Quick approve ──────────────────────────────────────────────────────
  const handleApprove = async (event) => {
    try {
      setActionLoading(event._id);
      await eventAPI.approve(event._id);
      setEvents((prev) =>
        prev.map((e) =>
          e._id === event._id ? { ...e, status: "approved" } : e,
        ),
      );
      toast.success(`"${event.name}" approved`);
      loadStats();
    } catch (err) {
      toast.error(err.message || "Failed to approve");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Quick reject ───────────────────────────────────────────────────────
  const handleReject = async (reason) => {
    if (!rejectTarget) return;
    try {
      setActionLoading(rejectTarget._id);
      await eventAPI.reject(rejectTarget._id, reason);
      setEvents((prev) =>
        prev.map((e) =>
          e._id === rejectTarget._id ? { ...e, status: "rejected" } : e,
        ),
      );
      setRejectTarget(null);
      toast.success(`"${rejectTarget.name}" rejected`);
      loadStats();
    } catch (err) {
      toast.error(err.message || "Failed to reject", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const hasFilters = search || statusFilter || sortBy !== "latest";

  const statCards = stats
    ? [
        { label: "Total", value: stats.total, color: "#a78bfa" },
        { label: "Pending", value: stats.pending, color: "#fbbf24" },
        { label: "Published", value: stats.published, color: "#60a5fa" },
        { label: "Live", value: stats.live, color: "#34d399" },
        { label: "Rejected", value: stats.rejected, color: "#f87171" },
        { label: "Ended", value: stats.completed, color: "#94a3b8" },
      ]
    : [];

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
            className="flex items-center justify-between gap-4 mb-7"
          >
            <div>
              <h1
                className="text-white text-2xl font-bold"
                style={{ fontFamily: "'Syne',sans-serif" }}
              >
                All Events
              </h1>
              <p
                className="text-[13px] mt-0.5"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Manage, review and moderate all events on the platform
              </p>
            </div>
            <button
              onClick={() => load(page)}
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

          {/* ── Stat cards ── */}
          {statCards.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6"
            >
              {statCards.map(({ label, value, color }) => (
                <div
                  key={label}
                  className="flex flex-col gap-2 p-4 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <p
                    className="text-[22px] font-bold leading-none text-white"
                    style={{ fontFamily: "'Syne',sans-serif" }}
                  >
                    {value ?? "—"}
                  </p>
                  <p
                    className="text-[11.5px]"
                    style={{ color: "rgba(255,255,255,0.38)" }}
                  >
                    {label}
                  </p>
                  <div
                    className="h-0.5 rounded-full w-8"
                    style={{ background: color }}
                  />
                </div>
              ))}
            </motion.div>
          )}

          {/* ── Toolbar ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl mb-6"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {/* Row 1 */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="relative flex-1 max-w-sm">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                />
                <input
                  type="text"
                  placeholder="Search events, organizers, orgs…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 rounded-xl text-[13px] outline-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.88)",
                  }}
                  onFocus={(e) =>
                    (e.target.style.border = "1px solid rgba(167,139,250,0.45)")
                  }
                  onBlur={(e) =>
                    (e.target.style.border = "1px solid rgba(255,255,255,0.08)")
                  }
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  >
                    <X size={11} style={{ color: "rgba(255,255,255,0.35)" }} />
                  </button>
                )}
              </div>

              {/* Sort */}
              <div className="relative flex-shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-3 pr-7 py-2 rounded-xl text-[12.5px] outline-none appearance-none cursor-pointer"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.65)",
                  }}
                >
                  {SORT_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronRight
                  size={12}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                />
              </div>

              <span
                className="text-[12px] flex-shrink-0 hidden sm:block"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {pagination
                  ? `${pagination.total} events`
                  : `${events.length} events`}
              </span>

              {/* View toggle */}
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
                    className="p-2 rounded-lg transition-all"
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

              {hasFilters && (
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("");
                    setSortBy("latest");
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11.5px] font-medium flex-shrink-0 transition-all"
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

            {/* Row 2: status tabs */}
            <div
              className="flex items-center gap-1 px-4 py-2.5 overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {STATUS_TABS.map(({ value, label }) => {
                const count =
                  value === ""
                    ? stats?.total || events.length
                    : (stats?.[value] ?? null);
                return (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-medium transition-all flex-shrink-0"
                    style={
                      statusFilter === value
                        ? {
                            background: "rgba(167,139,250,0.18)",
                            color: "#c4b5fd",
                            border: "1px solid rgba(167,139,250,0.3)",
                          }
                        : {
                            color: "rgba(255,255,255,0.38)",
                            background: "transparent",
                            border: "1px solid transparent",
                          }
                    }
                  >
                    {label}
                    {count != null && (
                      <span
                        className="text-[9.5px] font-bold px-1.5 py-px rounded-full"
                        style={{
                          background:
                            statusFilter === value
                              ? "rgba(255,255,255,0.12)"
                              : "rgba(255,255,255,0.07)",
                          color:
                            statusFilter === value
                              ? "white"
                              : "rgba(255,255,255,0.3)",
                        }}
                      >
                        {count}
                      </span>
                    )}
                    {statusFilter === value && (
                      <motion.span
                        layoutId="eventsTab"
                        className="absolute bottom-0 left-3 right-3 h-px rounded-full"
                        style={{
                          background: "linear-gradient(90deg,#7c3aed,#a78bfa)",
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* ── Events ── */}
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
          ) : events.length === 0 ? (
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
                <Calendar
                  size={26}
                  style={{ color: "rgba(255,255,255,0.14)" }}
                />
              </div>
              <p className="text-white font-semibold text-[16px]">
                {hasFilters ? "No events match" : "No events yet"}
              </p>
              <p
                className="text-[13px]"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {search
                  ? `No results for "${search}"`
                  : statusFilter
                    ? `No ${statusFilter} events`
                    : "Events will appear here once created"}
              </p>
              {hasFilters && (
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("");
                    setSortBy("latest");
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
              {events.map((event, i) => (
                <motion.div
                  key={event._id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.25) }}
                >
                  {viewMode === "list" ? (
                    <EventRow
                      event={event}
                      onApprove={handleApprove}
                      onReject={setRejectTarget}
                      actionLoading={actionLoading}
                    />
                  ) : (
                    <EventCard
                      event={event}
                      onApprove={handleApprove}
                      onReject={setRejectTarget}
                      actionLoading={actionLoading}
                    />
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ── Pagination ── */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-8 px-1">
              <p
                className="text-[12px]"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Page {pagination.page} of {pagination.pages} ·{" "}
                {pagination.total} total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => load(page - 1)}
                  disabled={page <= 1 || loading}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color:
                      page <= 1
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    cursor: page <= 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Previous
                </button>
                {Array.from(
                  { length: Math.min(5, pagination.pages) },
                  (_, i) => {
                    const p =
                      Math.max(1, Math.min(pagination.pages - 4, page - 2)) + i;
                    return (
                      <button
                        key={p}
                        onClick={() => load(p)}
                        className="w-8 h-8 rounded-lg text-[12px] font-medium transition-all"
                        style={
                          p === page
                            ? {
                                background: "rgba(124,58,237,0.3)",
                                color: "#c4b5fd",
                                border: "1px solid rgba(124,58,237,0.35)",
                              }
                            : {
                                background: "rgba(255,255,255,0.04)",
                                color: "rgba(255,255,255,0.45)",
                                border: "1px solid rgba(255,255,255,0.07)",
                              }
                        }
                      >
                        {p}
                      </button>
                    );
                  },
                )}
                <button
                  onClick={() => load(page + 1)}
                  disabled={page >= pagination.pages || loading}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color:
                      page >= pagination.pages
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    cursor:
                      page >= pagination.pages ? "not-allowed" : "pointer",
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {rejectTarget && (
          <QuickRejectModal
            event={rejectTarget}
            onConfirm={handleReject}
            onCancel={() => setRejectTarget(null)}
            loading={actionLoading === rejectTarget._id}
          />
        )}
      </AnimatePresence>
      {/* <AnimatePresence>
        {toast && (
          <Toast key={Date.now()} {...toast} onDone={() => setToast(null)} />
        )}
      </AnimatePresence> */}
    </div>
  );
}
