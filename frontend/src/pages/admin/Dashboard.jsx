import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, eventAPI, notificationAPI } from "@/lib/api";
import { LogOut, CheckCircle, XCircle, Clock } from "lucide-react";
import AdminNotifications from "@/components/AdminNotifications";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [eventRequests, setEventRequests] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    published: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load pending events
        const eventsData = await eventAPI.getPending();
        setEventRequests(eventsData.data || []);

        // Load notifications
        const notificationsData = await notificationAPI.getAll(10, 0);
        setNotifications(notificationsData.data || []);

        // Load stats
        const statsData = await eventAPI.getStats();
        setStats(statsData.data || {});
      } catch (err) {
        console.error("Failed to load admin dashboard:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleApproveEvent = async (eventId) => {
    try {
      setActionLoading(eventId);
      await eventAPI.approve(eventId);

      // Remove from pending list
      setEventRequests((prev) => prev.filter((e) => e._id !== eventId));

      // Refresh notifications
      const notificationsData = await notificationAPI.getAll(10, 0);
      setNotifications(notificationsData.data || []);

      alert("Event approved successfully!");
    } catch (err) {
      console.error("Approve Error:", err);
      alert(err.message || "Failed to approve event");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectEvent = async (eventId) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      setActionLoading(eventId);
      await eventAPI.reject(eventId, rejectionReason);

      // Remove from pending list
      setEventRequests((prev) => prev.filter((e) => e._id !== eventId));

      // Refresh notifications
      const notificationsData = await notificationAPI.getAll(10, 0);
      setNotifications(notificationsData.data || []);

      setShowRejectionModal(null);
      setRejectionReason("");
      alert("Event rejected successfully!");
    } catch (err) {
      console.error("Reject Error:", err);
      alert(err.message || "Failed to reject event");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch (err) {
      console.log("Logout error:", err);
    }
    navigate("/login");
  };

  const formatTime = (date) => {
    if (!date) return "N/A";
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="w-full border-b bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
            <Link
              to="/admin/dashboard"
              className="text-xl font-bold text-gray-900"
            >
              OPEN HOUSE
            </Link>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-gray-600">Loading dashboard...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="w-full border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                to="/admin/dashboard"
                className="text-xl font-bold text-gray-900"
              >
                OPEN HOUSE
              </Link>
              <span className="text-sm text-gray-500">Admin Dashboard</span>
            </div>

            <div className="flex items-center gap-4">
              <AdminNotifications
                notifications={notifications}
                setNotifications={setNotifications}
              />

              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-700">
                  <div className="font-medium">Admin User</div>
                </div>
                <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                  A
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <p className="text-gray-500 text-sm">Pending Requests</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {stats.pending || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <p className="text-gray-500 text-sm">Approved</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {stats.approved || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <p className="text-gray-500 text-sm">Published</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {stats.published || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <p className="text-gray-500 text-sm">Total Events</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {stats.total || 0}
            </p>
          </div>
        </div>

        {/* Event Requests Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">
              Pending Event Requests ({eventRequests.length})
            </h2>
          </div>

          {eventRequests.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
              <p className="text-gray-600 font-medium">No pending events</p>
              <p className="text-gray-500 text-sm mt-1">
                All event requests have been reviewed
              </p>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {eventRequests.map((event) => (
                <div
                  key={event._id}
                  className="border rounded-lg p-6 bg-yellow-50 border-yellow-200 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {event.name}
                        </h3>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                          Pending
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mt-2">
                        by{" "}
                        <span className="font-medium">
                          {event.createdBy?.name}
                        </span>{" "}
                        ({event.createdBy?.email})
                      </p>

                      <p className="text-sm text-gray-700 mt-3">
                        {event.description}
                      </p>

                      <div className="flex flex-wrap gap-6 mt-4 text-sm text-gray-600">
                        <span>📅 {formatDate(event.liveDate)}</span>
                        <span>🏢 {event.numberOfStalls} stalls</span>
                        <span>📍 {event.venue || "Virtual"}</span>
                        <span>🏷️ {event.eventType}</span>
                        <span>🕐 {formatTime(event.createdAt)}</span>
                      </div>

                      {event.tags && event.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {event.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex gap-2">
                      <button
                        onClick={() => handleApproveEvent(event._id)}
                        disabled={actionLoading === event._id}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition text-sm font-medium"
                      >
                        <CheckCircle size={16} />
                        {actionLoading === event._id
                          ? "Approving..."
                          : "Approve"}
                      </button>

                      <button
                        onClick={() => setShowRejectionModal(event._id)}
                        disabled={actionLoading === event._id}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition text-sm font-medium"
                      >
                        <XCircle size={16} />
                        {actionLoading === event._id
                          ? "Rejecting..."
                          : "Reject"}
                      </button>
                    </div>
                  </div>

                  {/* Rejection Modal */}
                  {showRejectionModal === event._id && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          Reject Event Request
                        </h3>

                        <p className="text-sm text-gray-600 mb-4">
                          Please provide a reason for rejecting "{event.name}"
                        </p>

                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Reason for rejection..."
                          rows={4}
                          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none mb-4"
                        />

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleRejectEvent(event._id)}
                            disabled={!rejectionReason.trim()}
                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400 transition font-medium"
                          >
                            Confirm Rejection
                          </button>
                          <button
                            onClick={() => {
                              setShowRejectionModal(null);
                              setRejectionReason("");
                            }}
                            className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
