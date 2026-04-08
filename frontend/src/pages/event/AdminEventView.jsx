import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Globe,
  Radio,
  Archive,
  Ban,
  CheckCircle,
  XCircle,
  MapPin,
  Users,
  Hash,
  Building,
  Trash2,
  Tag,
  Eye,
  Heart,
  RefreshCw,
  AlertCircle,
  X,
  ShieldAlert,
  Info,
  ChevronRight,
  Image,
  FileText,
  Building2,
  BarChart,
} from "lucide-react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { eventAPI, registrationAPI, stallAPI } from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "—";
const fmtShort = (d) =>
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

const STATUS_META = {
  pending: {
    label: "Pending Review",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    border: "rgba(251,191,36,0.28)",
  },
  approved: {
    label: "Approved",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
    border: "rgba(167,139,250,0.28)",
  },
  rejected: {
    label: "Rejected",
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
    border: "rgba(248,113,113,0.28)",
  },
  published: {
    label: "Published",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
    border: "rgba(96,165,250,0.28)",
  },
  live: {
    label: "Live Now",
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
    border: "rgba(52,211,153,0.28)",
  },
  completed: {
    label: "Ended",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.1)",
    border: "rgba(148,163,184,0.2)",
  },
  cancelled: {
    label: "Cancelled",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.12)",
    border: "rgba(251,146,60,0.25)",
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

const REG_STATUS_META = {
  pending: { label: "Pending", color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  approved: { label: "Approved", color: "#34d399", bg: "rgba(52,211,153,0.1)" },
  rejected: {
    label: "Rejected",
    color: "#f87171",
    bg: "rgba(248,113,113,0.1)",
  },
  cancelled: {
    label: "Cancelled",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.08)",
  },
};

// ─── Toast ────────────────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.22 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
      style={
        type === "success"
          ? {
              background: "#1a1728",
              border: "1px solid rgba(52,211,153,0.35)",
              color: "#6ee7b7",
            }
          : {
              background: "#1a1728",
              border: "1px solid rgba(248,113,113,0.35)",
              color: "#fca5a5",
            }
      }
    >
      {type === "success" ? (
        <CheckCircle size={15} />
      ) : (
        <AlertCircle size={15} />
      )}
      <span className="text-[13px] font-medium">{message}</span>
    </motion.div>
  );
}

