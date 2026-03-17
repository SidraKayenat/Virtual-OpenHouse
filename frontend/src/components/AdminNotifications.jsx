import React, { useState } from "react";
import { Bell, X } from "lucide-react";

export default function AdminNotifications({
  notifications = [],
  setNotifications = () => {},
}) 
{
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  const formatTime = (dateValue) => {
    const now = new Date();
    const date = new Date(dateValue);
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const markNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
  };

  return (
    <>
      {/* Notification Bell Icon */}
      <div className="relative">
        <button
          onClick={() => {
            setShowNotificationPanel(!showNotificationPanel);
            markNotificationsAsRead();
          }}
          className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          <Bell size={20} />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadNotifications}
            </span>
          )}
        </button>
      </div>

      {/* Notification Panel */}
      {showNotificationPanel && (
        <div className="fixed right-0 top-16 w-80 h-[calc(100vh-64px)] bg-white border-l shadow-lg overflow-y-auto z-50">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
              <button
                onClick={() => setShowNotificationPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {notifications.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  No notifications
                </p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {notif.type === "event_approved" ? (
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        ) : notif.type === "event_rejected" ? (
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatTime(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
