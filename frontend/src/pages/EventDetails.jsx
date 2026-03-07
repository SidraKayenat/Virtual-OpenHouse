import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { eventAPI, registrationAPI } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function EventDetails() {
  const { user } = useAuth();
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [registrationFilter, setRegistrationFilter] = useState("all");

  const [stats, setStats] = useState({
    registered: 0, // approved count
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    total: 0,
    availableStalls: 0,
    totalStalls: 0,
  });

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

  useEffect(() => {
    // Reset stats when eventId changes
    setStats({
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      total: 0,
    });

    const load = async () => {
      try {
        setLoading(true);

        const res = await eventAPI.getById(eventId);

        console.log("API response:", res);

        setEvent(res.data);

        // Load registrations & stats if user is event admin
        const isAdmin = res.data.createdBy._id === user?._id;
        if (isAdmin) {
          setRegistrationFilter("all");
          await loadRegistrations(res.data._id, "all");

          try {
            const statsRes = await registrationAPI.getStats(eventId);
            setStats(statsRes.data);
          } catch (err) {
            console.error("Failed to load stats", err);
          }
        } else {
          // simple viewer: derive stall numbers from event object
          setStats((prev) => ({
            ...prev,
            totalStalls: res.data.numberOfStalls || 0,
            availableStalls: res.data.availableStalls || 0,
          }));
        }
      } catch (err) {
        console.error("API error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [eventId, user?._id]);

  const loadRegistrations = async (currEventId, status) => {
    try {
      setRegistrationsLoading(true);

      const params = status !== "all" ? { status } : {};

      const res = await registrationAPI.getEventRegistrations(
        currEventId,
        params,
      );

      setRegistrations(res.data || []);
    } catch (err) {
      console.error("Failed to load registrations:", err);
    } finally {
      setRegistrationsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      await eventAPI.delete(eventId);
      alert("Event deleted successfully");
      // navigate back according to role
      if (user?.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/user/dashboard");
      }
    } catch (err) {
      console.error("Delete error", err);
      alert(err.message || "Failed to delete event");
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert("Please enter a reason");
      return;
    }

    try {
      await eventAPI.cancel(eventId, cancelReason);
      alert("Event cancelled");
      setShowCancelModal(false);
      setCancelReason("");
      const updated = await eventAPI.getById(eventId);
      setEvent(updated.data);
    } catch (err) {
      console.error("Cancel error", err);
      alert(err.message || "Failed to cancel");
    }
  };

  const isEventAdmin = user && event && event.createdBy._id === user._id;
  const isStallsFull = event && event.availableStalls <= 0;
  const isPublishedOrLive =
    event && ["published", "live"].includes(event.status);
  const canRegister = isPublishedOrLive && !isEventAdmin;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-gray-600">Loading event...</p>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-red-600">Event not found</p>
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
        <section>
          {/* stall counts */}
          <div>
            <h4>Stalls</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white p-4 rounded shadow">
                <p className="text-sm text-gray-500">Total Stalls</p>
                <p className="text-2xl font-bold">{stats.totalStalls}</p>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <p className="text-sm text-gray-500">Available Stalls</p>
                <p className="text-2xl font-bold">{stats.availableStalls}</p>
              </div>
            </div>
          </div>

          {isEventAdmin ? (
            <>
              <h4>Registrations</h4>
              {/* registration breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white p-4 rounded shadow">
                  <p className="text-sm text-gray-500">Total Registrations</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                  <p className="text-sm text-yellow-700">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <p className="text-sm text-green-700">Approved</p>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                </div>
                <div className="bg-red-50 p-4 rounded border border-red-200">
                  <p className="text-sm text-red-700">Rejected</p>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <p className="text-sm text-gray-700">Cancelled</p>
                  <p className="text-2xl font-bold">{stats.cancelled}</p>
                </div>
              </div>
            </>
          ) : (
            <></>
          )}
        </section>
        {/* Event Details Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900">
                {event.name}
              </h2>
              <span className="inline-block mt-2 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                Status: {event.status}
              </span>

              <p className="text-sm text-gray-600 mt-3">
                Created by{" "}
                <span className="font-medium">
                  {event.createdBy?.name} ({event.createdBy?.email})
                </span>
              </p>

              <p className="text-sm text-gray-700 mt-4">{event.description}</p>

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
            <div className="ml-4 flex flex-col gap-2">
              {/* Register Button for published/live events */}
              {canRegister && (
                <button
                  onClick={() => navigate(`/user/register/${eventId}`)}
                  disabled={isStallsFull}
                  className={`px-4 py-2 rounded transition text-sm font-medium ${
                    isStallsFull
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {isStallsFull ? "Registrations Full" : "Register for Event"}
                </button>
              )}

              {(user?.role == "user" || user?.role === "admin") &&
                event.status !== "cancelled" &&
                event.status !== "completed" && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition text-sm font-medium"
                  >
                    Cancel Event
                  </button>
                )}

              {(user?.role == "user" || user?.role === "admin") && (
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition text-sm font-medium"
                >
                  Delete Event
                </button>
              )}

              <button
                onClick={() => navigate(-1)}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition text-sm font-medium"
              >
                Back
              </button>
            </div>
          </div>
        </div>
        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Cancel Event
              </h3>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (optional)"
                rows={4}
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-yellow-500 outline-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition font-medium"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Registrations Section (Event Admin Only) */}
        {isEventAdmin && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Event Registrations ({registrations.length})
              </h3>
              <div className="flex gap-2">
                {["all", "pending", "approved", "rejected"].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setRegistrationFilter(status);
                      loadRegistrations(eventId, status);
                    }}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                      registrationFilter === status
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {registrationsLoading ? (
              <p className="text-gray-600">Loading registrations...</p>
            ) : registrations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No registrations found
              </p>
            ) : (
              <div className="space-y-4">
                {registrations.map((reg) => {
                  const statusColor =
                    {
                      pending: "bg-yellow-50 border-yellow-200",
                      approved: "bg-green-50 border-green-200",
                      rejected: "bg-red-50 border-red-200",
                    }[reg.status] || "bg-gray-50 border-gray-200";

                  const statusBadgeColor =
                    {
                      pending: "bg-yellow-100 text-yellow-800",
                      approved: "bg-green-100 text-green-800",
                      rejected: "bg-red-100 text-red-800",
                    }[reg.status] || "bg-gray-100 text-gray-800";

                  return (
                    <div
                      key={reg._id}
                      className={`border rounded-lg p-4 ${statusColor}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {reg.participantInfo?.projectTitle}
                            </h4>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${statusBadgeColor}`}
                            >
                              {reg.status.charAt(0).toUpperCase() +
                                reg.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {reg.user?.name} ({reg.user?.email})
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            {reg.participantInfo?.projectDescription?.substring(
                              0,
                              100,
                            )}
                            ...
                          </p>
                          {reg.status === "approved" && reg.stallNumber && (
                            <p className="text-sm text-green-700 mt-1 font-medium">
                              Stall #{reg.stallNumber}
                            </p>
                          )}
                          {reg.status === "rejected" && (
                            <p className="text-sm text-red-700 mt-1">
                              Reason: {reg.rejectionReason}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => navigate(`/registration/${reg._id}`)}
                          className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}{" "}
      </main>
    </div>
  );
}
