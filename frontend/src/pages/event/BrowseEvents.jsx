import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { api } from "@/lib/api";
import EventCard from "@/components/event/EventCard";

const BrowseEvents = () => {
  const [liveEvents, setLiveEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await api("/events/published");

        const events = res.data || res.events || [];

        const live = events.filter((e) => e.status === "live");
        const upcoming = events.filter((e) => e.status === "published");

        setLiveEvents(live);
        setUpcomingEvents(upcoming);
      } catch (err) {
        console.error("Failed to fetch events", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
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

          <div className="py-12 bg-white">
            <div className=" px-4 sm:px-6 lg:px-8">
              <div className="flex justify-center items-center mb-10">
                <div>
                  <h2 className="text-gray-900 mb-2 text-2xl font-semibold">
                    Live Events
                  </h2>
                  <p className="text-gray-600">
                    Join events happening right now
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
                {liveEvents.length === 0 ? (
                  <p className="text-gray-500">No live events right now</p>
                ) : (
                  liveEvents.map((event) => (
                    <EventCard key={event._id} event={event} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="py-12 bg-gray-50">
            <div className=" px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h2 className="text-gray-900 mb-2">Upcoming Events</h2>
                  <p className="text-gray-600">
                    Discover amazing events happening soon
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
                {upcomingEvents.length === 0 ? (
                  <p className="text-gray-500">No upcoming events</p>
                ) : (
                  upcomingEvents.map((event) => (
                    <EventCard key={event._id} event={event} />
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BrowseEvents;
