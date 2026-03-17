import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import { eventAPI, registrationAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft } from "lucide-react";

export default function CreateRegistration() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    projectTitle: "",
    projectDescription: "",
    category: "",
    teamMembers: [],
    requirements: "",
  });

  const [teamMember, setTeamMember] = useState({
    name: "",
    role: "other",
  });

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        const res = await eventAPI.getById(eventId);
        setEvent(res.data);
      } catch (err) {
        console.error("Failed to load event:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTeamMember = () => {
    if (teamMember.name.trim()) {
      setFormData((prev) => ({
        ...prev,
        teamMembers: [
          ...prev.teamMembers,
          {
            name: teamMember.name.trim(),
            role: teamMember.role,
          },
        ],
      }));
      setTeamMember({ name: "", role: "other" });
    } else {
      alert("Please enter a member name");
    }
  };

  const handleRemoveTeamMember = (index) => {
    setFormData((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.projectTitle.trim()) {
      alert("Project title is required");
      return;
    }
    if (!formData.projectDescription.trim()) {
      alert("Project description is required");
      return;
    }
    if (!formData.category.trim()) {
      alert("Category is required");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await registrationAPI.create(eventId, {
        projectTitle: formData.projectTitle,
        projectDescription: formData.projectDescription,
        category: formData.category,
        teamMembers: formData.teamMembers,
        requirements: formData.requirements,
      });

      alert(
        "Registration submitted successfully! Awaiting approval from Event Admin.",
      );
      navigate("/user/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Failed to submit registration");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <p className="text-gray-600">Loading event details...</p>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <p className="text-red-600">Event not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Register for {event.name}
          </h1>
          <p className="text-gray-600 mb-6">
            Fill in the details below to register for this event
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                name="projectTitle"
                value={formData.projectTitle}
                onChange={handleInputChange}
                placeholder="Enter your project title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* Project Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description *
              </label>
              <textarea
                name="projectDescription"
                value={formData.projectDescription}
                onChange={handleInputChange}
                placeholder="Describe your project in detail"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="e.g., Technology, Art, Business"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* Team Members */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Members
              </label>
              <div className="space-y-2 mb-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={teamMember.name}
                    onChange={(e) =>
                      setTeamMember({ ...teamMember, name: e.target.value })
                    }
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTeamMember();
                      }
                    }}
                    placeholder="Member name"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  />
                  <select
                    value={teamMember.role}
                    onChange={(e) =>
                      setTeamMember({ ...teamMember, role: e.target.value })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  >
                    <option value="lead">Lead</option>
                    <option value="developer">Developer</option>
                    <option value="designer">Designer</option>
                    <option value="manager">Manager</option>
                    <option value="other">Other</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddTeamMember}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>

              {formData.teamMembers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 font-medium">
                    Added Members:
                  </p>
                  {formData.teamMembers.map((member, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 bg-indigo-50 border border-indigo-200 rounded-lg"
                    >
                      <div>
                        <p className="text-gray-800 font-medium">
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          Role:{" "}
                          {member.role.charAt(0).toUpperCase() +
                            member.role.slice(1)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTeamMember(idx)}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requirements (Optional)
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                placeholder="Any special requirements or needs for your stall"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* Event Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">
                Event Information
              </h3>
              <div className="space-y-1 text-sm text-blue-800">
                <p>
                  <strong>Event:</strong> {event.name}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(event.liveDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>Available Stalls:</strong>{" "}
                  {event.availableStalls || 0}/{event.numberOfStalls}
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition font-medium"
              >
                {submitting ? "Submitting..." : "Submit Registration"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
