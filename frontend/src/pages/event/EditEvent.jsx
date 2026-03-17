import React, { useEffect, useState } from "react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import { useNavigate, useParams } from "react-router-dom";
import { eventAPI } from "@/lib/api";

export default function EditEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const resp = await eventAPI.getById(eventId);
        const e = resp.data;
        if (!e) {
          setError("Event not found");
          return;
        }
        setForm({
          name: e.name || "",
          description: e.description || "",
          numberOfStalls: e.numberOfStalls || 1,
          liveDate: e.liveDate ? e.liveDate.slice(0, 16) : "",
          startTime: e.startTime || "",
          endTime: e.endTime || "",
          backgroundType: e.backgroundType || "default",
          customBackground: e.customBackground || "",
          environmentType: e.environmentType || "indoor",
          eventType: e.eventType || "exhibition",
          tags: e.tags ? e.tags.join(",") : "",
          venue: e.venue || "",
        });
      } catch (err) {
        console.error("Failed to load event for edit", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [eventId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const eventData = {
        name: form.name,
        description: form.description,
        numberOfStalls: parseInt(form.numberOfStalls),
        liveDate: form.liveDate,
        startTime: form.startTime,
        endTime: form.endTime,
        backgroundType: form.backgroundType,
        customBackground: form.customBackground,
        environmentType: form.environmentType,
        eventType: form.eventType,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
        venue: form.venue,
      };
      await eventAPI.update(eventId, eventData);
      alert("Event updated successfully");
      navigate(`/user/event/${eventId}`);
    } catch (err) {
      console.error("Update error", err);
      setError(err.message || "Failed to update event");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-gray-600">Loading event...</p>
        </main>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-red-600">{error || "Event not available"}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Edit Event</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-8 rounded shadow"
        >
          {/* reuse same structure as create form, copy from CreateEvent and adjust values */}
          {/* Basic Info */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Name *
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                required
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Event Configuration */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">Event Configuration</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Stalls *
                </label>
                <input
                  name="numberOfStalls"
                  type="number"
                  min={1}
                  max={500}
                  value={form.numberOfStalls}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type
                </label>
                <select
                  name="eventType"
                  value={form.eventType}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="conference">Conference</option>
                  <option value="exhibition">Exhibition</option>
                  <option value="fair">Fair</option>
                  <option value="workshop">Workshop</option>
                  <option value="seminar">Seminar</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Live Date *
                </label>
                <input
                  name="liveDate"
                  type="datetime-local"
                  value={form.liveDate}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue
                </label>
                <input
                  name="venue"
                  value={form.venue}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  name="startTime"
                  type="time"
                  value={form.startTime}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  name="endTime"
                  type="time"
                  value={form.endTime}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                name="tags"
                value={form.tags}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* 3D Environment */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">3D Environment</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Environment Type
                </label>
                <select
                  name="environmentType"
                  value={form.environmentType}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Type
                </label>
                <select
                  name="backgroundType"
                  value={form.backgroundType}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="default">Default</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {form.backgroundType === "custom" && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Background (URL or Color)
                  </label>
                  <input
                    name="customBackground"
                    value={form.customBackground}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white px-6 py-2 rounded font-medium hover:bg-indigo-700 disabled:bg-gray-400 transition"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-300 rounded font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