// ─── Reject modal ─────────────────────────────────────────────────────────
function RejectModal({ eventName, onConfirm, onCancel, loading }) {
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
            <ShieldAlert size={18} style={{ color: "#f87171" }} />
          </div>
          <div>
            <h3
              className="text-white font-bold text-[15px]"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              Reject Event
            </h3>
            <p
              className="text-[12px] truncate max-w-xs"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              {eventName}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Rejection Reason <span style={{ color: "#f87171" }}>*</span>
          </label>
          <textarea
            rows={4}
            value={reason}
            maxLength={500}
            onChange={(e) => {
              setReason(e.target.value);
              setErr("");
            }}
            placeholder="Be specific so the organizer can resubmit correctly…"
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
                setErr("Required");
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
            {loading ? "Rejecting…" : "Reject Event"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Delete modal ─────────────────────────────────────────────────────────
function DeleteModal({ eventName, onConfirm, onCancel, loading }) {
  const [text, setText] = useState("");
  const allowed = text === "DELETE";
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
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
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
            <Trash2 size={18} style={{ color: "#f87171" }} />
          </div>
          <div>
            <h3
              className="text-white font-bold text-[15px]"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              Delete Event
            </h3>
            <p
              className="text-[12px]"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              This is permanent
            </p>
          </div>
        </div>
        <p
          className="text-[12.5px]"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          You're about to delete{" "}
          <strong style={{ color: "white" }}>{eventName}</strong> and all its
          data.
        </p>
        <div className="flex flex-col gap-1.5">
          <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            Type <strong style={{ color: "white" }}>DELETE</strong> to confirm
          </p>
          <input
            type="text"
            placeholder="DELETE"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${allowed ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)"}`,
              color: "rgba(255,255,255,0.88)",
            }}
          />
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
            onClick={onConfirm}
            disabled={!allowed || loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold"
            style={{
              background: allowed
                ? "rgba(239,68,68,0.3)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${allowed ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
              cursor: !allowed || loading ? "not-allowed" : "pointer",
              color: allowed ? "white" : "rgba(255,255,255,0.25)",
            }}
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, color = "#a78bfa" }) {
  if (!value && value !== 0) return null;
  return (
    <div
      className="flex items-start gap-3 py-2.5"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: `${color}14` }}
      >
        <Icon size={13} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[10.5px] font-bold uppercase tracking-wider"
          style={{ color: "rgba(255,255,255,0.28)" }}
        >
          {label}
        </p>
        <p
          className="text-[13px] font-medium mt-0.5 break-words"
          style={{ color: "rgba(255,255,255,0.78)" }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, accent = "#a78bfa", children }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
        >
          <Icon size={15} style={{ color: accent }} />
        </div>
        <h2
          className="text-white font-bold text-[14px]"
          style={{ fontFamily: "'Syne',sans-serif" }}
        >
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Registration row ─────────────────────────────────────────────────────
function RegistrationRow({ reg }) {
  const meta = REG_STATUS_META[reg.status] || REG_STATUS_META.pending;
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}
      >
        {reg.user?.name?.charAt(0)?.toUpperCase() || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-[13px] truncate">
          {reg.user?.name || "—"}
        </p>
        <p
          className="text-[11px] truncate"
          style={{ color: "rgba(255,255,255,0.38)" }}
        >
          {reg.participantInfo?.projectTitle || "No project title"}
        </p>
      </div>
      {reg.stallNumber && (
        <span
          className="text-[10px] font-bold flex-shrink-0"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          #{reg.stallNumber}
        </span>
      )}
      <span
        className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 capitalize"
        style={{ background: meta.bg, color: meta.color }}
      >
        {meta.label}
      </span>
    </div>
  );
}

