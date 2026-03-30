// pages/notifications/NotificationsPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  Ticket,
  LayoutDashboard,
  CheckCheck,
  XCircle,
  Clock,
  Radio,
  Send,
  Trash2,
  Loader2,
  Search,
  X,
  RotateCcw,
  Settings,
  Eye,
  ChevronRight,
  User,
  Home,
  FileText,
} from "lucide-react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { notificationAPI } from "@/lib/api";

// ─── Notification Type Configuration ──────────────────────────────────────
const NOTIFICATION_META = {
  // Event related
  event_approved: {
    label: "Event Approved",
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
    border: "rgba(52,211,153,0.25)",
    icon: CheckCircle,
    category: "event",
  },
  event_rejected: {
    label: "Event Rejected",
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
    border: "rgba(248,113,113,0.25)",
    icon: AlertCircle,
    category: "event",
  },
  event_published: {
    label: "Event Published",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
    border: "rgba(96,165,250,0.25)",
    icon: Radio,
    category: "event",
  },
  event_submitted: {
    label: "Event Submitted",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    border: "rgba(251,191,36,0.25)",
    icon: Send,
    category: "event",
  },
  event_reminder_24h: {
    label: "24h Reminder",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
    border: "rgba(167,139,250,0.25)",
    icon: Clock,
    category: "reminder",
  },
  event_reminder_1h: {
    label: "1h Reminder",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    border: "rgba(251,191,36,0.25)",
    icon: Clock,
    category: "reminder",
  },
  event_ended: {
    label: "Event Ended",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.12)",
    border: "rgba(148,163,184,0.2)",
    icon: CheckCheck,
    category: "event",
  },

  // Registration related
  registration_approved: {
    label: "Registration Approved",
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
    border: "rgba(52,211,153,0.25)",
    icon: CheckCircle,
    category: "registration",
  },
  registration_rejected: {
    label: "Registration Rejected",
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
    border: "rgba(248,113,113,0.25)",
    icon: XCircle,
    category: "registration",
  },
  registration_submitted: {
    label: "Registration Submitted",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    border: "rgba(251,191,36,0.25)",
    icon: FileText,
    category: "registration",
  },
  registration_cancelled: {
    label: "Registration Cancelled",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.12)",
    border: "rgba(148,163,184,0.2)",
    icon: XCircle,
    category: "registration",
  },

  // Stall related
  stall_created: {
    label: "Stall Created",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
    border: "rgba(96,165,250,0.25)",
    icon: Home,
    category: "stall",
  },
  stall_published: {
    label: "Stall Published",
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
    border: "rgba(52,211,153,0.25)",
    icon: Home,
    category: "stall",
  },

  // System related
  welcome: {
    label: "Welcome",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
    border: "rgba(167,139,250,0.25)",
    icon: User,
    category: "system",
  },
  account_created: {
    label: "Account Created",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
    border: "rgba(167,139,250,0.25)",
    icon: User,
    category: "system",
  },
  default: {
    label: "Notification",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.1)",
    border: "rgba(148,163,184,0.2)",
    icon: Bell,
    category: "other",
  },
};

const CATEGORY_TABS = [
  { id: "all", label: "All", icon: Bell, color: "#a78bfa" },
  { id: "event", label: "Events", icon: CalendarDays, color: "#60a5fa" },
  {
    id: "registration",
    label: "Registrations",
    icon: Ticket,
    color: "#34d399",
  },
  { id: "stall", label: "Stalls", icon: LayoutDashboard, color: "#fbbf24" },
  { id: "reminder", label: "Reminders", icon: Clock, color: "#a78bfa" },
  { id: "system", label: "System", icon: Settings, color: "#94a3b8" },
];

const STATUS_FILTERS = ["all", "unread", "read"];

