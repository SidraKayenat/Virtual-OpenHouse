import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  PlusCircle,
  Search,
  ChevronDown,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  Send,
  Users,
  MapPin,
  LayoutGrid,
  List,
  X,
  Zap,
  Radio,
  RotateCcw,
  Settings,
} from "lucide-react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { eventAPI } from "@/lib/api";

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
  published: {
    label: "Published",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
    border: "rgba(96,165,250,0.25)",
    icon: Radio,
  },
  live: {
    label: "Live",
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
    border: "rgba(248,113,113,0.25)",
    icon: Radio,
  },
  rejected: {
    label: "Rejected",
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
    border: "rgba(248,113,113,0.25)",
    icon: AlertCircle,
  },
  completed: {
    label: "Completed",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.1)",
    border: "rgba(148,163,184,0.2)",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.1)",
    border: "rgba(148,163,184,0.2)",
    icon: XCircle,
  },
};

const FILTER_TABS = [
  "all",
  "pending",
  "approved",
  "published",
  "live",
  "rejected",
  "completed",
  "cancelled",
];

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

// ─── Helpers ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = STATUS_META[status] || STATUS_META.pending;
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
      {status !== "live" && <Icon size={11} />}
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
        boxShadow: active ? `0 0 20px ${color}15` : "none",
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
          {value}
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

