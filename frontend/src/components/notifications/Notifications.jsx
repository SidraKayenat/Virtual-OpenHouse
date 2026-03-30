import React, { useEffect, useState, useRef } from "react";
import { notificationAPI } from "@/lib/api";
import {
  Bell,
  Trash2,
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
  Home,
  FileText,
  CheckCheck,
  X,
  Loader2,
} from "lucide-react";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const notificationRefs = useRef({});

  // Load all notifications for the current user
  useEffect(() => {
    loadNotifications();

    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationAPI.getAll(50, 0);
      setNotifications(response.data || []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif,
        ),
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (markingAll) return;

    try {
      setMarkingAll(true);
      await notificationAPI.markAllAsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true })),
      );
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      alert("Failed to mark all notifications as read");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (deletingId === notificationId) return;

    try {
      setDeletingId(notificationId);
      await notificationAPI.delete(notificationId);
      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId),
      );
    } catch (err) {
      console.error("Failed to delete notification:", err);
      alert("Failed to delete notification");
    } finally {
      setDeletingId(null);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "event_approved":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "event_rejected":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "event_published":
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case "event_reminder_24h":
      case "event_reminder_1h":
        return <Bell className="w-5 h-5 text-purple-600" />;
      case "event_ended":
        return <CheckCheck className="w-5 h-5 text-gray-600" />;
      case "registration_approved":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "registration_rejected":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "registration_submitted":
        return <FileText className="w-5 h-5 text-yellow-600" />;
      case "stall_created":
      case "stall_published":
        return <Home className="w-5 h-5 text-indigo-600" />;
      case "welcome":
      case "account_created":
        return <User className="w-5 h-5 text-teal-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationColor = (type, isRead) => {
    if (isRead) return "bg-white hover:bg-gray-50";
    switch (type) {
      case "event_approved":
      case "registration_approved":
        return "bg-green-50 hover:bg-green-100";
      case "event_rejected":
      case "registration_rejected":
        return "bg-red-50 hover:bg-red-100";
      case "event_published":
      case "stall_published":
        return "bg-blue-50 hover:bg-blue-100";
      case "event_reminder_24h":
      case "event_reminder_1h":
        return "bg-purple-50 hover:bg-purple-100";
      default:
        return "bg-yellow-50 hover:bg-yellow-100";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const filteredNotifications = showUnreadOnly
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading && notifications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell size={28} className="text-blue-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-500">
                Stay updated with the latest activities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`text-sm px-3 py-1.5 rounded-lg transition font-medium ${
                showUnreadOnly
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {showUnreadOnly ? "All" : "Unread Only"}
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="text-sm px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {markingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCheck size={16} />
                )}
                Mark all as read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="p-6 text-center">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-3" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadNotifications}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="p-12 text-center">
          <Bell size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium text-lg">
            {showUnreadOnly
              ? "No unread notifications"
              : "No notifications yet"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {showUnreadOnly
              ? "You're all caught up!"
              : "You'll receive notifications when there are updates"}
          </p>
        </div>
      ) : (
        <>
          <div
            className={`divide-y overflow-y-auto transition-all duration-300 ${
              isExpanded ? "max-h-[600px]" : "max-h-[400px]"
            }`}
          >
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                ref={(el) => (notificationRefs.current[notification._id] = el)}
                className={`p-4 transition cursor-pointer ${getNotificationColor(notification.type, notification.isRead)}`}
                onClick={() =>
                  !notification.isRead && handleMarkAsRead(notification._id)
                }
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p
                          className={`text-sm font-semibold ${
                            notification.isRead
                              ? "text-gray-700"
                              : "text-gray-900"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 break-words">
                          {notification.message}
                        </p>

                        {/* Reference link if available */}
                        {notification.referenceId && (
                          <div className="mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Navigate to the referenced item
                                if (notification.referenceModel === "Event") {
                                  window.location.href = `/events/${notification.referenceId._id}`;
                                } else if (
                                  notification.referenceModel === "Registration"
                                ) {
                                  window.location.href = `/registrations/${notification.referenceId._id}`;
                                } else if (
                                  notification.referenceModel === "Stall"
                                ) {
                                  window.location.href = `/stalls/${notification.referenceId._id}`;
                                }
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              View details →
                            </button>
                          </div>
                        )}
                      </div>

                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(notification._id);
                    }}
                    disabled={deletingId === notification._id}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0 disabled:opacity-50"
                    title="Delete notification"
                  >
                    {deletingId === notification._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Showing {filteredNotifications.length} of {notifications.length}{" "}
              notification
              {notifications.length !== 1 ? "s" : ""}
              {unreadCount > 0 && ` • ${unreadCount} unread`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs px-3 py-1 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                {isExpanded ? "Collapse" : "Expand"}
              </button>
              {notifications.length > 0 && (
                <button
                  onClick={loadNotifications}
                  className="text-xs px-3 py-1 text-gray-600 hover:text-gray-700 font-medium transition-colors"
                >
                  Refresh
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