const getNavigationPath = (notification) => {
  if (!notification.referenceId) return null;

  const referenceId = notification.referenceId._id || notification.referenceId;
  const model = notification.referenceModel;

  switch (model) {
    case "Event":
      return `/events/${referenceId}`;
    case "Registration":
      return `/registration/${referenceId}`;
    case "Stall":
      return `/user/stalls/${referenceId}`;
    default:
      return null;
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

function StatusBadge({ type }) {
  const meta = NOTIFICATION_META[type] || NOTIFICATION_META.default;
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0"
      style={{
        background: meta.bg,
        color: meta.color,
        border: `1px solid ${meta.border}`,
      }}
    >
      <Icon size={11} />
      {meta.label}
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

function SkeletonCard() {
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
          className="w-10 h-10 rounded-xl flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.07)" }}
        />
        <div className="flex-1 flex flex-col gap-2">
          <div
            className="h-3 rounded w-1/3"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
          <div
            className="h-2 rounded w-2/3"
            style={{ background: "rgba(255,255,255,0.04)" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [processingRead, setProcessingRead] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationAPI.getAll(100, 0);
      setNotifications(response.data || []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId, e) => {
    e?.stopPropagation();
    if (processingRead === notificationId) return;

    setProcessingRead(notificationId);
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n,
        ),
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    } finally {
      setProcessingRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDeleteNotification = async (notificationId, e) => {
    e?.stopPropagation();
    if (deletingId === notificationId) return;

    setDeletingId(notificationId);
    try {
      await notificationAPI.delete(notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleNotificationClick = (notification) => {
    const path = getNavigationPath(notification);
    if (path) {
      navigate(path);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    const meta =
      NOTIFICATION_META[notification.type] || NOTIFICATION_META.default;

    // Category filter
    if (categoryFilter !== "all" && meta.category !== categoryFilter) {
      return false;
    }

    // Status filter
    if (statusFilter === "unread" && notification.isRead) return false;
    if (statusFilter === "read" && !notification.isRead) return false;

    // Search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        notification.title?.toLowerCase().includes(searchLower) ||
        notification.message?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const stats = {
    total: notifications.length,
    unread: notifications.filter((n) => !n.isRead).length,
    read: notifications.filter((n) => n.isRead).length,
    event: notifications.filter(
      (n) => NOTIFICATION_META[n.type]?.category === "event",
    ).length,
    registration: notifications.filter(
      (n) => NOTIFICATION_META[n.type]?.category === "registration",
    ).length,
    stall: notifications.filter(
      (n) => NOTIFICATION_META[n.type]?.category === "stall",
    ).length,
    reminder: notifications.filter(
      (n) => NOTIFICATION_META[n.type]?.category === "reminder",
    ).length,
    system: notifications.filter(
      (n) => NOTIFICATION_META[n.type]?.category === "system",
    ).length,
  };

  const hasFilters =
    categoryFilter !== "all" || statusFilter !== "all" || searchQuery;

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
                Notifications
              </h1>
              <p
                className="text-[13px] mt-0.5"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Stay updated with the latest activities
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/user/settings?tab=notifications"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  color: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                }}
              >
                <Settings size={14} />
                Settings
              </Link>
              {stats.unread > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markingAll}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                  style={{
                    background: "rgba(124,58,237,0.15)",
                    color: "#c4b5fd",
                    border: "1px solid rgba(124,58,237,0.25)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(124,58,237,0.25)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(124,58,237,0.15)")
                  }
                >
                  {markingAll ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCheck size={14} />
                  )}
                  Mark all read
                </button>
              )}
            </div>
          </motion.div>

          {/* ══ STAT CARDS ══════════════════════════════════════════════ */}
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-3 mb-7">
              {[...Array(7)].map((_, i) => (
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
              className="grid grid-cols-3 sm:grid-cols-7 gap-3 mb-7"
            >
              <StatCard
                label="Total"
                value={stats.total}
                color="#a78bfa"
                icon={Bell}
                onClick={() => {
                  setCategoryFilter("all");
                  setStatusFilter("all");
                }}
                active={categoryFilter === "all" && statusFilter === "all"}
              />
              <StatCard
                label="Unread"
                value={stats.unread}
                color="#fbbf24"
                icon={Clock}
                onClick={() => {
                  setStatusFilter("unread");
                  setCategoryFilter("all");
                }}
                active={statusFilter === "unread"}
              />
              <StatCard
                label="Events"
                value={stats.event}
                color="#60a5fa"
                icon={CalendarDays}
                onClick={() => {
                  setCategoryFilter("event");
                  setStatusFilter("all");
                }}
                active={categoryFilter === "event"}
              />
              <StatCard
                label="Registrations"
                value={stats.registration}
                color="#34d399"
                icon={Ticket}
                onClick={() => {
                  setCategoryFilter("registration");
                  setStatusFilter("all");
                }}
                active={categoryFilter === "registration"}
              />
              <StatCard
                label="Stalls"
                value={stats.stall}
                color="#fbbf24"
                icon={LayoutDashboard}
                onClick={() => {
                  setCategoryFilter("stall");
                  setStatusFilter("all");
                }}
                active={categoryFilter === "stall"}
              />
              <StatCard
                label="Reminders"
                value={stats.reminder}
                color="#a78bfa"
                icon={Clock}
                onClick={() => {
                  setCategoryFilter("reminder");
                  setStatusFilter("all");
                }}
                active={categoryFilter === "reminder"}
              />
              <StatCard
                label="System"
                value={stats.system}
                color="#94a3b8"
                icon={Settings}
                onClick={() => {
                  setCategoryFilter("system");
                  setStatusFilter("all");
                }}
                active={categoryFilter === "system"}
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
            {/* Row 1: search */}
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
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
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
                  {filteredNotifications.length} notification
                  {filteredNotifications.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Row 2: category filter tabs */}
            <div
              className="flex items-center gap-1 px-4 py-2.5 overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {CATEGORY_TABS.map((tab) => {
                const count = stats[tab.id] || 0;
                const isActive =
                  categoryFilter === tab.id && statusFilter === "all";
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setCategoryFilter(tab.id);
                      setStatusFilter("all");
                    }}
                    className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-medium transition-all duration-150 flex-shrink-0 capitalize"
                    style={
                      isActive
                        ? {
                            background: `${tab.color}18`,
                            color: tab.color,
                            border: `1px solid ${tab.color}40`,
                          }
                        : categoryFilter === tab.id && statusFilter !== "all"
                          ? {
                              background: `${tab.color}10`,
                              color: tab.color,
                              border: `1px solid ${tab.color}30`,
                              opacity: 0.7,
                            }
                          : {
                              color: "rgba(255,255,255,0.38)",
                              background: "transparent",
                              border: "1px solid transparent",
                            }
                    }
                  >
                    <tab.icon size={12} />
                    {tab.label}
                    <span
                      className="text-[9.5px] font-bold px-1.5 py-px rounded-full min-w-[18px] text-center"
                      style={{
                        background: isActive
                          ? "rgba(255,255,255,0.12)"
                          : "rgba(255,255,255,0.07)",
                        color: isActive ? "white" : "rgba(255,255,255,0.3)",
                      }}
                    >
                      {count}
                    </span>
                    {isActive && (
                      <motion.span
                        layoutId="notifCategoryTab"
                        className="absolute bottom-0 left-3 right-3 h-px rounded-full"
                        style={{
                          background: `linear-gradient(90deg,${tab.color},${tab.color}88)`,
                        }}
                      />
                    )}
                  </button>
                );
              })}

              {/* Status filter chips */}
              <div className="flex items-center gap-1 ml-4 pl-4 border-l border-white/10">
                {STATUS_FILTERS.map((status) => {
                  const count = status === "all" ? stats.total : stats[status];
                  const isActive = statusFilter === status;
                  return (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                      style={
                        isActive
                          ? {
                              background: "rgba(124,58,237,0.2)",
                              color: "#c4b5fd",
                              border: "1px solid rgba(124,58,237,0.3)",
                            }
                          : {
                              background: "rgba(255,255,255,0.03)",
                              color: "rgba(255,255,255,0.5)",
                              border: "1px solid transparent",
                            }
                      }
                    >
                      {status === "all"
                        ? "All"
                        : status === "unread"
                          ? "Unread"
                          : "Read"}
                      {count > 0 && (
                        <span
                          className="ml-1 text-[9px]"
                          style={{ opacity: 0.7 }}
                        >
                          ({count})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {hasFilters && (
                <button
                  onClick={() => {
                    setCategoryFilter("all");
                    setStatusFilter("all");
                    setSearchQuery("");
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

          {/* ══ NOTIFICATIONS LIST ═══════════════════════════════════════ */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
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
                <Bell size={22} style={{ color: "rgba(255,255,255,0.14)" }} />
              </div>
              <p className="text-white font-semibold">
                {searchQuery ||
                categoryFilter !== "all" ||
                statusFilter !== "all"
                  ? "No notifications match"
                  : "No notifications yet"}
              </p>
              <p
                className="text-[13px]"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : categoryFilter !== "all"
                    ? `No ${categoryFilter} notifications`
                    : statusFilter !== "all"
                      ? `No ${statusFilter} notifications`
                      : "You'll receive notifications when there are updates"}
              </p>
              {hasFilters && (
                <button
                  onClick={() => {
                    setCategoryFilter("all");
                    setStatusFilter("all");
                    setSearchQuery("");
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
            <div className="space-y-2">
              {filteredNotifications.map((notification, index) => {
                const meta =
                  NOTIFICATION_META[notification.type] ||
                  NOTIFICATION_META.default;
                const Icon = meta.icon;
                const navPath = getNavigationPath(notification);

                return (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                    onClick={() => handleNotificationClick(notification)}
                    className={`group relative rounded-2xl transition-all duration-200 ${
                      navPath ? "cursor-pointer" : ""
                    }`}
                    style={{
                      background: !notification.isRead
                        ? meta.bg
                        : "rgba(255,255,255,0.02)",
                      border: `1px solid ${!notification.isRead ? meta.border : "rgba(255,255,255,0.06)"}`,
                    }}
                    onMouseEnter={(e) => {
                      if (notification.isRead) {
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (notification.isRead) {
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.02)";
                      }
                    }}
                  >
                    <div className="p-4">
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: meta.bg }}
                        >
                          <Icon size={18} style={{ color: meta.color }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p
                                  className="text-sm font-semibold"
                                  style={{
                                    color: !notification.isRead
                                      ? "white"
                                      : "rgba(255,255,255,0.7)",
                                  }}
                                >
                                  {notification.title}
                                </p>
                                <StatusBadge type={notification.type} />
                              </div>
                              <p
                                className="text-[13px] mt-1 leading-relaxed"
                                style={{ color: "rgba(255,255,255,0.5)" }}
                              >
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <span
                                  className="text-[10px]"
                                  style={{ color: "rgba(255,255,255,0.3)" }}
                                >
                                  {formatDate(notification.createdAt)}
                                </span>
                                {navPath && (
                                  <span
                                    className="text-[10px] flex items-center gap-1"
                                    style={{ color: meta.color }}
                                  >
                                    Click to view
                                    <ChevronRight size={10} />
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.isRead && (
                                <button
                                  onClick={(e) =>
                                    handleMarkAsRead(notification._id, e)
                                  }
                                  disabled={processingRead === notification._id}
                                  className="p-1.5 rounded-lg transition-colors"
                                  style={{ color: "rgba(255,255,255,0.4)" }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.color = "#60a5fa")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.color =
                                      "rgba(255,255,255,0.4)")
                                  }
                                >
                                  {processingRead === notification._id ? (
                                    <Loader2
                                      size={14}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Eye size={14} />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={(e) =>
                                  handleDeleteNotification(notification._id, e)
                                }
                                disabled={deletingId === notification._id}
                                className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                                style={{ color: "rgba(255,255,255,0.4)" }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.color = "#f87171")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.color =
                                    "rgba(255,255,255,0.4)")
                                }
                              >
                                {deletingId === notification._id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                        style={{ background: meta.color }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
