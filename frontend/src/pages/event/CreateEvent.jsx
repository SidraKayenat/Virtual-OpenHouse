import React, { useState } from "react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import { useNavigate } from "react-router-dom";
import { eventAPI } from "@/lib/api";

export default function CreateEvent() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    numberOfStalls: 1,
    liveDate: "",
    startTime: "",
    endTime: "",
    backgroundType: "default",
    customBackground: "",
    environmentType: "indoor",
    eventType: "exhibition",
    tags: "",
    venue: "",
    thumbnailUrl: "",
    modelUrl: "",
    isFeatured: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({
      ...s,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!form.name || !form.description || !form.liveDate) {
      return "Please fill all required fields";
    }

    if (new Date(form.liveDate) <= new Date()) {
      return "Live date must be in the future";
    }

    if (form.startTime && form.endTime && form.startTime > form.endTime) {
      return "Start time must be before end time";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const validationError = validateForm();
      if (validationError) throw new Error(validationError);

      const eventData = {
        ...form,
        numberOfStalls: parseInt(form.numberOfStalls),
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
      };

      const response = await eventAPI.create(eventData);

      if (response.success) {
        alert("Event submitted for approval ✅");
        navigate("/user/dashboard");
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Create Event</h1>
        <p className="text-gray-600 mb-6">Submit an event for approval</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border rounded">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded shadow space-y-6"
        >
          {/* BASIC */}
          <div>
            <h2 className="font-semibold mb-3">Basic Info</h2>

            <input
              name="name"
              placeholder="Event Name *"
              value={form.name}
              onChange={handleChange}
              className="w-full border p-2 rounded mb-3"
            />

            <textarea
              name="description"
              placeholder="Description *"
              value={form.description}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          {/* CONFIG */}
          <div>
            <h2 className="font-semibold mb-3">Configuration</h2>

            <div className="grid md:grid-cols-2 gap-3">
              <input
                type="number"
                name="numberOfStalls"
                value={form.numberOfStalls}
                onChange={handleChange}
                className="border p-2 rounded"
                placeholder="Number of stalls"
              />

              <select
                name="eventType"
                value={form.eventType}
                onChange={handleChange}
                className="border p-2 rounded"
              >
                <option value="conference">Conference</option>
                <option value="exhibition">Exhibition</option>
                <option value="fair">Fair</option>
                <option value="workshop">Workshop</option>
                <option value="seminar">Seminar</option>
                <option value="other">Other</option>
              </select>

              <input
                type="datetime-local"
                name="liveDate"
                value={form.liveDate}
                onChange={handleChange}
                className="border p-2 rounded"
              />

              <input
                name="venue"
                placeholder="Venue"
                value={form.venue}
                onChange={handleChange}
                className="border p-2 rounded"
              />
            </div>
          </div>

          {/* TIMINGS */}
          <div>
            <h2 className="font-semibold mb-3">Timing</h2>

            <div className="grid md:grid-cols-2 gap-3">
              <input
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                className="border p-2 rounded"
              />
              <input
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                className="border p-2 rounded"
              />
            </div>
          </div>

          {/* MEDIA */}
          <div>
            <h2 className="font-semibold mb-3">Media & 3D</h2>

            <div className="grid gap-3">
              <input
                name="thumbnailUrl"
                placeholder="Thumbnail URL"
                value={form.thumbnailUrl}
                onChange={handleChange}
                className="border p-2 rounded"
              />

              <input
                name="modelUrl"
                placeholder="3D Model URL"
                value={form.modelUrl}
                onChange={handleChange}
                className="border p-2 rounded"
              />
            </div>
          </div>

          {/* ENVIRONMENT */}
          <div>
            <h2 className="font-semibold mb-3">Environment</h2>

            <div className="grid md:grid-cols-2 gap-3">
              <select
                name="environmentType"
                value={form.environmentType}
                onChange={handleChange}
                className="border p-2 rounded"
              >
                <option value="indoor">Indoor</option>
                <option value="outdoor">Outdoor</option>
                <option value="hybrid">Hybrid</option>
              </select>

              <select
                name="backgroundType"
                value={form.backgroundType}
                onChange={handleChange}
                className="border p-2 rounded"
              >
                <option value="default">Default</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {form.backgroundType === "custom" && (
              <input
                name="customBackground"
                placeholder="Background URL / Color"
                value={form.customBackground}
                onChange={handleChange}
                className="border p-2 rounded mt-3 w-full"
              />
            )}
          </div>

          {/* TAGS */}
          <div>
            <h2 className="font-semibold mb-3">Tags</h2>

            <input
              name="tags"
              placeholder="comma separated (tech, ai, startup)"
              value={form.tags}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          </div>

          {/* FEATURED */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isFeatured"
              checked={form.isFeatured}
              onChange={handleChange}
            />
            <label>Mark as Featured</label>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white px-6 py-2 rounded"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/user/dashboard")}
              className="border px-6 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