function Skeleton() {
  return (
    <div
      className="rounded-2xl p-5 animate-pulse"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex gap-4">
        <div
          className="w-16 h-16 rounded-xl flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.07)" }}
        />
        <div className="flex-1 flex flex-col gap-2.5 pt-1">
          <div
            className="h-4 rounded w-2/3"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
          <div
            className="h-3 rounded w-full"
            style={{ background: "rgba(255,255,255,0.04)" }}
          />
          <div
            className="h-3 rounded w-1/3"
            style={{ background: "rgba(255,255,255,0.04)" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Action menu ──────────────────────────────────────────────────────────
function ActionMenu({ event, onPublish, onRefresh }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const canEdit = ["pending", "approved"].includes(event.status);
  const canPublish = event.status === "approved";
  const canView = true;
  const canManage = ["published", "live"].includes(event.status);
  const canCancel = !["completed", "cancelled", "rejected"].includes(
    event.status,
  );

  const actions = [
    canView && {
      icon: Eye,
      label: "View Details",
      color: "#a78bfa",
      fn: () => navigate(`/events/${event._id}`),
    },
    canManage && {
      icon: Settings,
      label: "Manage Event",
      color: "#60a5fa",
      fn: () => navigate(`/event/manage/${event._id}`),
    },
    canEdit && {
      icon: Edit,
      label: "Edit Event",
      color: "#34d399",
      fn: () => navigate(`/event/${event._id}/edit`),
    },
    canPublish && {
      icon: Send,
      label: "Publish",
      color: "#60a5fa",
      fn: () => {
        onPublish(event._id);
        setOpen(false);
      },
    },
    canCancel && {
      icon: XCircle,
      label: "Cancel Event",
      color: "#f87171",
      fn: () => {
        /* TODO */ setOpen(false);
      },
    },
  ].filter(Boolean);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
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
        <MoreVertical size={15} />
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
              className="absolute right-0 top-full mt-1.5 w-44 rounded-xl overflow-hidden z-40"
              style={{
                background: "#1a1728",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
              }}
            >
              {actions.map(({ icon: Icon, label, color, fn }) => (
                <button
                  key={label}
                  onClick={(e) => {
                    e.stopPropagation();
                    fn();
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[12.5px] transition-colors text-left"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                  }}
                >
                  <Icon size={13} style={{ color }} />
                  {label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Event row card ───────────────────────────────────────────────────────
function EventRow({ event, viewMode, onPublish, onRefresh }) {
  const navigate = useNavigate();
  const meta = STATUS_META[event.status] || STATUS_META.pending;
  const registered = (event.numberOfStalls ?? 0) - (event.availableStalls ?? 0);
  const fillPct = Math.round((registered / (event.numberOfStalls || 1)) * 100);
  const image = event.thumbnailUrl || event.thumbnail || "/thumbnail.png";

  if (viewMode === "list") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
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
          className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
        >
          <img src={image} alt="" className="w-full h-full object-cover" />
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-[13.5px] truncate">
            {event.name}
          </p>
          <p
            className="text-[11px] mt-0.5 truncate"
            style={{ color: "rgba(255,255,255,0.32)" }}
          >
            {fmt(event.liveDate)} · {event.venue || "Virtual"} ·{" "}
            {event.numberOfStalls} stalls
          </p>
        </div>
        {/* Stall mini bar */}
        <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0 w-24">
          <span
            className="text-[10.5px]"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            {registered}/{event.numberOfStalls}
          </span>
          <div
            className="h-1 w-full rounded-full"
            style={{ background: "rgba(255,255,255,0.07)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${fillPct}%`,
                background: "linear-gradient(90deg,#7c3aed,#a78bfa)",
              }}
            />
          </div>
        </div>
        <StatusBadge status={event.status} />
        <ActionMenu event={event} onPublish={onPublish} onRefresh={onRefresh} />
      </motion.div>
    );
  }

  // Grid card
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
      {/* Thumbnail */}
      <div className="relative h-36 overflow-hidden">
        <img
          src={image}
          alt=""
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, #141320 0%, transparent 60%)",
          }}
        />
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <StatusBadge status={event.status} />
          <ActionMenu
            event={event}
            onPublish={onPublish}
            onRefresh={onRefresh}
          />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3
            className="text-white font-bold text-[14px] leading-tight line-clamp-1"
            style={{ fontFamily: "'Syne',sans-serif" }}
          >
            {event.name}
          </h3>
          <p
            className="text-[11.5px] mt-1 line-clamp-2 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            {event.description}
          </p>
        </div>

        {/* Meta */}
        <div className="flex flex-col gap-1.5">
          <div
            className="flex items-center gap-1.5 text-[11px]"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            <Calendar size={11} /> {fmt(event.liveDate)}
            {event.startTime && (
              <span>
                · {event.startTime}
                {event.endTime ? ` – ${event.endTime}` : ""}
              </span>
            )}
          </div>
          {event.venue && (
            <div
              className="flex items-center gap-1.5 text-[11px]"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              <MapPin size={11} /> {event.venue}
            </div>
          )}
          <div
            className="flex items-center gap-1.5 text-[11px]"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            <Users size={11} /> {registered} registered ·{" "}
            {event.availableStalls} stalls left
          </div>
        </div>

        {/* Fill bar */}
        <div>
          <div
            className="flex justify-between text-[10px] mb-1"
            style={{ color: "rgba(255,255,255,0.28)" }}
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
            className="h-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)" }}
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

        {/* Rejection reason */}
        {event.status === "rejected" && event.rejectionReason && (
          <div
            className="px-3 py-2 rounded-xl text-[11.5px] leading-snug"
            style={{
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.18)",
              color: "#fca5a5",
            }}
          >
            <span className="font-semibold">Cancelled: </span>
            {event.rejectionReason}
          </div>
        )}

        {/* Primary CTA */}
        <div className="flex gap-2 mt-auto pt-1">
          {event.status === "approved" && (
            <button
              onClick={() => onPublish(event._id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
              style={{
                background: "rgba(96,165,250,0.18)",
                color: "#93c5fd",
                border: "1px solid rgba(96,165,250,0.25)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(96,165,250,0.28)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(96,165,250,0.18)")
              }
            >
              <Send size={12} /> Publish
            </button>
          )}
          {["published", "live"].includes(event.status) && (
            <Link
              to={`/event/manage/${event._id}`}
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
              <Settings size={12} /> Manage
            </Link>
          )}
          {["pending", "approved"].includes(event.status) && (
            <Link
              to={`/event/${event._id}/edit`}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all"
              style={{
                background: "rgba(52,211,153,0.12)",
                color: "#6ee7b7",
                border: "1px solid rgba(52,211,153,0.2)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(52,211,153,0.2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(52,211,153,0.12)")
              }
            >
              <Edit size={12} />
            </Link>
          )}
          <Link
            to={`/events/${event._id}`}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.color = "rgba(255,255,255,0.4)";
            }}
          >
            <Eye size={12} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function MyEvents() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [publishing, setPublishing] = useState(null); // eventId being published

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await eventAPI.getMyEvents();
      setMyEvents(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // ── Stats ──────────────────────────────────────────────────────────
  const stats = {
    total: myEvents.length,
    pending: myEvents.filter((e) => e.status === "pending").length,
    approved: myEvents.filter((e) => e.status === "approved").length,
    published: myEvents.filter((e) => e.status === "published").length,
    live: myEvents.filter((e) => e.status === "live").length,
    rejected: myEvents.filter((e) => e.status === "rejected").length,
  };

  // ── Filter + search ────────────────────────────────────────────────
  const filtered = myEvents.filter((e) => {
    const matchTab = filter === "all" || e.status === filter;
    const matchSearch =
      !search || e.name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  // ── Publish ────────────────────────────────────────────────────────
  const handlePublish = async (eventId) => {
    try {
      setPublishing(eventId);
      await eventAPI.publish(eventId);
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to publish");
    } finally {
      setPublishing(null);
    }
  };

  const hasFilters = filter !== "all" || search;

  // ─── Render ─────────────────────────────────────────────────────────
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

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto px-6 md:px-8 py-7">
          {/* Error */}
          {error && (
            <div
              className="mb-5 p-4 rounded-xl text-sm"
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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-center justify-between mb-7"
          >
            <div>
              <h1
                className="text-white text-2xl font-bold"
                style={{ fontFamily: "'Syne',sans-serif" }}
              >
                My Events
              </h1>
              <p
                className="text-[13px] mt-0.5"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Manage and track all events you've created
              </p>
            </div>
            <Link
              to="/user/create-event"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-semibold text-white transition-all"
              style={{
                background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                border: "1px solid rgba(167,139,250,0.25)",
                boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 6px 28px rgba(124,58,237,0.45)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(124,58,237,0.3)")
              }
            >
              <PlusCircle size={15} /> Create Event
            </Link>
          </motion.div>

          {/* ══ STAT CARDS ══════════════════════════════════════════════ */}
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-7">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl animate-pulse"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.38 }}
              className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-7"
            >
              <StatCard
                label="Total Events"
                value={stats.total}
                color="#a78bfa"
                icon={Calendar}
                onClick={() => setFilter("all")}
                active={filter === "all"}
              />
              <StatCard
                label="Pending"
                value={stats.pending}
                color="#fbbf24"
                icon={Clock}
                onClick={() => setFilter("pending")}
                active={filter === "pending"}
              />
              <StatCard
                label="Approved"
                value={stats.approved}
                color="#34d399"
                icon={CheckCircle}
                onClick={() => setFilter("approved")}
                active={filter === "approved"}
              />
              <StatCard
                label="Published"
                value={stats.published}
                color="#60a5fa"
                icon={Radio}
                onClick={() => setFilter("published")}
                active={filter === "published"}
              />
              <StatCard
                label="Live"
                value={stats.live}
                color="#f87171"
                icon={Zap}
                onClick={() => setFilter("live")}
                active={filter === "live"}
              />
              <StatCard
                label="Rejected"
                value={stats.rejected}
                color="#f87171"
                icon={AlertCircle}
                onClick={() => setFilter("rejected")}
                active={filter === "rejected"}
              />
            </motion.div>
          )}

          {/* ══ TOOLBAR ════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="rounded-2xl mb-6 overflow-visible"
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
                <div className="relative flex-1 max-w-xs">
                  <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  />
                  <input
                    type="text"
                    placeholder="Search your events…"
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
                  {filtered.length} event{filtered.length !== 1 ? "s" : ""}
                </span>
              </div>
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

            {/* Row 2: status filter tabs */}
            <div
              className="flex items-center gap-1 px-4 py-2.5 overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {FILTER_TABS.map((st) => {
                const count =
                  st === "all"
                    ? myEvents.length
                    : myEvents.filter((e) => e.status === st).length;
                const m = st === "all" ? null : STATUS_META[st];
                return (
                  <button
                    key={st}
                    onClick={() => setFilter(st)}
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
                          filter === st ? "white" : "rgba(255,255,255,0.3)",
                      }}
                    >
                      {count}
                    </span>
                    {filter === st && (
                      <motion.span
                        layoutId="myEventsTab"
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
              })}
              {hasFilters && (
                <button
                  onClick={() => {
                    setFilter("all");
                    setSearch("");
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

          {/* ══ EVENTS ══════════════════════════════════════════════════ */}
          {loading ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                  : "flex flex-col gap-3"
              }
            >
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-4"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Calendar
                  size={22}
                  style={{ color: "rgba(255,255,255,0.14)" }}
                />
              </div>
              <p className="text-white font-semibold">
                {filter === "all" && !search
                  ? "No events yet"
                  : "No events match"}
              </p>
              <p
                className="text-[13px]"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {filter === "all" && !search
                  ? "Create your first event to get started"
                  : search
                    ? `No results for "${search}"`
                    : `No ${filter} events`}
              </p>
              {filter === "all" && !search ? (
                <Link
                  to="/user/create-event"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white mt-1"
                  style={{
                    background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                    border: "1px solid rgba(167,139,250,0.25)",
                  }}
                >
                  <PlusCircle size={14} /> Create Event
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setFilter("all");
                    setSearch("");
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
                  <EventRow
                    event={event}
                    viewMode={viewMode}
                    onPublish={handlePublish}
                    onRefresh={loadData}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
