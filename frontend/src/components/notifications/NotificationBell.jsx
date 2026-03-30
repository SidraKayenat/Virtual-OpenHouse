import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Home,
  FileText,
  CheckCheck,
  XCircle,
  Clock,
  Radio,
  Send,
  Trash2,
  Loader2,
} from "lucide-react";
import { notificationAPI } from "@/lib/api";
// Import ChevronRight at the top
import { ChevronRight } from "lucide-react";

const NOTIFICATION_ICONS = {
  event_approved: {
    icon: CheckCircle,
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
  },
  event_rejected: {
    icon: AlertCircle,
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
  },
  event_published: {
    icon: Radio,
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
  },
  event_reminder_24h: {
    icon: Bell,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
  },
  event_reminder_1h: {
    icon: Bell,
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
  },
  event_ended: {
    icon: CheckCheck,
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.12)",
  },
  event_submitted: {
    icon: Send,
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
  },
  registration_approved: {
    icon: CheckCircle,
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
  },
  registration_rejected: {
    icon: XCircle,
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
  },
  registration_submitted: {
    icon: FileText,
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
  },
  registration_cancelled: {
    icon: XCircle,
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.12)",
  },
  stall_created: { icon: Home, color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  stall_published: {
    icon: Home,
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
  },
  welcome: { icon: User, color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  account_created: {
    icon: User,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
  },
  default: { icon: Bell, color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
};

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

const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return `${Math.floor(diffMins / 1440)}d ago`;
};

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchUnreadCount();

    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getAll(5, 0);
      setUnreadCount(response.unread || 0);
      setNotifications(response.data || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationAPI.getAll(5, 0);
      setNotifications(response.data || []);
      setUnreadCount(response.unread || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    if (deletingId === notificationId) return;

    setDeletingId(notificationId);
    try {
      await notificationAPI.delete(notificationId);
      const deleted = notifications.find((n) => n._id === notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      if (deleted && !deleted.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleNotificationClick = (notification) => {
    const path = getNavigationPath(notification);
    if (path) {
      setShowDropdown(false);
      window.location.href = path;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          if (!showDropdown) fetchNotifications();
          setShowDropdown(!showDropdown);
        }}
        className="relative p-2 rounded-xl transition-all duration-200"
        style={{
          background: showDropdown
            ? "rgba(124,58,237,0.15)"
            : "rgba(255,255,255,0.03)",
          border: showDropdown
            ? "1px solid rgba(124,58,237,0.3)"
            : "1px solid rgba(255,255,255,0.07)",
        }}
        onMouseEnter={(e) => {
          if (!showDropdown)
            e.currentTarget.style.background = "rgba(255,255,255,0.07)";
        }}
        onMouseLeave={(e) => {
          if (!showDropdown)
            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
        }}
      >
        <Bell size={18} style={{ color: "rgba(255,255,255,0.7)" }} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "white",
              boxShadow: "0 2px 8px rgba(239,68,68,0.4)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 z-50 rounded-2xl overflow-hidden"
            style={{
              background: "#141320",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow:
                "0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-2">
                <Bell size={16} style={{ color: "#a78bfa" }} />
                <span
                  className="text-sm font-semibold"
                  style={{ color: "white", fontFamily: "'Syne',sans-serif" }}
                >
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{
                      background: "rgba(167,139,250,0.2)",
                      color: "#c4b5fd",
                    }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markingAll}
                  className="text-[11px] font-medium px-2 py-1 rounded-lg transition-all flex items-center gap-1"
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    background: "rgba(255,255,255,0.05)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.05)")
                  }
                >
                  {markingAll ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <CheckCheck size={10} />
                  )}
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications list */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2
                    size={20}
                    className="animate-spin"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    <Bell
                      size={20}
                      style={{ color: "rgba(255,255,255,0.2)" }}
                    />
                  </div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    No notifications
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  >
                    You're all caught up!
                  </p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const meta =
                    NOTIFICATION_ICONS[notification.type] ||
                    NOTIFICATION_ICONS.default;
                  const Icon = meta.icon;
                  const navPath = getNavigationPath(notification);

                  return (
                    <div
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className="group relative p-3 transition-all cursor-pointer"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        background: !notification.isRead
                          ? meta.bg
                          : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = !notification.isRead
                          ? meta.bg
                          : "transparent";
                      }}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: meta.bg }}
                        >
                          <Icon size={14} style={{ color: meta.color }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <p
                              className="text-xs font-semibold truncate"
                              style={{
                                color: !notification.isRead
                                  ? "white"
                                  : "rgba(255,255,255,0.6)",
                              }}
                            >
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <div
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1"
                                style={{ background: meta.color }}
                              />
                            )}
                          </div>
                          <p
                            className="text-[11px] mt-0.5 line-clamp-2"
                            style={{ color: "rgba(255,255,255,0.4)" }}
                          >
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span
                              className="text-[9px]"
                              style={{ color: "rgba(255,255,255,0.25)" }}
                            >
                              {formatTime(notification.createdAt)}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.isRead && (
                                <button
                                  onClick={(e) =>
                                    handleMarkAsRead(notification._id, e)
                                  }
                                  className="p-1 rounded-lg transition-colors"
                                  style={{ color: "rgba(255,255,255,0.3)" }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.color = "#60a5fa")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.color =
                                      "rgba(255,255,255,0.3)")
                                  }
                                >
                                  <CheckCheck size={10} />
                                </button>
                              )}
                              <button
                                onClick={(e) =>
                                  handleDeleteNotification(notification._id, e)
                                }
                                disabled={deletingId === notification._id}
                                className="p-1 rounded-lg transition-colors disabled:opacity-50"
                                style={{ color: "rgba(255,255,255,0.3)" }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.color = "#f87171")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.color =
                                    "rgba(255,255,255,0.3)")
                                }
                              >
                                {deletingId === notification._id ? (
                                  <Loader2 size={10} className="animate-spin" />
                                ) : (
                                  <Trash2 size={10} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Click indicator if navigable */}
                      {navPath && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-purple-400" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div
              className="px-4 py-2.5"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(0,0,0,0.2)",
              }}
            >
              <Link
                to="/user/notifications"
                onClick={() => setShowDropdown(false)}
                className="flex items-center justify-center gap-1.5 w-full text-[11px] font-medium py-1.5 rounded-lg transition-all"
                style={{
                  color: "rgba(255,255,255,0.5)",
                  background: "rgba(255,255,255,0.03)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(124,58,237,0.2)";
                  e.currentTarget.style.color = "#c4b5fd";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                }}
              >
                View all notifications
                <ChevronRight size={10} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
