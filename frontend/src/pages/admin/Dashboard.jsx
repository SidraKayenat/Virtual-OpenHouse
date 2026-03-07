import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { eventAPI } from "@/lib/api";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function AdminDashboard() {
  const navigate = useNavigate();
  // events for the current filter (pending/approved/rejected)
  const [events, setEvents] = useState([]);
  // published events shown separately at bottom
  const [publishedEvents, setPublishedEvents] = useState([]);

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
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load events for the current filter
        await loadEvents(filter);

        // Load published events regardless of filter (show at bottom)
        const pubData = await eventAPI.getAll({ status: "published" });
        setPublishedEvents(pubData.data || []);

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
  }, [filter]);

  const loadEvents = async (status) => {
    try {
      const resp = await eventAPI.getAll({ status });
      setEvents(resp.data || []);
    } catch (err) {
      console.error("Error loading events for status", status, err);
    }
  };

  const handleApproveEvent = async (eventId) => {
    try {
      setActionLoading(eventId);
      await eventAPI.approve(eventId);

      // remove from current events list when pending
      if (filter === "pending") {
        setEvents((prev) => prev.filter((e) => e._id !== eventId));
      }

      // refresh stats
      const statsData = await eventAPI.getStats();
      setStats(statsData.data || {});

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

      // remove from current events list when pending
      if (filter === "pending") {
        setEvents((prev) => prev.filter((e) => e._id !== eventId));
      }

      // refresh stats
      const statsData = await eventAPI.getStats();
      setStats(statsData.data || {});

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
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-gray-600">Loading dashboard...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <Navbar />

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

        {/* Events List Section with filter tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {filter.charAt(0).toUpperCase() + filter.slice(1)} Events (
              {events.length})
            </h2>
            <div className="flex gap-2">
              {["pending", "approved", "rejected"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    filter === status
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {events.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle size={48} className="mx-auto text-gray-500 mb-4" />
              <p className="text-gray-600 font-medium">No {filter} events</p>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {events.map((event) => {
                const bgClasses =
                  event.status === "pending"
                    ? "bg-yellow-50 border-yellow-200"
                    : event.status === "approved"
                      ? "bg-green-50 border-green-200"
                      : event.status === "rejected"
                        ? "bg-red-50 border-red-200"
                        : "";
                const badgeClasses =
                  event.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : event.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : event.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800";

                return (
                  <div
                    key={event._id}
                    className={`border rounded-lg p-6 hover:shadow-md transition cursor-pointer ${bgClasses}`}
                    onClick={() => navigate(`/event/${event._id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {event.name}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${badgeClasses}`}
                          >
                            {event.status.charAt(0).toUpperCase() +
                              event.status.slice(1)}
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

                      {filter === "pending" && (
                        <div className="ml-4 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveEvent(event._id);
                            }}
                            disabled={actionLoading === event._id}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition text-sm font-medium"
                          >
                            <CheckCircle size={16} />
                            {actionLoading === event._id
                              ? "Approving..."
                              : "Approve"}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowRejectionModal(event._id);
                            }}
                            disabled={actionLoading === event._id}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition text-sm font-medium"
                          >
                            <XCircle size={16} />
                            {actionLoading === event._id
                              ? "Rejecting..."
                              : "Reject"}
                          </button>
                        </div>
                      )}
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
                );
              })}
            </div>
          )}
        </div>

        {/* Published Events Section */}
        <div className="mt-10 bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">
              Published Events ({publishedEvents.length})
            </h2>
          </div>
          {publishedEvents.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle size={48} className="mx-auto text-blue-500 mb-4" />
              <p className="text-gray-600 font-medium">No published events</p>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {publishedEvents.map((event) => (
                <div
                  key={event._id}
                  className="border rounded-lg p-6 bg-blue-50 border-blue-200 hover:shadow-md transition cursor-pointer"
                  onClick={() => navigate(`/event/${event._id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {event.name}
                        </h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          Published
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
