import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { registrationAPI } from "@/lib/api";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";

const MyRegistrations = () => {
  const [myRegistrations, setMyRegistrations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load user's registrations
        const registrationsData = await registrationAPI.getMyRegistrations();
        setMyRegistrations(registrationsData.data || []);
      } catch (err) {
        console.error("Failed to load registrations:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        {/* <Navbar /> */}
        <Sidebar />

        <div className="flex-1 flex flex-col">
          <DashboardNavbar />

          <main className="flex-1 overflow-y-auto px-8 py-6">
            <p className="text-gray-600">Loading Registrations...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* <Navbar /> */}
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
            <h1 className="text-3xl font-bold">My Registrations</h1>
          </div>

          {/* My Registrations Section */}
          <section className="mt-8 bg-white rounded shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                My Registrations ({myRegistrations.length})
              </h2>
            </div>

            {myRegistrations.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">
                  You haven't registered for any events yet.
                </p>
                <Link
                  to="/"
                  className="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                >
                  Browse Events
                </Link>
              </div>
            ) : (
              <div className="space-y-4 p-6">
                {myRegistrations.map((registration) => {
                  const statusColor =
                    {
                      pending: "bg-yellow-50 border-yellow-200",
                      approved: "bg-green-50 border-green-200",
                      rejected: "bg-red-50 border-red-200",
                      cancelled: "bg-gray-50 border-gray-200",
                    }[registration.status] || "bg-gray-50 border-gray-200";

                  const statusBadgeColor =
                    {
                      pending: "bg-yellow-100 text-yellow-800",
                      approved: "bg-green-100 text-green-800",
                      rejected: "bg-red-100 text-red-800",
                      cancelled: "bg-gray-100 text-gray-800",
                    }[registration.status] || "bg-gray-100 text-gray-800";

                  return (
                    <div
                      key={registration._id}
                      className={`border rounded-lg p-6 ${statusColor}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">
                              {registration.participantInfo?.projectTitle}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded text-xs font-medium ${statusBadgeColor}`}
                            >
                              {registration.status.charAt(0).toUpperCase() +
                                registration.status.slice(1)}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600">
                            Event:{" "}
                            <span className="font-medium">
                              {registration.event?.name}
                            </span>
                          </p>

                          <p className="text-sm text-gray-700 mt-2">
                            {registration.participantInfo?.projectDescription?.substring(
                              0,
                              100,
                            )}
                            ...
                          </p>

                          <div className="flex flex-wrap gap-6 mt-4 text-sm">
                            <span>
                              📂 {registration.participantInfo?.category}
                            </span>
                            <span>
                              👥{" "}
                              {registration.participantInfo?.teamMembers
                                ?.length || 0}{" "}
                              members
                            </span>
                            <span>
                              📅 {formatDate(registration.event?.liveDate)}
                            </span>
                          </div>

                          {registration.status === "approved" && (
                            <p className="text-sm text-green-700 mt-3 font-medium">
                              ✓ Stall #{registration.stallNumber} Assigned
                            </p>
                          )}

                          {registration.status === "rejected" && (
                            <div className="mt-3 p-2 bg-red-100 bg-opacity-70 rounded text-sm">
                              <strong>Rejection Reason:</strong>{" "}
                              {registration.rejectionReason}
                            </div>
                          )}
                        </div>

                        <Link
                          to={`/registration/${registration._id}`}
                          className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 transition"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default MyRegistrations;
