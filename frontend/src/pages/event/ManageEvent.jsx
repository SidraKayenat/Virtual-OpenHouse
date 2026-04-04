import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Tag,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  LayoutGrid,
  List,
  ChevronRight,
  RotateCcw,
  Edit,
  Radio,
  Building,
  Eye,
  Send,
  X,
  Zap,
  Hash,
  ExternalLink,
  Layers,
  ShieldAlert,
  Settings,
} from "lucide-react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { eventAPI, registrationAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ─── Constants ────────────────────────────────────────────────────────────
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
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
    border: "rgba(52,211,153,0.25)",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
    border: "rgba(248,113,113,0.25)",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.1)",
    border: "rgba(148,163,184,0.2)",
    icon: XCircle,
  },
};

const EVENT_STATUS_META = {
  pending: { label: "Pending Review", color: "#fbbf24" },
  approved: { label: "Approved", color: "#34d399" },
  published: { label: "Published", color: "#60a5fa" },
  live: { label: "Live", color: "#f87171" },
  completed: { label: "Completed", color: "#94a3b8" },
  cancelled: { label: "Cancelled", color: "#94a3b8" },
  rejected: { label: "Rejected", color: "#f87171" },
};

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
const fmtTime = (d) => {
  if (!d) return "—";
  const diff = Date.now() - new Date(d);
  const m = Math.floor(diff / 60000),
    h = Math.floor(diff / 3600000),
    days = Math.floor(diff / 86400000);
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${days}d ago`;
};

// ─── Sub-components ───────────────────────────────────────────────────────
function StatusBadge({ status, map = STATUS_META }) {
  const s = map[status] || map.pending;
  const Icon = s.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0"
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {status === "live" && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: s.color }}
        />
      )}
      {status !== "live" && Icon && <Icon size={11} />}
      {s.label}
    </span>
  );
}

function StatCard({ label, value, color, icon: Icon, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2 p-4 rounded-2xl text-left transition-all duration-200 w-full"
      style={{
        background: active ? `${color}15` : "rgba(255,255,255,0.03)",
        border: active
          ? `1px solid ${color}40`
          : "1px solid rgba(255,255,255,0.07)",
        boxShadow: active ? `0 0 20px ${color}12` : "none",
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon size={15} style={{ color }} strokeWidth={2} />
        </div>
        {active && (
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: color }}
          />
        )}
      </div>
      <div>
        <p
          className="text-[26px] font-bold leading-none text-white"
          style={{ fontFamily: "'Syne',sans-serif" }}
        >
          {value ?? "—"}
        </p>
        <p
          className="text-[11.5px] mt-1"
          style={{ color: "rgba(255,255,255,0.38)" }}
        >
          {label}
        </p>
      </div>
    </button>
  );
}

// ─── Cancel Event Modal ───────────────────────────────────────────────────
function CancelModal({ onConfirm, onClose, loading }) {
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
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
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            <ShieldAlert size={18} style={{ color: "#f87171" }} />
          </div>
          <div>
            <h3
              className="text-white font-bold text-[15px]"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              Cancel Event
            </h3>
            <p
              className="text-[12px]"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              This action cannot be undone
            </p>
          </div>
        </div>
        <div>
          <label
            className="text-[11px] font-bold uppercase tracking-widest mb-1.5 block"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Reason for cancellation
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setErr("");
            }}
            rows={3}
            placeholder="Explain why you're cancelling this event…"
            className="w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none resize-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: err
                ? "1px solid rgba(248,113,113,0.5)"
                : "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.88)",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(167,139,250,0.45)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = err
                ? "rgba(248,113,113,0.5)"
                : "rgba(255,255,255,0.1)")
            }
          />
          {err && (
            <p className="text-[11.5px] mt-1" style={{ color: "#f87171" }}>
              {err}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all"
            style={{
              color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            Go back
          </button>
          <button
            disabled={loading}
            onClick={() => {
              if (!reason.trim()) {
                setErr("Reason is required");
                return;
              }
              onConfirm(reason);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
            style={{
              background: "rgba(239,68,68,0.3)",
              border: "1px solid rgba(239,68,68,0.4)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <XCircle size={14} />
            )}
            {loading ? "Cancelling…" : "Cancel Event"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Registration row ─────────────────────────────────────────────────────
function RegRow({ reg, viewMode, onView }) {
  const catColor = CATEGORY_COLORS[reg.participantInfo?.category] || "#a78bfa";
  const info = reg.participantInfo || {};

  if (viewMode === "list") {
    return (
      <div
        className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-150 group cursor-pointer"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "rgba(255,255,255,0.02)")
        }
        onClick={() => onView(reg._id)}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}
        >
          {reg.user?.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-[13.5px] truncate">
            {info.projectTitle || "—"}
          </p>
          <p
            className="text-[11px] mt-0.5"
            style={{ color: "rgba(255,255,255,0.32)" }}
          >
            {reg.user?.name} · {reg.user?.email}
          </p>
        </div>
        {info.category && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize hidden sm:inline flex-shrink-0"
            style={{
              background: `${catColor}18`,
              color: catColor,
              border: `1px solid ${catColor}30`,
            }}
          >
            {info.category}
          </span>
        )}
        {reg.status === "approved" && reg.stallNumber && (
          <span
            className="text-[10.5px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
            style={{
              background: "rgba(52,211,153,0.12)",
              color: "#34d399",
              border: "1px solid rgba(52,211,153,0.2)",
            }}
          >
            Stall #{reg.stallNumber}
          </span>
        )}
        <StatusBadge status={reg.status} />
        <ChevronRight
          size={14}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "#a78bfa" }}
        />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer group"
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
      onClick={() => onView(reg._id)}
    >
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}
            >
              {reg.user?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-[13px] truncate">
                {reg.user?.name}
              </p>
              <p
                className="text-[10.5px] truncate"
                style={{ color: "rgba(255,255,255,0.32)" }}
              >
                {reg.user?.email}
              </p>
            </div>
          </div>
          <StatusBadge status={reg.status} />
        </div>
        {info.projectTitle && (
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              Project
            </p>
            <p className="text-white text-[13px] font-semibold line-clamp-1">
              {info.projectTitle}
            </p>
          </div>
        )}
        {info.projectDescription && (
          <p
            className="text-[11.5px] line-clamp-2 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            {info.projectDescription}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto pt-1">
          {info.category && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
              style={{
                background: `${catColor}18`,
                color: catColor,
                border: `1px solid ${catColor}30`,
              }}
            >
              {info.category}
            </span>
          )}
          {reg.status === "approved" && reg.stallNumber ? (
            <span
              className="text-[10.5px] font-bold px-2.5 py-1 rounded-full ml-auto"
              style={{
                background: "rgba(52,211,153,0.12)",
                color: "#34d399",
                border: "1px solid rgba(52,211,153,0.2)",
              }}
            >
              Stall #{reg.stallNumber}
            </span>
          ) : (
            <span
              className="text-[10.5px] ml-auto"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              {fmtTime(reg.createdAt)}
            </span>
          )}
        </div>
        <div
          className="flex items-center gap-1.5 text-[11.5px] font-semibold pt-1"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: 10,
            color: "#a78bfa",
          }}
        >
          View Details{" "}
          <ChevronRight
            size={12}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────
function Skeleton({ viewMode }) {
  if (viewMode === "list") {
    return (
      <div
        className="flex items-center gap-4 p-4 rounded-2xl animate-pulse"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex-shrink-0"
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
      </div>
    );
  }
  return (
    <div
      className="rounded-2xl p-4 animate-pulse"
      style={{
        background: "#141320",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="h-4 rounded w-2/3 mb-3"
        style={{ background: "rgba(255,255,255,0.07)" }}
      />
      <div
        className="h-3 rounded w-full mb-2"
        style={{ background: "rgba(255,255,255,0.04)" }}
      />
      <div
        className="h-3 rounded w-1/2"
        style={{ background: "rgba(255,255,255,0.04)" }}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function ManageEvent() {
  const { user } = useAuth();
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [regs, setRegs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regsLoading, setRegsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadEvent = useCallback(async () => {
    try {
      setLoading(true);
      const res = await eventAPI.getById(eventId);
      setEvent(res.data);
      return res.data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const loadRegistrations = useCallback(
    async (status = "all") => {
      try {
        setRegsLoading(true);
        const params = status !== "all" ? { status } : {};
        const res = await registrationAPI.getEventRegistrations(
          eventId,
          params,
        );
        setRegs(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setRegsLoading(false);
      }
    },
    [eventId],
  );

  const loadStats = useCallback(async () => {
    try {
      const res = await registrationAPI.getStats(eventId);
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [eventId]);

  useEffect(() => {
    (async () => {
      const ev = await loadEvent();
      if (!ev) return;
      const isAdmin =
        ev.createdBy?._id === user?._id || ev.createdBy === user?._id;
      if (isAdmin) {
        await Promise.all([loadRegistrations("all"), loadStats()]);
      }
    })();
  }, [eventId, user?._id]);

  const handleFilterChange = (f) => {
    setFilter(f);
    loadRegistrations(f);
  };

  const handleCancel = async (reason) => {
    try {
      setCancelling(true);
      await eventAPI.cancel(eventId, reason);
      setShowCancel(false);
      await loadEvent();
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const isEventAdmin =
    user &&
    event &&
    (event.createdBy?._id === user._id || event.createdBy === user._id);
  const canCancel =
    event && !["cancelled", "completed"].includes(event.status) && isEventAdmin;
  const eventMeta =
    EVENT_STATUS_META[event?.status] || EVENT_STATUS_META.pending;
  const fillPct = event
    ? Math.round(
        ((event.numberOfStalls - event.availableStalls) /
          (event.numberOfStalls || 1)) *
          100,
      )
    : 0;

  const filtered = regs.filter((r) => {
    const matchSearch =
      !search ||
      [r.user?.name, r.user?.email, r.participantInfo?.projectTitle]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
    return matchSearch;
  });

  // ─── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen flex" style={{ background: "#0c0c0f" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
              <p
                className="text-[13px]"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                Loading event…
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="h-screen flex" style={{ background: "#0c0c0f" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 flex items-center justify-center">
            <p className="text-white">Event not found</p>
          </main>
        </div>
      </div>
    );
  }

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
        input::placeholder { color: rgba(255,255,255,0.22); }
      `}</style>

      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto px-6 md:px-8 py-7 flex flex-col gap-6">
          {error && (
            <div
              className="p-4 rounded-xl text-sm"
              style={{
                background: "rgba(248,113,113,0.1)",
                border: "1px solid rgba(248,113,113,0.2)",
                color: "#fca5a5",
              }}
            >
              {error}
            </div>
          )}

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => navigate(-1)}
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.5)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.5)")
                }
              >
                <ArrowLeft size={15} />
              </button>
              <div className="min-w-0">
                <h1
                  className="text-white text-xl font-bold truncate"
                  style={{ fontFamily: "'Syne',sans-serif" }}
                >
                  {event.name}
                </h1>
                <p
                  className="text-[12.5px]"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  Manage event ·{" "}
                  {isEventAdmin ? "You are the organizer" : "Viewer"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                to={`/events/${eventId}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-medium transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "white";
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
              >
                <Eye size={13} /> Public View
              </Link>
              {isEventAdmin &&
                ["pending", "approved"].includes(event.status) && (
                  <Link
                    to={`/event/${eventId}/edit`}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-semibold transition-all"
                    style={{
                      background: "rgba(52,211,153,0.12)",
                      color: "#6ee7b7",
                      border: "1px solid rgba(52,211,153,0.2)",
                    }}
                  >
                    <Edit size={13} /> Edit Event
                  </Link>
                )}
              {canCancel && (
                <button
                  onClick={() => setShowCancel(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-semibold transition-all"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    color: "#f87171",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(239,68,68,0.2)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(239,68,68,0.1)")
                  }
                >
                  <XCircle size={13} /> Cancel Event
                </button>
              )}
            </div>
          </motion.div>

          {/* ── Event Preview Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.35 }}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] min-h-[180px]">
                {/* Thumbnail */}
                <div
                  className="relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg,#1e1b30,#2d1f5e)",
                    minHeight: 180,
                  }}
                >
                  {event.thumbnailUrl && (
                    <img
                      src={event.thumbnailUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to right,transparent 60%,rgba(12,12,15,0.8))",
                    }}
                  />
                  <div className="absolute top-4 left-4">
                    <span
                      className="text-[10.5px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
                      style={{
                        background: `${eventMeta.color}25`,
                        color: eventMeta.color,
                        border: `1px solid ${eventMeta.color}40`,
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      {event.status === "live" && (
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse align-middle"
                          style={{ background: eventMeta.color }}
                        />
                      )}
                      {eventMeta.label}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span
                        className="text-[10.5px] font-semibold px-2 py-0.5 rounded capitalize"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.45)",
                        }}
                      >
                        {event.eventType}
                      </span>
                      <span
                        className="text-[10.5px] font-semibold px-2 py-0.5 rounded capitalize"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.45)",
                        }}
                      >
                        {event.environmentType}
                      </span>
                    </div>
                    <p
                      className="text-[13px] leading-relaxed mt-1 line-clamp-2"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {event.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      {
                        icon: Calendar,
                        label: "Live Date",
                        value: fmt(event.liveDate),
                      },
                      {
                        icon: Clock,
                        label: "Time",
                        value: event.startTime
                          ? `${event.startTime}${event.endTime ? ` – ${event.endTime}` : ""}`
                          : "TBD",
                      },
                      {
                        icon: MapPin,
                        label: "Venue",
                        value: event.venue || "Virtual",
                      },
                      {
                        icon: Building,
                        label: "Stalls",
                        value: `${event.availableStalls} / ${event.numberOfStalls} left`,
                      },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label}>
                        <p
                          className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                          style={{ color: "rgba(255,255,255,0.25)" }}
                        >
                          {label}
                        </p>
                        <p className="text-[12.5px] font-medium text-white flex items-center gap-1.5">
                          <Icon
                            size={11}
                            style={{
                              color: "rgba(255,255,255,0.35)",
                              flexShrink: 0,
                            }}
                          />{" "}
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Stall fill bar */}
                  <div>
                    <div
                      className="flex justify-between text-[10.5px] mb-1.5"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      <span>Stall occupancy</span>
                      <span
                        style={{
                          color:
                            fillPct >= 90
                              ? "#f87171"
                              : fillPct >= 60
                                ? "#fbbf24"
                                : "#a78bfa",
                        }}
                      >
                        {fillPct}%
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.07)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${fillPct}%`,
                          background:
                            fillPct >= 90
                              ? "linear-gradient(90deg,#ef4444,#dc2626)"
                              : fillPct >= 60
                                ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
                                : "linear-gradient(90deg,#7c3aed,#a78bfa)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  {event.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {event.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(167,139,250,0.1)",
                            color: "#c4b5fd",
                            border: "1px solid rgba(167,139,250,0.15)",
                          }}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Registration Stats (admin only) ── */}
          {isEventAdmin && stats && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
            >
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                <StatCard
                  label="Total Regs"
                  value={stats.total}
                  color="#a78bfa"
                  icon={Users}
                  onClick={() => handleFilterChange("all")}
                  active={filter === "all"}
                />
                <StatCard
                  label="Pending"
                  value={stats.pending}
                  color="#fbbf24"
                  icon={Clock}
                  onClick={() => handleFilterChange("pending")}
                  active={filter === "pending"}
                />
                <StatCard
                  label="Approved"
                  value={stats.approved}
                  color="#34d399"
                  icon={CheckCircle}
                  onClick={() => handleFilterChange("approved")}
                  active={filter === "approved"}
                />
                <StatCard
                  label="Rejected"
                  value={stats.rejected}
                  color="#f87171"
                  icon={XCircle}
                  onClick={() => handleFilterChange("rejected")}
                  active={filter === "rejected"}
                />
                <StatCard
                  label="Cancelled"
                  value={stats.cancelled}
                  color="#94a3b8"
                  icon={XCircle}
                  onClick={() => handleFilterChange("cancelled")}
                  active={filter === "cancelled"}
                />
                <StatCard
                  label="Stalls Left"
                  value={stats.availableStalls}
                  color="#60a5fa"
                  icon={Building}
                  onClick={() => {}}
                  active={false}
                />
              </div>
            </motion.div>
          )}

          {/* ── Registrations (admin only) ── */}
          {isEventAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.35 }}
              className="flex flex-col gap-4"
            >
              {/* Toolbar */}
              <div
                className="rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {/* Row 1 */}
                <div
                  className="flex items-center justify-between gap-4 px-4 py-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative flex-1 max-w-xs">
                      <Search
                        size={13}
                        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "rgba(255,255,255,0.25)" }}
                      />
                      <input
                        type="text"
                        placeholder="Search by name, email, project…"
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
                      {filtered.length} result{filtered.length !== 1 ? "s" : ""}
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

                {/* Row 2: filter tabs */}
                <div
                  className="flex items-center gap-1 px-4 py-2.5 overflow-x-auto"
                  style={{ scrollbarWidth: "none" }}
                >
                  {["all", "pending", "approved", "rejected", "cancelled"].map(
                    (st) => {
                      const count =
                        st === "all"
                          ? regs.length
                          : regs.filter((r) => r.status === st).length;
                      const m = STATUS_META[st];
                      return (
                        <button
                          key={st}
                          onClick={() => handleFilterChange(st)}
                          className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-medium transition-all duration-150 flex-shrink-0 capitalize"
                          style={
                            filter === st
                              ? {
                                  background: m
                                    ? `${m.color}18`
                                    : "rgba(167,139,250,0.18)",
                                  color: m ? m.color : "#c4b5fd",
                                  border: `1px solid ${m ? m.border : "rgba(167,139,250,0.3)"}`,
                                }
                              : {
                                  color: "rgba(255,255,255,0.38)",
                                  background: "transparent",
                                  border: "1px solid transparent",
                                }
                          }
                        >
                          {st}
                          <span
                            className="text-[9.5px] font-bold px-1.5 py-px rounded-full min-w-[18px] text-center"
                            style={{
                              background:
                                filter === st
                                  ? "rgba(255,255,255,0.12)"
                                  : "rgba(255,255,255,0.07)",
                              color:
                                filter === st
                                  ? "white"
                                  : "rgba(255,255,255,0.3)",
                            }}
                          >
                            {count}
                          </span>
                          {filter === st && (
                            <motion.span
                              layoutId="manageTab"
                              className="absolute bottom-0 left-3 right-3 h-px rounded-full"
                              style={{
                                background: m
                                  ? `linear-gradient(90deg,${m.color},${m.color}88)`
                                  : "linear-gradient(90deg,#7c3aed,#a78bfa)",
                              }}
                            />
                          )}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              {/* Registrations list */}
              {regsLoading ? (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                      : "flex flex-col gap-3"
                  }
                >
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} viewMode={viewMode} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <Users
                      size={22}
                      style={{ color: "rgba(255,255,255,0.14)" }}
                    />
                  </div>
                  <p className="text-white font-semibold">
                    No registrations found
                  </p>
                  <p
                    className="text-[13px]"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    {search
                      ? `No results for "${search}"`
                      : filter !== "all"
                        ? `No ${filter} registrations`
                        : "Registrations will appear here"}
                  </p>
                </div>
              ) : (
                <motion.div
                  layout
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                      : "flex flex-col gap-3"
                  }
                >
                  {filtered.map((reg, i) => (
                    <motion.div
                      key={reg._id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: Math.min(i * 0.04, 0.2),
                        duration: 0.28,
                      }}
                    >
                      <RegRow
                        reg={reg}
                        viewMode={viewMode}
                        onView={(id) => navigate(`/registration/${id}`)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </main>
      </div>

      {/* Cancel modal */}
      <AnimatePresence>
        {showCancel && (
          <CancelModal
            onConfirm={handleCancel}
            onClose={() => setShowCancel(false)}
            loading={cancelling}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
