import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { eventAPI } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function EventDetails() {
  const { user } = useAuth();
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);

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
    const load = async () => {
      try {
        setLoading(true);

        const res = await eventAPI.getById(eventId);

        console.log("API response:", res);

        setEvent(res.data);
      } catch (err) {
        console.error("API error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [eventId]);

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
      </main>
    </div>
  );
}
