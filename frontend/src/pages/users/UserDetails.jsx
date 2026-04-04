import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Shield,
  UserCheck,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Edit,
  Save,
  X,
  ShieldAlert,
  Bell,
  CalendarDays,
  Ticket,
  LayoutDashboard,
  Activity,
  RefreshCw,
} from "lucide-react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import {
  userAPI,
  eventAPI,
  registrationAPI,
  stallAPI,
  notificationAPI,
} from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────
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
  const m = Math.floor(diff / 60000),
    h = Math.floor(diff / 3600000),
    days = Math.floor(diff / 86400000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${days}d ago`;
};

const ROLE_META = {
  user: {
    label: "Event Admin",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
    border: "rgba(167,139,250,0.25)",
    icon: UserCheck,
  },
  admin: {
    label: "System Admin",
    color: "#f472b6",
    bg: "rgba(244,114,182,0.12)",
    border: "rgba(244,114,182,0.25)",
    icon: Shield,
  },
};

// Notification type → icon + color mapping
const NOTIF_META = {
  event_approved: { color: "#34d399", label: "Event Approved" },
  event_rejected: { color: "#f87171", label: "Event Rejected" },
  event_submitted: { color: "#60a5fa", label: "Event Submitted" },
  event_published: { color: "#34d399", label: "Event Published" },
  event_pending_approval: { color: "#fbbf24", label: "Pending Approval" },
  event_reminder: { color: "#fb923c", label: "Event Reminder" },
  event_reminder_24h: { color: "#fb923c", label: "Reminder 24h" },
  event_reminder_1h: { color: "#fb923c", label: "Reminder 1h" },
  event_starting_soon: { color: "#fb923c", label: "Starting Soon" },
  event_ended: { color: "#94a3b8", label: "Event Ended" },
  registration_received: { color: "#60a5fa", label: "Registration Received" },
  registration_submitted: { color: "#60a5fa", label: "Registration Submitted" },
  registration_approved: { color: "#34d399", label: "Registration Approved" },
  registration_rejected: { color: "#f87171", label: "Registration Rejected" },
  registration_cancelled: { color: "#94a3b8", label: "Cancelled" },
  stall_created: { color: "#a78bfa", label: "Stall Created" },
  stall_published: { color: "#34d399", label: "Stall Published" },
  welcome: { color: "#fbbf24", label: "Welcome" },
  account_created: { color: "#fbbf24", label: "Account Created" },
  new_user: { color: "#60a5fa", label: "New User" },
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
const lockedBase = {
  ...inputBase,
  background: "rgba(255,255,255,0.02)",
  color: "rgba(255,255,255,0.28)",
  cursor: "not-allowed",
  border: "1px solid rgba(255,255,255,0.06)",
};

function FocusInput({ locked, icon: Icon, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      {Icon && (
        <Icon
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            color: locked
              ? "rgba(255,255,255,0.15)"
              : focused
                ? "#a78bfa"
                : "rgba(255,255,255,0.25)",
          }}
        />
      )}
      <input
        {...props}
        disabled={locked}
        style={{
          ...(locked ? lockedBase : inputBase),
          paddingLeft: Icon ? 38 : 14,
          borderColor: locked
            ? "rgba(255,255,255,0.06)"
            : focused
              ? "rgba(167,139,250,0.5)"
              : "rgba(255,255,255,0.1)",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

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

// ─── Delete modal ─────────────────────────────────────────────────────────
function DeleteModal({ user, onConfirm, onCancel, loading }) {
  const [confirmText, setConfirmText] = useState("");
  const allowed = confirmText === user?.name;
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
            <ShieldAlert size={18} style={{ color: "#f87171" }} />
          </div>
          <div>
            <h3
              className="text-white font-bold text-[15px]"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              Delete User
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
          Permanently deletes{" "}
          <strong style={{ color: "white" }}>{user?.name}</strong> and all their
          data.
        </p>
        <div className="flex flex-col gap-1.5">
          <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            Type <strong style={{ color: "white" }}>{user?.name}</strong> to
            confirm
          </p>
          <input
            type="text"
            placeholder={user?.name}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
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
            {loading ? "Deleting…" : "Confirm Delete"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon: Icon, loading }) {
  return (
    <div
      className="flex flex-col gap-2 p-4 rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.025)",
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
        {loading ? (
          <div
            className="h-7 w-12 rounded animate-pulse"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
        ) : (
          <p
            className="text-[26px] font-bold leading-none text-white"
            style={{ fontFamily: "'Syne',sans-serif" }}
          >
            {value ?? "—"}
          </p>
        )}
        <p
          className="text-[11.5px] mt-1"
          style={{ color: "rgba(255,255,255,0.38)" }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, color = "#a78bfa" }) {
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
          style={{
            color:
              value && value !== "—"
                ? "rgba(255,255,255,0.78)"
                : "rgba(255,255,255,0.22)",
          }}
        >
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

// ─── Activity / notification item ─────────────────────────────────────────
function ActivityItem({ notif }) {
  const meta = NOTIF_META[notif.type] || {
    color: "#a78bfa",
    label: notif.type,
  };
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl transition-colors"
      style={{
        background: notif.isRead
          ? "rgba(255,255,255,0.02)"
          : "rgba(167,139,250,0.06)",
        border: `1px solid ${notif.isRead ? "rgba(255,255,255,0.05)" : "rgba(167,139,250,0.15)"}`,
      }}
    >
      {/* Color dot */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: `${meta.color}18`,
          border: `1px solid ${meta.color}28`,
        }}
      >
        <Bell size={12} style={{ color: meta.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-[13px] font-semibold leading-snug"
            style={{ color: "rgba(255,255,255,0.88)" }}
          >
            {notif.title}
          </p>
          {!notif.isRead && (
            <span
              className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
              style={{ background: "#a78bfa" }}
            />
          )}
        </div>
        <p
          className="text-[11.5px] mt-0.5 leading-relaxed"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          {notif.message}
        </p>
        <p
          className="text-[10.5px] mt-1.5"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          {fmtRelative(notif.createdAt)}
        </p>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────
export default function UserDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [notifsLoading, setNotifsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(false);

  // Stats fetched from existing APIs
  const [stats, setStats] = useState({
    events: null,
    registrations: null,
    stalls: null,
  });

  // Activity = this user's notifications (fetched as admin viewing)
  const [notifications, setNotifications] = useState([]);

  // Edit form
  const [form, setForm] = useState({
    name: "",
    organization: "",
    phoneNumber: "",
  });
  const [original, setOriginal] = useState(null);

  const showToast = (msg, type = "success") => setToast({ message: msg, type });

  // ── Load user ─────────────────────────────────────────────────────────
  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await userAPI.getById(userId);
      const u = res.data;
      setUser(u);
      const mapped = {
        name: u.name || "",
        organization: u.organization || "",
        phoneNumber: u.phoneNumber || "",
      };
      setForm(mapped);
      setOriginal(JSON.parse(JSON.stringify(mapped)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ── Load stats from existing APIs ─────────────────────────────────────
  // We use eventAPI.getAll with createdBy filter, and count registrations/stalls
  // These APIs are what your backend already has — we just count results.
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      // Fetch all events, filter by this user on client side
      // (your eventAPI.getAll() is admin-only and returns all events)
      const [eventsRes, stallsRes] = await Promise.allSettled([
        eventAPI.getAll({ limit: 999 }),
        stallAPI.getMyStalls?.() ?? Promise.reject("no endpoint"),
      ]);

      // Count events created by this user
      let eventCount = 0;
      if (eventsRes.status === "fulfilled") {
        const allEvents = eventsRes.value?.data || [];
        eventCount = allEvents.filter(
          (e) => e.createdBy?._id === userId || e.createdBy === userId,
        ).length;
      }

      // Stalls: we can only get global count if the admin endpoint returns all stalls,
      // otherwise we show N/A until your friend adds the endpoint
      setStats({
        events: eventCount,
        registrations: null, // no admin "all registrations" endpoint yet
        stalls: null, // no admin "stalls by user" endpoint yet
      });
    } catch {
      setStats({ events: null, registrations: null, stalls: null });
    } finally {
      setStatsLoading(false);
    }
  }, [userId]);

  // ── Load notifications as activity ────────────────────────────────────
  // The notificationAPI.getAll() is scoped to the logged-in user (the admin),
  // not the target user. We show a note about this + still display what we have.
  // Once your friend adds GET /notifications/user/:userId (admin endpoint),
  // swap the call below.
  const loadActivity = useCallback(async () => {
    setNotifsLoading(true);
    try {
      const res = await notificationAPI.getAll(50, 0);
      setNotifications(res.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setNotifsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
    loadStats();
    loadActivity();
  }, [userId]);

  const isDirty = original && JSON.stringify(form) !== JSON.stringify(original);

  // ── Save profile edit ─────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await userAPI.update(userId, form);
      setUser(res.data);
      setOriginal(JSON.parse(JSON.stringify(form)));
      setEditing(false);
      showToast("User updated successfully");
    } catch (err) {
      showToast(err.message || "Failed to update", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active status ──────────────────────────────────────────────
  // Uses PUT /users/:userId with isActive field
  // (your updateUser controller accepts any field including isActive)
  const handleToggleActive = async () => {
    try {
      setToggling(true);
      const res = await userAPI.update(userId, { isActive: !user.isActive });
      setUser(res.data);
      showToast(`Account ${res.data.isActive ? "activated" : "deactivated"}`);
    } catch (err) {
      showToast(err.message || "Failed to update status", "error");
    } finally {
      setToggling(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await userAPI.delete(userId);
      navigate("/admin/users");
    } catch (err) {
      showToast(err.message || "Failed to delete", "error");
      setDeleting(false);
    }
  };

  const cancelEdit = () => {
    setForm(JSON.parse(JSON.stringify(original)));
    setEditing(false);
  };

  // ── Guards ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="min-h-screen flex"
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
                Loading user…
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div
        className="min-h-screen flex"
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
                {error || "User not found"}
              </p>
              <Link
                to="/admin/users"
                className="text-violet-400 underline text-sm"
              >
                Back to Users
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const role = ROLE_META[user.role] || ROLE_META.user;
  const RoleIcon = role.icon;

  return (
    <div
      className="min-h-screen flex"
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
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <DashboardNavbar />
        <main className="flex-1 overflow-y-auto px-6 md:px-8 py-7">
          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-start justify-between gap-4 mb-7 flex-wrap"
          >
            <div className="flex items-center gap-4 min-w-0">
              <Link
                to="/admin/users"
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
              </Link>

              {/* Avatar + name inline */}
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg,#7c3aed,#2563eb)",
                    fontFamily: "'Syne',sans-serif",
                  }}
                >
                  {user.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1
                      className="text-white text-xl font-bold truncate"
                      style={{ fontFamily: "'Syne',sans-serif" }}
                    >
                      {user.name}
                    </h1>
                    <span
                      className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{
                        background: role.bg,
                        color: role.color,
                        border: `1px solid ${role.border}`,
                      }}
                    >
                      <RoleIcon size={11} /> {role.label}
                    </span>
                    <span
                      className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={
                        user.isActive
                          ? {
                              background: "rgba(52,211,153,0.1)",
                              color: "#34d399",
                              border: "1px solid rgba(52,211,153,0.2)",
                            }
                          : {
                              background: "rgba(148,163,184,0.1)",
                              color: "#94a3b8",
                              border: "1px solid rgba(148,163,184,0.2)",
                            }
                      }
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: user.isActive ? "#34d399" : "#94a3b8",
                        }}
                      />
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p
                    className="text-[12.5px] mt-0.5 truncate"
                    style={{ color: "rgba(255,255,255,0.38)" }}
                  >
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {/* Toggle active */}
              <button
                onClick={handleToggleActive}
                disabled={toggling}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-semibold transition-all"
                style={
                  user.isActive
                    ? {
                        background: "rgba(251,191,36,0.1)",
                        color: "#fbbf24",
                        border: "1px solid rgba(251,191,36,0.22)",
                      }
                    : {
                        background: "rgba(52,211,153,0.1)",
                        color: "#34d399",
                        border: "1px solid rgba(52,211,153,0.22)",
                      }
                }
              >
                {toggling ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : user.isActive ? (
                  <XCircle size={13} />
                ) : (
                  <CheckCircle size={13} />
                )}
                {user.isActive ? "Deactivate" : "Activate"}
              </button>

              {editing ? (
                <>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-medium transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      color: "rgba(255,255,255,0.5)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <X size={13} /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!isDirty || saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-semibold text-white transition-all"
                    style={
                      isDirty
                        ? {
                            background:
                              "linear-gradient(135deg,#7c3aed,#6d28d9)",
                            border: "1px solid rgba(167,139,250,0.25)",
                            boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
                          }
                        : {
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "rgba(255,255,255,0.3)",
                            cursor: "not-allowed",
                          }
                    }
                  >
                    {saving ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    ) : (
                      <Save size={13} />
                    )}
                    {saving ? "Saving…" : "Save"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-semibold transition-all"
                  style={{
                    background: "rgba(167,139,250,0.12)",
                    color: "#c4b5fd",
                    border: "1px solid rgba(167,139,250,0.22)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(167,139,250,0.22)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(167,139,250,0.12)")
                  }
                >
                  <Edit size={13} /> Edit
                </button>
              )}

              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-semibold transition-all"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color: "#fca5a5",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(239,68,68,0.2)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(239,68,68,0.1)")
                }
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </motion.div>

          {/* ── Stat cards ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-3 gap-4 mb-7"
          >
            <StatCard
              label="Events Created"
              value={stats.events}
              color="#60a5fa"
              icon={CalendarDays}
              loading={statsLoading}
            />
            <StatCard
              label="Registrations"
              value={stats.registrations !== null ? stats.registrations : "—"}
              color="#34d399"
              icon={Ticket}
              loading={false}
            />
            <StatCard
              label="Stalls"
              value={stats.stalls !== null ? stats.stalls : "—"}
              color="#a78bfa"
              icon={LayoutDashboard}
              loading={false}
            />
          </motion.div>

          {/* Note about missing endpoints */}
          {(stats.registrations === null || stats.stalls === null) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-6 p-3.5 rounded-xl text-[12px] flex items-center gap-2.5"
              style={{
                background: "rgba(251,191,36,0.06)",
                border: "1px solid rgba(251,191,36,0.15)",
                color: "#fde68a",
              }}
            >
              <AlertCircle
                size={13}
                style={{ color: "#fbbf24", flexShrink: 0 }}
              />
              Registration & stall counts require backend endpoints
              <code
                className="px-1.5 py-0.5 rounded text-[11px]"
                style={{ background: "rgba(0,0,0,0.3)" }}
              >
                GET /users/:userId/stats
              </code>
              — ask your friend to add it.
            </motion.div>
          )}

          {/* ── Main grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Left: personal info + account meta ── */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 }}
              className="flex flex-col gap-5"
            >
              {/* Edit form */}
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
                    style={{
                      background: "rgba(167,139,250,0.15)",
                      border: "1px solid rgba(167,139,250,0.25)",
                    }}
                  >
                    <Edit size={14} style={{ color: "#c4b5fd" }} />
                  </div>
                  <h2
                    className="text-white font-bold text-[14px]"
                    style={{ fontFamily: "'Syne',sans-serif" }}
                  >
                    Profile
                  </h2>
                </div>
                <div className="p-5 flex flex-col gap-3.5">
                  {!editing && (
                    <div
                      className="p-3 rounded-xl text-[11.5px]"
                      style={{
                        background: "rgba(167,139,250,0.06)",
                        border: "1px solid rgba(167,139,250,0.14)",
                        color: "#c4b5fd",
                      }}
                    >
                      Click <strong>Edit</strong> above to modify
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-[10.5px] font-bold uppercase tracking-widest"
                      style={{ color: "rgba(255,255,255,0.38)" }}
                    >
                      Full Name
                    </label>
                    <FocusInput
                      locked={!editing}
                      placeholder="Full name"
                      value={form.name}
                      maxLength={50}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-[10.5px] font-bold uppercase tracking-widest flex items-center gap-1.5"
                      style={{ color: "rgba(255,255,255,0.28)" }}
                    >
                      Email
                      <span
                        className="normal-case font-normal text-[9.5px] px-1.5 py-0.5 rounded"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.28)",
                        }}
                      >
                        Read-only
                      </span>
                    </label>
                    <FocusInput locked value={user.email} readOnly />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-[10.5px] font-bold uppercase tracking-widest"
                      style={{ color: "rgba(255,255,255,0.38)" }}
                    >
                      Organization
                    </label>
                    <FocusInput
                      icon={Building2}
                      locked={!editing}
                      placeholder="Company or institution"
                      value={form.organization}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, organization: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-[10.5px] font-bold uppercase tracking-widest"
                      style={{ color: "rgba(255,255,255,0.38)" }}
                    >
                      Phone
                    </label>
                    <FocusInput
                      locked={!editing}
                      placeholder="+1 234 567 8900"
                      value={form.phoneNumber}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phoneNumber: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Account metadata */}
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-3"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                >
                  Account Info
                </p>
                <InfoRow
                  icon={Calendar}
                  label="Joined"
                  value={fmt(user.createdAt)}
                  color="#60a5fa"
                />
                <InfoRow
                  icon={Clock}
                  label="Last Login"
                  value={fmtFull(user.lastLogin)}
                  color="#a78bfa"
                />
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={user.email}
                  color="#60a5fa"
                />
                <InfoRow
                  icon={Phone}
                  label="Phone"
                  value={user.phoneNumber}
                  color="#34d399"
                />
                <InfoRow
                  icon={Building2}
                  label="Organization"
                  value={user.organization}
                  color="#fbbf24"
                />
                <div className="flex items-center gap-2 pt-3">
                  <p
                    className="text-[10.5px]"
                    style={{ color: "rgba(255,255,255,0.28)" }}
                  >
                    ID:
                  </p>
                  <code
                    className="text-[10.5px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.45)",
                    }}
                  >
                    {user._id}
                  </code>
                </div>
              </div>

              {/* Danger zone */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(239,68,68,0.04)",
                  border: "1px solid rgba(239,68,68,0.18)",
                }}
              >
                <div
                  className="px-5 py-3.5 flex items-center gap-2.5"
                  style={{ borderBottom: "1px solid rgba(239,68,68,0.12)" }}
                >
                  <Trash2 size={14} style={{ color: "#f87171" }} />
                  <h3
                    className="text-[13px] font-bold text-white"
                    style={{ fontFamily: "'Syne',sans-serif" }}
                  >
                    Danger Zone
                  </h3>
                </div>
                <div className="p-4">
                  <p
                    className="text-[12px] mb-3"
                    style={{ color: "rgba(255,255,255,0.38)" }}
                  >
                    Permanently deletes this account including all events,
                    registrations and stalls.
                  </p>
                  <button
                    onClick={() => setShowDelete(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12.5px] font-semibold transition-all"
                    style={{
                      background: "rgba(239,68,68,0.15)",
                      color: "#fca5a5",
                      border: "1px solid rgba(239,68,68,0.25)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(239,68,68,0.25)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(239,68,68,0.15)")
                    }
                  >
                    <Trash2 size={13} /> Delete User Account
                  </button>
                </div>
              </div>
            </motion.div>

            {/* ── Right: activity (notifications) ── */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{
                        background: "rgba(251,191,36,0.12)",
                        border: "1px solid rgba(251,191,36,0.22)",
                      }}
                    >
                      <Activity size={14} style={{ color: "#fbbf24" }} />
                    </div>
                    <div>
                      <h2
                        className="text-white font-bold text-[14px]"
                        style={{ fontFamily: "'Syne',sans-serif" }}
                      >
                        Activity
                      </h2>
                      <p
                        className="text-[10.5px]"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        Showing your admin notifications — user-specific
                        activity requires
                        <code
                          className="ml-1 px-1 rounded text-[9.5px]"
                          style={{ background: "rgba(255,255,255,0.08)" }}
                        >
                          GET /notifications/user/:userId
                        </code>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={loadActivity}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "white")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "rgba(255,255,255,0.3)")
                    }
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>

                <div className="p-4 flex flex-col gap-2.5 max-h-[600px] overflow-y-auto">
                  {notifsLoading ? (
                    [...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="h-16 rounded-xl animate-pulse"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      />
                    ))
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <Bell
                        size={28}
                        style={{ color: "rgba(255,255,255,0.1)" }}
                      />
                      <p
                        className="text-[13px]"
                        style={{ color: "rgba(255,255,255,0.28)" }}
                      >
                        No activity yet
                      </p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <ActivityItem key={n._id} notif={n} />
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {showDelete && (
          <DeleteModal
            user={user}
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
