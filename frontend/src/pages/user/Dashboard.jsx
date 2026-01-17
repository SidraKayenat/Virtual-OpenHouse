import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await api("/auth/profile", { method: "GET" });
        setUser(data.user || data);
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    };
    loadProfile();
  }, []);

  const stats = {
    attended: 8,
    participated: 3,
    hosted: 1,
  };

  const sampleEvents = {
    attended: [{ id: 1, title: "Open House - AI Lab", date: "2025-01-10" }],
    participated: [
      { id: 2, title: "Student Projects Showcase", date: "2024-12-05" },
    ],
    hosted: [{ id: 3, title: "My Virtual Booth", date: "2025-02-01" }],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-gray-600">
              Welcome back{user?.name ? `, ${user.name}` : ""}.
            </p>
          </div>
          <Link
            to="/user/create-event"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow"
          >
            + Create Event
          </Link>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-6 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Attended</div>
            <div className="text-3xl font-bold">{stats.attended}</div>
          </div>
          <div className="p-6 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Participated</div>
            <div className="text-3xl font-bold">{stats.participated}</div>
          </div>
          <div className="p-6 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Hosted</div>
            <div className="text-3xl font-bold">{stats.hosted}</div>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Attended Events</h3>
            <div className="space-y-3">
              {sampleEvents.attended.map((e) => (
                <div key={e.id} className="p-4 bg-white rounded shadow-sm">
                  <div className="font-medium">{e.title}</div>
                  <div className="text-sm text-gray-500">{e.date}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Events Participated</h3>
            <div className="space-y-3">
              {sampleEvents.participated.map((e) => (
                <div key={e.id} className="p-4 bg-white rounded shadow-sm">
                  <div className="font-medium">{e.title}</div>
                  <div className="text-sm text-gray-500">{e.date}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Events Hosted</h3>
            <div className="space-y-3">
              {sampleEvents.hosted.map((e) => (
                <div key={e.id} className="p-4 bg-white rounded shadow-sm">
                  <div className="font-medium">{e.title}</div>
                  <div className="text-sm text-gray-500">{e.date}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
