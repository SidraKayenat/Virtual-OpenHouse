import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Bell } from "lucide-react";
import Notifications from "@/components/Notifications";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <nav className="w-full border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link to="/" className="text-xl font-bold text-gray-900">
            OPEN HOUSE
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-full border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xl font-bold text-gray-900">
              OPEN HOUSE
            </Link>
            <span className="text-sm text-gray-500">
              {user?.role === "admin" ? "Admin Dashboard" : "User Dashboard"}
            </span>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative group">
              <button className="relative p-2 text-gray-600 hover:text-gray-900 transition">
                <Bell size={20} />
              </button>
              <div className="absolute right-0 top-full mt-2 w-80 hidden group-hover:block z-50">
                <Notifications />
              </div>
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-700">
                <div className="font-medium">{user?.name || "User"}</div>
                {user?.organization && (
                  <div className="text-xs text-gray-500">
                    {user.organization}
                  </div>
                )}
              </div>

              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>

              {/* Create Event Button (User only) */}
              {user?.role !== "admin" && (
                <Link
                  to="/user/create-event"
                  className="px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition"
                >
                  + Create Event
                </Link>
              )}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
