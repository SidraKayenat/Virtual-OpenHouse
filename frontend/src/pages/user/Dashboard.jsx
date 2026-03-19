import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import { api, eventAPI, notificationAPI } from "@/lib/api";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [myEvents, setMyEvents] = useState([]);
  const [publishedEvents, setPublishedEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    published: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load user profile
        const userData = await api("/auth/profile", { method: "GET" });
        setUser(userData.user || userData);

        // Load user's events
        const eventsData = await eventAPI.getMyEvents();
        setMyEvents(eventsData.data || []);

        // Load notifications
        const notificationsData = await notificationAPI.getAll(10, 0);
        setNotifications(notificationsData.data || []);

        // Load published/live events for attendees
        const publishedData = await eventAPI.getPublished({ limit: 50 });
        setPublishedEvents(publishedData.data || []);

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

    const handlePublish = async (eventId) => {
    try {
      await eventAPI.publish(eventId);
      const eventsData = await eventAPI.getMyEvents();
      setMyEvents(eventsData.data || []);
    } catch (err) {
      console.error("Publish event error:", err);
      setError(err.message || "Failed to publish event");
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <p className="text-gray-600">Loading dashboard...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        user={user}
        notifications={notifications}
        setNotifications={setNotifications}
      />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome back{user?.name ? `, ${user.name}` : ""}. Manage your
              events here.
            </p>
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
        <section className="bg-white rounded shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">My Events</h2>
          </div>

          {myEvents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">
                No events yet. Create your first event!
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
              {myEvents.map((event) => (
                <div
                  key={event._id}
                  className={`border rounded-lg p-6 ${getStatusColor(event.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{event.name}</h3>
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
                      {event.status === "approved" && (
                        <button
                          type="button"
                          onClick={() => handlePublish(event._id)}
                          className="px-4 py-2 bg-white bg-opacity-75 rounded text-sm font-medium hover:bg-opacity-100 transition"
                        >
                          Publish
                        </button>
                      )}
                      <Link
                        to={`/event/${event._id}`}
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

        {/* Live & Published Events Section */}
        <section className="mt-8 bg-white rounded shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Live Events</h2>
            <p className="text-sm text-gray-600 mt-1">
              Open any live or published event to enter the dynamic 3D scene.
            </p>
          </div>

          {publishedEvents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No published events are available yet.
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {publishedEvents.map((event) => (
                <div
                  key={event._id}
                  className="border rounded-lg p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {event.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {event.description}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                      <span>📅 {formatDate(event.liveDate)}</span>
                      <span>🏢 {event.numberOfStalls} stalls</span>
                      <span className="uppercase">{event.status}</span>
                    </div>
                  </div>

                  <Link
                    to={`/event/${event._id}`}
                    className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                  >
                    {event.status === "live" ? "Join Live Event" : "Open Event"}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Notifications Section */}
        {notifications.length > 0 && (
          <section className="mt-8 bg-white rounded shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Recent Notifications
              </h2>
            </div>

            <div className="space-y-4 p-6">
              {notifications.slice(0, 5).map((notif) => (
                <div
                  key={notif._id}
                  className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {notif.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