// ─── Stall row ────────────────────────────────────────────────────────────
function StallRow({ stall }) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
      >
        {stall.bannerImage?.url ? (
          <img
            src={stall.bannerImage.url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-[11px] font-bold">
            #{stall.stallNumber}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-[13px] truncate">
          {stall.projectTitle || "Untitled"}
        </p>
        <p
          className="text-[11px] truncate"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          {stall.owner?.name || "—"} · Stall #{stall.stallNumber}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className="flex items-center gap-1 text-[10.5px]"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          <Eye size={10} /> {stall.viewCount || 0}
        </span>
        <span
          className="flex items-center gap-1 text-[10.5px]"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          <Heart size={10} /> {stall.likeCount || 0}
        </span>
      </div>
      <span
        className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
        style={
          stall.isPublished
            ? { background: "rgba(52,211,153,0.12)", color: "#34d399" }
            : { background: "rgba(251,191,36,0.1)", color: "#fbbf24" }
        }
      >
        {stall.isPublished ? "Published" : "Draft"}
      </span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────
export default function AdminEventView() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Sub-data
  const [registrations, setRegistrations] = useState([]);
  const [regStats, setRegStats] = useState(null);
  const [stalls, setStalls] = useState([]);
  const [regLoading, setRegLoading] = useState(false);
  const [stallsLoading, setStallsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview | registrations | stalls

  // Modals
  const [showReject, setShowReject] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg, type = "success") => setToast({ message: msg, type });

  // ── Load event ────────────────────────────────────────────────────────
  const loadEvent = useCallback(async () => {
    try {
      setLoading(true);
      const res = await eventAPI.getById(eventId);
      setEvent(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const loadRegistrations = useCallback(async () => {
    setRegLoading(true);
    try {
      const [regsRes, statsRes] = await Promise.allSettled([
        registrationAPI.getEventRegistrations(eventId, { limit: 50 }),
        registrationAPI.getStats(eventId),
      ]);
      if (regsRes.status === "fulfilled")
        setRegistrations(regsRes.value.data || []);
      if (statsRes.status === "fulfilled") setRegStats(statsRes.value.data);
    } catch {
    } finally {
      setRegLoading(false);
    }
  }, [eventId]);

  const loadStalls = useCallback(async () => {
    setStallsLoading(true);
    try {
      const res = await stallAPI.getEventStalls(eventId, { limit: 50 });
      setStalls(res.data || []);
    } catch {
    } finally {
      setStallsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  useEffect(() => {
    if (activeTab === "registrations") loadRegistrations();
    if (activeTab === "stalls") loadStalls();
  }, [activeTab]);

  // ── Actions ───────────────────────────────────────────────────────────
  const handleApprove = async () => {
    try {
      setActionLoading("approve");
      await eventAPI.approve(eventId);
      setEvent((e) => ({ ...e, status: "approved" }));
      showToast("Event approved successfully");
    } catch (err) {
      showToast(err.message || "Failed to approve", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reason) => {
    try {
      setActionLoading("reject");
      await eventAPI.reject(eventId, reason);
      setEvent((e) => ({ ...e, status: "rejected", rejectionReason: reason }));
      setShowReject(false);
      showToast("Event rejected");
    } catch (err) {
      showToast(err.message || "Failed to reject", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await eventAPI.delete(eventId);
      navigate("/admin/events");
    } catch (err) {
      showToast(err.message || "Failed to delete", "error");
      setDeleting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="h-screen flex"
        style={{
          background: "#0c0c0f",
          fontFamily: "'DM Sans','Segoe UI',sans-serif",
        }}
      >
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

  if (error || !event) {
    return (
      <div
        className="h-screen flex"
        style={{
          background: "#0c0c0f",
          fontFamily: "'DM Sans','Segoe UI',sans-serif",
        }}
      >
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 flex items-center justify-center px-6">
            <div className="text-center flex flex-col items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: "rgba(248,113,113,0.1)",
                  border: "1px solid rgba(248,113,113,0.2)",
                }}
              >
                <AlertCircle size={24} style={{ color: "#f87171" }} />
              </div>
              <p className="text-white font-semibold">
                {error || "Event not found"}
              </p>
              <Link
                to="/admin/events"
                className="text-violet-400 underline text-sm"
              >
                Back to Events
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const statusMeta = STATUS_META[event.status] || STATUS_META.pending;
  const typeColor = EVENT_TYPE_COLORS[event.eventType] || "#94a3b8";
  const isPending = event.status === "pending";
  const canDelete = ["pending", "rejected", "cancelled"].includes(event.status);
  const fillPct =
    event.numberOfStalls > 0
      ? Math.round(
          ((event.numberOfStalls -
            (event.availableStalls ?? event.numberOfStalls)) /
            event.numberOfStalls) *
            100,
        )
      : 0;

  const TABS = [
    { id: "overview", label: "Overview" },
    {
      id: "registrations",
      label: `Registrations${regStats ? ` (${regStats.total})` : ""}`,
    },
    {
      id: "stalls",
      label: `Stalls${stalls.length > 0 ? ` (${stalls.length})` : ""}`,
    },
  ];

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
        textarea::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <DashboardNavbar />
        <main className="flex-1 overflow-y-auto">
          {/* ── Hero banner ── */}
          <div className="relative overflow-hidden" style={{ minHeight: 200 }}>
            {event.thumbnailUrl ? (
              <img
                src={event.thumbnailUrl}
                alt={event.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg,#1e1b30 0%,#2d1f5e 50%,#1a1040 100%)",
                }}
              >
                <div
                  className="absolute top-[-20%] left-[-10%] w-96 h-96 rounded-full opacity-20"
                  style={{
                    background:
                      "radial-gradient(circle,#7c3aed,transparent 60%)",
                    filter: "blur(60px)",
                  }}
                />
                <div
                  className="absolute bottom-[-20%] right-[-5%] w-72 h-72 rounded-full opacity-15"
                  style={{
                    background:
                      "radial-gradient(circle,#2563eb,transparent 60%)",
                    filter: "blur(50px)",
                  }}
                />
              </div>
            )}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top,#0c0c0f 0%,rgba(12,12,15,0.6) 60%,rgba(12,12,15,0.15) 100%)",
              }}
            />

            {/* Nav overlay */}
            <div className="relative z-10 px-6 md:px-8 pt-6 pb-8">
              <div className="flex items-start justify-between gap-4 mb-8">
                <Link
                  to="/admin/events"
                  className="flex items-center gap-2 text-[13px] font-medium transition-colors flex-shrink-0"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(255,255,255,0.55)")
                  }
                >
                  <ArrowLeft size={14} /> All Events
                </Link>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {isPending && (
                    <>
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading === "approve"}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-semibold text-white transition-all"
                        style={{
                          background: "rgba(52,211,153,0.25)",
                          border: "1px solid rgba(52,211,153,0.4)",
                          backdropFilter: "blur(8px)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(52,211,153,0.38)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(52,211,153,0.25)")
                        }
                      >
                        {actionLoading === "approve" ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-green-400/40 border-t-green-400 animate-spin" />
                        ) : (
                          <CheckCircle size={13} />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => setShowReject(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-semibold transition-all"
                        style={{
                          background: "rgba(0,0,0,0.45)",
                          color: "#fca5a5",
                          border: "1px solid rgba(248,113,113,0.35)",
                          backdropFilter: "blur(8px)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(248,113,113,0.2)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(0,0,0,0.45)")
                        }
                      >
                        <XCircle size={13} /> Reject
                      </button>
                    </>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => setShowDelete(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-semibold transition-all"
                      style={{
                        background: "rgba(0,0,0,0.45)",
                        color: "#f87171",
                        border: "1px solid rgba(248,113,113,0.25)",
                        backdropFilter: "blur(8px)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(239,68,68,0.2)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "rgba(0,0,0,0.45)")
                      }
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Event title + badges */}
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                    <span
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full capitalize"
                      style={{
                        background: `${typeColor}25`,
                        color: typeColor,
                        border: `1px solid ${typeColor}40`,
                        backdropFilter: "blur(6px)",
                      }}
                    >
                      {event.eventType}
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{
                        background: statusMeta.bg,
                        color: statusMeta.color,
                        border: `1px solid ${statusMeta.border}`,
                        backdropFilter: "blur(6px)",
                      }}
                    >
                      {event.status === "live" && (
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ background: statusMeta.color }}
                        />
                      )}
                      {statusMeta.label}
                    </span>
                    {event.archive && (
                      <span
                        className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                        style={{
                          background: "rgba(148,163,184,0.12)",
                          color: "#94a3b8",
                          border: "1px solid rgba(148,163,184,0.2)",
                          backdropFilter: "blur(6px)",
                        }}
                      >
                        Archived
                      </span>
                    )}
                  </div>
                  <h1
                    className="text-white font-bold leading-tight"
                    style={{
                      fontFamily: "'Syne',sans-serif",
                      fontSize: "clamp(22px,4vw,36px)",
                    }}
                  >
                    {event.name}
                  </h1>
                  <p
                    className="text-[13.5px] mt-1.5"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    by {event.createdBy?.name}
                    {event.createdBy?.organization
                      ? ` · ${event.createdBy.organization}`
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Tabs + content ── */}
          <div className="px-6 md:px-8 pb-12">
            {/* Tab bar */}
            <div
              className="flex items-center gap-1 mb-6 border-b"
              style={{ borderColor: "rgba(255,255,255,0.07)" }}
            >
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="relative px-4 py-3 text-[13px] font-medium transition-colors"
                  style={{
                    color:
                      activeTab === id ? "#c4b5fd" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {label}
                  {activeTab === id && (
                    <motion.span
                      layoutId="eventViewTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{
                        background: "linear-gradient(90deg,#7c3aed,#a78bfa)",
                      }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* ── OVERVIEW TAB ── */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: main info */}
                <div className="lg:col-span-2 flex flex-col gap-5">
                  {/* Rejection reason banner */}
                  {event.status === "rejected" && event.rejectionReason && (
                    <div
                      className="p-4 rounded-2xl flex items-start gap-3"
                      style={{
                        background: "rgba(248,113,113,0.08)",
                        border: "1px solid rgba(248,113,113,0.2)",
                      }}
                    >
                      <XCircle
                        size={16}
                        style={{
                          color: "#f87171",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      />
                      <div>
                        <p
                          className="text-[12.5px] font-bold mb-1"
                          style={{ color: "#f87171" }}
                        >
                          Rejection Reason
                        </p>
                        <p
                          className="text-[13px] leading-relaxed"
                          style={{ color: "rgba(255,255,255,0.65)" }}
                        >
                          {event.rejectionReason}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <SectionCard
                    title="About this Event"
                    icon={FileText}
                    accent="#a78bfa"
                  >
                    <p
                      className="text-[13.5px] leading-relaxed whitespace-pre-line"
                      style={{ color: "rgba(255,255,255,0.62)" }}
                    >
                      {event.description || "No description provided."}
                    </p>
                    {event.tags?.length > 0 && (
                      <div
                        className="flex flex-wrap gap-2 mt-4 pt-4"
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        {event.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
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
                  </SectionCard>

                  {/* Stall fill bar */}
                  <SectionCard
                    title="Stall Availability"
                    icon={BarChart}
                    accent="#60a5fa"
                  >
                    <div className="flex items-center justify-between text-[13px] mb-3">
                      <span style={{ color: "rgba(255,255,255,0.55)" }}>
                        {event.numberOfStalls -
                          (event.availableStalls ?? event.numberOfStalls)}{" "}
                        / {event.numberOfStalls} stalls filled
                      </span>
                      <span
                        className="font-bold"
                        style={{ color: fillPct > 80 ? "#f87171" : "#a78bfa" }}
                      >
                        {fillPct}%
                      </span>
                    </div>
                    <div
                      className="h-2.5 rounded-full overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.07)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${fillPct}%`,
                          background:
                            fillPct > 80
                              ? "linear-gradient(90deg,#ef4444,#f87171)"
                              : "linear-gradient(90deg,#7c3aed,#a78bfa)",
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {[
                        { label: "Total Stalls", value: event.numberOfStalls },
                        {
                          label: "Available",
                          value: event.availableStalls ?? event.numberOfStalls,
                        },
                        {
                          label: "Registrations",
                          value: event.registrationCount ?? "—",
                        },
                        { label: "Environment", value: event.environmentType },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="p-3 rounded-xl"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <p
                            className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                            style={{ color: "rgba(255,255,255,0.3)" }}
                          >
                            {label}
                          </p>
                          <p
                            className="text-[15px] font-bold capitalize"
                            style={{ color: "rgba(255,255,255,0.85)" }}
                          >
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  {/* Review history */}
                  {(event.reviewedBy || event.publishedAt) && (
                    <SectionCard
                      title="Review History"
                      icon={Clock}
                      accent="#fbbf24"
                    >
                      <div className="flex flex-col gap-2.5">
                        {event.reviewedBy && (
                          <div
                            className="flex items-center justify-between p-3 rounded-xl"
                            style={{
                              background: "rgba(255,255,255,0.025)",
                              border: "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            <div>
                              <p className="text-[12px] font-semibold text-white">
                                {event.status === "rejected"
                                  ? "Rejected"
                                  : "Reviewed"}{" "}
                                by {event.reviewedBy?.name || "Admin"}
                              </p>
                              <p
                                className="text-[11px]"
                                style={{ color: "rgba(255,255,255,0.38)" }}
                              >
                                {fmtFull(event.reviewedAt)}
                              </p>
                            </div>
                            <span
                              className="text-[10.5px] font-bold px-2.5 py-1 rounded-full capitalize"
                              style={{
                                background: statusMeta.bg,
                                color: statusMeta.color,
                              }}
                            >
                              {statusMeta.label}
                            </span>
                          </div>
                        )}
                        {event.publishedAt && (
                          <div
                            className="flex items-center justify-between p-3 rounded-xl"
                            style={{
                              background: "rgba(255,255,255,0.025)",
                              border: "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            <div>
                              <p className="text-[12px] font-semibold text-white">
                                Published by organizer
                              </p>
                              <p
                                className="text-[11px]"
                                style={{ color: "rgba(255,255,255,0.38)" }}
                              >
                                {fmtFull(event.publishedAt)}
                              </p>
                            </div>
                            <span
                              className="text-[10.5px] font-bold px-2.5 py-1 rounded-full"
                              style={{
                                background: "rgba(96,165,250,0.12)",
                                color: "#60a5fa",
                              }}
                            >
                              Published
                            </span>
                          </div>
                        )}
                        <p
                          className="text-[11px] pt-1"
                          style={{ color: "rgba(255,255,255,0.28)" }}
                        >
                          Submitted {fmtFull(event.createdAt)}
                        </p>
                      </div>
                    </SectionCard>
                  )}
                </div>

                {/* Right: event details */}
                <div className="flex flex-col gap-5">
                  <SectionCard
                    title="Event Details"
                    icon={Info}
                    accent="#34d399"
                  >
                    <InfoRow
                      icon={Calendar}
                      label="Live Date"
                      value={fmt(event.liveDate)}
                      color="#60a5fa"
                    />
                    <InfoRow
                      icon={Clock}
                      label="Time"
                      value={
                        event.startTime && event.endTime
                          ? `${event.startTime} – ${event.endTime}`
                          : event.startTime || "TBD"
                      }
                      color="#a78bfa"
                    />
                    <InfoRow
                      icon={MapPin}
                      label="Venue"
                      value={event.venue || "Virtual"}
                      color="#34d399"
                    />
                    <InfoRow
                      icon={Globe}
                      label="Environment"
                      value={event.environmentType}
                      color="#fbbf24"
                    />
                    <InfoRow
                      icon={Tag}
                      label="Event Type"
                      value={event.eventType}
                      color={typeColor}
                    />
                    <InfoRow
                      icon={Hash}
                      label="Stalls"
                      value={`${event.numberOfStalls} total`}
                      color="#fb923c"
                    />
                    <InfoRow
                      icon={Calendar}
                      label="Submitted"
                      value={fmtShort(event.createdAt)}
                      color="#94a3b8"
                    />
                  </SectionCard>

                  <SectionCard
                    title="Organizer"
                    icon={Building2}
                    accent="#f472b6"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[14px]"
                        style={{
                          background: "linear-gradient(135deg,#7c3aed,#2563eb)",
                        }}
                      >
                        {event.createdBy?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-[14px] truncate">
                          {event.createdBy?.name}
                        </p>
                        {event.createdBy?.organization && (
                          <p
                            className="text-[11.5px] truncate"
                            style={{ color: "rgba(255,255,255,0.4)" }}
                          >
                            {event.createdBy.organization}
                          </p>
                        )}
                      </div>
                    </div>
                    {event.createdBy?.email && (
                      <a
                        href={`mailto:${event.createdBy.email}`}
                        className="flex items-center gap-2 text-[12.5px] transition-colors py-1"
                        style={{ color: "#a78bfa" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "#c4b5fd")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "#a78bfa")
                        }
                      >
                        ✉ {event.createdBy.email}
                      </a>
                    )}
                  </SectionCard>

                  {/* Admin actions */}
                  {(isPending || canDelete) && (
                    <SectionCard
                      title="Admin Actions"
                      icon={ShieldAlert}
                      accent="#fbbf24"
                    >
                      <div className="flex flex-col gap-2">
                        {isPending && (
                          <>
                            <button
                              onClick={handleApprove}
                              disabled={actionLoading === "approve"}
                              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold text-white transition-all"
                              style={{
                                background: "rgba(52,211,153,0.2)",
                                border: "1px solid rgba(52,211,153,0.3)",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(52,211,153,0.3)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(52,211,153,0.2)")
                              }
                            >
                              {actionLoading === "approve" ? (
                                <div className="w-4 h-4 rounded-full border-2 border-green-400/40 border-t-green-400 animate-spin" />
                              ) : (
                                <CheckCircle size={14} />
                              )}
                              Approve Event
                            </button>
                            <button
                              onClick={() => setShowReject(true)}
                              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold transition-all"
                              style={{
                                background: "rgba(248,113,113,0.1)",
                                color: "#fca5a5",
                                border: "1px solid rgba(248,113,113,0.2)",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(248,113,113,0.2)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(248,113,113,0.1)")
                              }
                            >
                              <XCircle size={14} /> Reject with Reason
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setShowDelete(true)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12.5px] font-semibold transition-all mt-1"
                            style={{
                              background: "rgba(239,68,68,0.08)",
                              color: "#f87171",
                              border: "1px solid rgba(239,68,68,0.18)",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                "rgba(239,68,68,0.16)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background =
                                "rgba(239,68,68,0.08)")
                            }
                          >
                            <Trash2 size={13} /> Delete Event
                          </button>
                        )}
                      </div>
                    </SectionCard>
                  )}
                </div>
              </div>
            )}

            {/* ── REGISTRATIONS TAB ── */}
            {activeTab === "registrations" && (
              <div className="flex flex-col gap-5">
                {/* Reg stats */}
                {regStats && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      {
                        label: "Total",
                        value: regStats.total,
                        color: "#a78bfa",
                      },
                      {
                        label: "Pending",
                        value: regStats.pending,
                        color: "#fbbf24",
                      },
                      {
                        label: "Approved",
                        value: regStats.approved,
                        color: "#34d399",
                      },
                      {
                        label: "Rejected",
                        value: regStats.rejected,
                        color: "#f87171",
                      },
                      {
                        label: "Cancelled",
                        value: regStats.cancelled,
                        color: "#94a3b8",
                      },
                    ].map(({ label, value, color }) => (
                      <div
                        key={label}
                        className="p-4 rounded-2xl"
                        style={{
                          background: "rgba(255,255,255,0.025)",
                          border: "1px solid rgba(255,255,255,0.07)",
                        }}
                      >
                        <p
                          className="text-[22px] font-bold text-white"
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
                        <div
                          className="h-0.5 w-8 rounded-full mt-2"
                          style={{ background: color }}
                        />
                      </div>
                    ))}
                  </div>
                )}
                {regLoading ? (
                  <div className="flex flex-col gap-3">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="h-16 rounded-2xl animate-pulse"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      />
                    ))}
                  </div>
                ) : registrations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Users
                      size={28}
                      style={{ color: "rgba(255,255,255,0.1)" }}
                    />
                    <p
                      className="text-[13px]"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      No registrations yet
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {registrations.map((reg) => (
                      <RegistrationRow key={reg._id} reg={reg} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── STALLS TAB ── */}
            {activeTab === "stalls" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p
                    className="text-[13px]"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    {stalls.length} stall{stalls.length !== 1 ? "s" : ""} found
                  </p>
                  <div
                    className="flex items-center gap-3 text-[12px]"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    <span>
                      {stalls.filter((s) => s.isPublished).length} published
                    </span>
                    <span>
                      {stalls.filter((s) => !s.isPublished).length} drafts
                    </span>
                  </div>
                </div>
                {stallsLoading ? (
                  <div className="flex flex-col gap-3">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="h-16 rounded-2xl animate-pulse"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      />
                    ))}
                  </div>
                ) : stalls.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Building
                      size={28}
                      style={{ color: "rgba(255,255,255,0.1)" }}
                    />
                    <p
                      className="text-[13px]"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      No stalls yet
                    </p>
                    <p
                      className="text-[12px]"
                      style={{ color: "rgba(255,255,255,0.2)" }}
                    >
                      Stalls are created after registrations are approved
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {stalls.map((stall) => (
                      <StallRow key={stall._id} stall={stall} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {showReject && (
          <RejectModal
            eventName={event.name}
            onConfirm={handleReject}
            onCancel={() => setShowReject(false)}
            loading={actionLoading === "reject"}
          />
        )}
        {showDelete && (
          <DeleteModal
            eventName={event.name}
            onConfirm={handleDelete}
            onCancel={() => setShowDelete(false)}
            loading={deleting}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && (
          <Toast key={Date.now()} {...toast} onDone={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
