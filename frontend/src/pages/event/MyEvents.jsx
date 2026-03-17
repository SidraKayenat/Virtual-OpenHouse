import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { eventAPI } from "@/lib/api";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

const MyEvents = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");

  const [myEvents, setMyEvents] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    published: 0,
    rejected: 0,
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "approved":
        return "bg-green-50 border-green-200 text-green-800";
      case "published":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "rejected":
        return "bg-red-50 border-red-200 text-red-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock size={16} />;
      case "approved":
        return <CheckCircle size={16} />;
      case "rejected":
        return <AlertCircle size={16} />;
      default:
        return null;
    }
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // derive filtered list for UI
  const filteredEvents = myEvents.filter((e) => {
    if (filter === "all") return true;
    return e.status === filter;
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load user's events
        const eventsData = await eventAPI.getMyEvents();
        setMyEvents(eventsData.data || []);

        // Calculate stats
        if (eventsData.data) {
          const eventStats = {
            pending: eventsData.data.filter((e) => e.status === "pending")
              .length,
            approved: eventsData.data.filter((e) => e.status === "approved")
              .length,
            published: eventsData.data.filter((e) => e.status === "published")
              .length,
            rejected: eventsData.data.filter((e) => e.status === "rejected")
              .length,
          };
          setStats(eventStats);
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
  if (loading) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar />

        <div className="flex-1 flex flex-col">
          <DashboardNavbar />

          <main className="flex-1 overflow-y-auto px-8 py-6">
            <p className="text-gray-600">Loading Events...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto px-8 py-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">My Events</h1>
            </div>
            <Link
              to="/user/create-event"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg shadow hover:bg-indigo-700 transition font-medium"
            >
              + Create Event
            </Link>
          </div>

          {/* Stats Section */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="p-6 bg-white rounded shadow">
              <div className="text-sm text-gray-500 font-medium">Pending</div>
              <div className="text-3xl font-bold text-yellow-600 mt-2">
                {stats.pending}
              </div>
            </div>
            <div className="p-6 bg-white rounded shadow">
              <div className="text-sm text-gray-500 font-medium">Approved</div>
              <div className="text-3xl font-bold text-green-600 mt-2">
                {stats.approved}
              </div>
            </div>
            <div className="p-6 bg-white rounded shadow">
              <div className="text-sm text-gray-500 font-medium">Published</div>
              <div className="text-3xl font-bold text-blue-600 mt-2">
                {stats.published}
              </div>
            </div>
            <div className="p-6 bg-white rounded shadow">
              <div className="text-sm text-gray-500 font-medium">Rejected</div>
              <div className="text-3xl font-bold text-red-600 mt-2">
                {stats.rejected}
              </div>
            </div>
          </section>

          {/* My Events Section */}
          <section className="mt-8 bg-white rounded shadow">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">My Events</h2>
              <div className="flex gap-2">
                {["all", "pending", "approved", "rejected", "published"].map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setFilter(st)}
                      className={`px-3 py-1 rounded text-sm font-medium transition ${
                        filter === st
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </button>
                  ),
                )}
              </div>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">
                  {filter === "all"
                    ? "No events yet. Create your first event!"
                    : `No ${filter} events`}
                </p>
                <Link
                  to="/user/create-event"
                  className="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                >
                  Create Event
                </Link>
              </div>
            ) : (
              <div className="space-y-4 p-6">
                {filteredEvents.map((event) => (
                  <div
                    key={event._id}
                    className={`border rounded-lg p-6 ${getStatusColor(event.status)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">
                            {event.name}
                          </h3>
                          <span className="flex items-center gap-1 px-3 py-1 bg-white bg-opacity-50 rounded text-sm font-medium">
                            {getStatusIcon(event.status)}
                            {event.status.charAt(0).toUpperCase() +
                              event.status.slice(1)}
                          </span>
                        </div>

                        <p className="text-sm mt-2 opacity-75">
                          {event.description.substring(0, 100)}...
                        </p>

                        <div className="flex flex-wrap gap-6 mt-4 text-sm">
                          <span>📅 {formatDate(event.liveDate)}</span>
                          <span>🏢 {event.numberOfStalls} stalls</span>
                          <span>📍 {event.venue || "Virtual"}</span>
                        </div>

                        {event.rejectionReason && (
                          <div className="mt-3 p-3 bg-red-100 bg-opacity-50 rounded text-sm">
                            <strong>Rejection Reason:</strong>{" "}
                            {event.rejectionReason}
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex gap-2">
                        {(event.status === "pending" ||
                          event.status === "approved") && (
                          <button
                            onClick={() => navigate(`/event/${event._id}/edit`)}
                            className="px-4 py-2 bg-white bg-opacity-75 rounded text-sm font-medium hover:bg-opacity-100 transition"
                          >
                            Update
                          </button>
                        )}

                        {event.status === "approved" && (
                          <button
                            onClick={async () => {
                              try {
                                await eventAPI.publish(event._id);
                                alert("Event published!");
                                // refresh list
                                const updated = await eventAPI.getMyEvents();
                                setMyEvents(updated.data || []);
                                // update stats
                                const ev = updated.data || [];
                                setStats({
                                  pending: ev.filter(
                                    (e) => e.status === "pending",
                                  ).length,
                                  approved: ev.filter(
                                    (e) => e.status === "approved",
                                  ).length,
                                  published: ev.filter(
                                    (e) => e.status === "published",
                                  ).length,
                                  rejected: ev.filter(
                                    (e) => e.status === "rejected",
                                  ).length,
                                });
                              } catch (err) {
                                console.error("Publish error", err);
                                alert(err.message || "Failed to publish");
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
                          >
                            Publish
                          </button>
                        )}

                        <Link
                          to={`/event/manage/${event._id}`}
                          className="px-4 py-2 bg-white bg-opacity-75 rounded text-sm font-medium hover:bg-opacity-100 transition"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default MyEvents;
