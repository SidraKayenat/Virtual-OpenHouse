import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

export default function Navbar({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch (err) {
      console.log("Logout error:", err);
    }
    navigate("/login");
  };

  return (
    <nav className="w-full border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xl font-bold text-gray-900">
              OPEN HOUSE
            </Link>
            <div className="hidden sm:block">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search events, stalls..."
                  className="w-72 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/user/create-event"
              className="hidden sm:inline-flex bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Create Event
            </Link>

            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-700">
                <div>{user?.name || "Guest"}</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                {user?.name ? user.name.charAt(0).toUpperCase() : "G"}
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
