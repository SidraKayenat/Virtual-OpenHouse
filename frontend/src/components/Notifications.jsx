import React, { useEffect, useState } from "react";
import { notificationAPI } from "@/lib/api";
import { Bell, Trash2, AlertCircle, CheckCircle } from "lucide-react";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Load all notifications for the current user
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationAPI.getAll(20, 0);
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
      alert("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true })),
      );
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      alert("Failed to mark all notifications as read");
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await notificationAPI.delete(notificationId);
      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId),
      );
    } catch (err) {
      console.error("Failed to delete notification:", err);
      alert("Failed to delete notification");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "event_approved":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "event_rejected":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationColor = (type, isRead) => {
    if (isRead) return "bg-white hover:bg-gray-50";
    switch (type) {
      case "event_approved":
        return "bg-green-50 hover:bg-green-100";
      case "event_rejected":
        return "bg-red-50 hover:bg-red-100";
      case "event_live":
        return "bg-blue-50 hover:bg-blue-100";
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading && notifications.length === 0) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 text-gray-600">
          <div className="animate-spin">
            <Bell size={20} />
          </div>
          <span className="text-sm">Loading notifications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell size={24} className="text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-sm text-blue-600 font-medium">
                {unreadCount} unread
              </p>
            )}
          </div>
        </div>
        {unreadCount > 0 && !isExpanded && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Content */}
      {error ? (
        <div className="p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadNotifications}
            className="mt-4 text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center">
          <Bell size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No notifications yet</p>
          <p className="text-sm text-gray-400 mt-1">
            You'll receive notifications when there are updates
          </p>
        </div>
      ) : (
        <>
          <div className="divide-y max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 transition cursor-pointer ${getNotificationColor(notification.type, notification.isRead)}`}
                onClick={() =>
                  !notification.isRead && handleMarkAsRead(notification._id)
                }
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
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
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2" />
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
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                    title="Delete notification"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Showing {notifications.length} notification
              {notifications.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs px-3 py-1 text-blue-600 hover:text-blue-700 font-medium"
            >
              {isExpanded ? "Collapse" : "Expand"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
