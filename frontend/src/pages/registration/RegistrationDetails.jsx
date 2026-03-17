import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import { registrationAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

export default function RegistrationDetails() {
  const { registrationId } = useParams();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [stallNumber, setStallNumber] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  useEffect(() => {
    const loadRegistration = async () => {
      try {
        setLoading(true);
        const res = await registrationAPI.getById(registrationId);
        setRegistration(res.data);
      } catch (err) {
        console.error("Failed to load registration:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadRegistration();
  }, [registrationId]);

  const handleApprove = async () => {
    if (!stallNumber || stallNumber < 1) {
      alert("Please enter a valid stall number");
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      await registrationAPI.approve(registrationId, parseInt(stallNumber));

      alert("Registration approved successfully!");
      setShowApprovalForm(false);

      // Reload registration
      const res = await registrationAPI.getById(registrationId);
      setRegistration(res.data);
    } catch (err) {
      console.error("Approve error:", err);
      setError(err.message || "Failed to approve registration");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      await registrationAPI.reject(registrationId, rejectionReason);

      alert("Registration rejected successfully!");
      setShowRejectionForm(false);

      // Reload registration
      const res = await registrationAPI.getById(registrationId);
      setRegistration(res.data);
    } catch (err) {
      console.error("Reject error:", err);
      setError(err.message || "Failed to reject registration");
    } finally {
      setActionLoading(false);
    }
  };

  const isEventAdmin =
    user && registration && registration.event?.createdBy === user._id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <p className="text-gray-600">Loading registration details...</p>
        </main>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <p className="text-red-600">Registration not found</p>
        </main>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {/* Status and Basic Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Registration Details
              </h1>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(registration.status)}`}
              >
                {registration.status.charAt(0).toUpperCase() +
                  registration.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <p>
              <strong className="text-gray-700">Event:</strong>{" "}
              <span className="text-gray-900">{registration.event?.name}</span>
            </p>
            <p>
              <strong className="text-gray-700">Applicant:</strong>{" "}
              <span className="text-gray-900">
                {registration.user?.name} ({registration.user?.email})
              </span>
            </p>
            {registration.user?.organization && (
              <p>
                <strong className="text-gray-700">Organization:</strong>{" "}
                <span className="text-gray-900">
                  {registration.user.organization}
                </span>
              </p>
            )}
            <p>
              <strong className="text-gray-700">Submitted:</strong>{" "}
              <span className="text-gray-900">
                {new Date(registration.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </p>
          </div>
        </div>

        {/* Project Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Project Information
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {registration.participantInfo?.projectTitle}
              </h3>
              <p className="text-gray-600 text-sm">
                {registration.participantInfo?.projectDescription}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">
                <strong>Category:</strong>{" "}
                {registration.participantInfo?.category}
              </p>
            </div>

            {registration.participantInfo?.teamMembers?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Team Members
                </p>
                <ul className="list-disc list-inside space-y-2">
                  {registration.participantInfo.teamMembers.map(
                    (member, idx) => (
                      <li key={idx} className="text-sm text-gray-700">
                        <span className="font-medium">{member.name}</span>
                        {member.role && (
                          <span className="text-gray-600">
                            {" "}
                            -{" "}
                            {member.role.charAt(0).toUpperCase() +
                              member.role.slice(1)}
                          </span>
                        )}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}

            {registration.participantInfo?.requirements && (
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Special Requirements
                </p>
                <p className="text-sm text-gray-700">
                  {registration.participantInfo.requirements}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stall Assignment */}
        {registration.status === "approved" && registration.stallNumber && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-semibold text-green-900">Stall Assigned</h3>
                <p className="text-green-800 text-sm mt-1">
                  Stall Number: <strong>{registration.stallNumber}</strong>
                </p>
                {registration.approvedBy && (
                  <p className="text-green-700 text-xs mt-2">
                    Approved by {registration.approvedBy?.name} on{" "}
                    {new Date(registration.approvedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rejection Reason */}
        {registration.status === "rejected" && registration.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <XCircle className="text-red-600 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-semibold text-red-900">
                  Registration Rejected
                </h3>
                <p className="text-red-800 text-sm mt-2">
                  <strong>Reason:</strong> {registration.rejectionReason}
                </p>
                {registration.rejectedBy && (
                  <p className="text-red-700 text-xs mt-2">
                    Rejected by {registration.rejectedBy?.name} on{" "}
                    {new Date(registration.rejectedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Event Admin Actions */}
        {isEventAdmin && registration.status === "pending" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Admin Actions
            </h2>

            <div className="space-y-4">
              {/* Approval Form */}
              {!showApprovalForm && !showRejectionForm && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowApprovalForm(true)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectionForm(true)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    Reject
                  </button>
                </div>
              )}

              {/* Approval Form */}
              {showApprovalForm && (
                <div className="border rounded-lg p-4 bg-green-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stall Number *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={registration.event?.numberOfStalls}
                    value={stallNumber}
                    onChange={(e) => setStallNumber(e.target.value)}
                    placeholder={`Enter stall number (1-${registration.event?.numberOfStalls})`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition mb-4"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
                    >
                      {actionLoading ? "Processing..." : "Confirm Approval"}
                    </button>
                    <button
                      onClick={() => {
                        setShowApprovalForm(false);
                        setStallNumber("");
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Rejection Form */}
              {showRejectionForm && (
                <div className="border rounded-lg p-4 bg-red-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for rejection..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition mb-4"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition font-medium"
                    >
                      {actionLoading ? "Processing..." : "Confirm Rejection"}
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectionForm(false);
                        setRejectionReason("");
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
