import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { useNavigate } from "react-router-dom";

export default function CreateEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    stalls: 1,
    liveAt: "",
    status: "open",
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleFile = (e) => setThumbnail(e.target.files[0] || null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description);
      fd.append("stalls", String(form.stalls));
      fd.append("liveAt", form.liveAt);
      fd.append("status", form.status);
      if (thumbnail) fd.append("thumbnail", thumbnail);

      // send request to backend event-request endpoint
      const res = await fetch("/api/events/request", {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create request");
      }

      // notify created successfully
      alert("Event request submitted. Admin will review and approve.");
      navigate("/user/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Create Event (Request)</h1>
        <p className="text-sm text-gray-600 mb-6">
          Submit an event request — an admin will be notified to approve.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full border rounded px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Stalls</label>
              <input
                name="stalls"
                type="number"
                min={1}
                value={form.stalls}
                onChange={handleChange}
                className="mt-1 block w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Live At</label>
              <input
                name="liveAt"
                type="datetime-local"
                value={form.liveAt}
                onChange={handleChange}
                className="mt-1 block w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Thumbnail</label>
            <input type="file" accept="image/*" onChange={handleFile} className="mt-1" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="mt-1 block w-48 border rounded px-3 py-2">
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded"
            >
              {loading ? "Submitting…" : "Submit Event Request"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
