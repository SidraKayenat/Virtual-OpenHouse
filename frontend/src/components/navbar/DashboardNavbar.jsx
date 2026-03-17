import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Bell } from "lucide-react";
import Notifications from "@/components/Notifications";
import { useAuth } from "@/context/AuthContext";

export default function DashboardNavbar() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (loading) {
    return (
      <nav className=" border-b border-gray-200 bg-white">
        <div className=" px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link to="/" className="text-xl font-bold text-gray-900">
            OPEN HOUSE
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-bold text-gray-900">
            OPEN HOUSE
          </Link>
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
          {/* <div className="flex items-center gap-3">
            <div className="text-sm text-gray-700">
              <div className="font-medium">{user?.name || "User"}</div>
              {user?.organization && (
                <div className="text-xs text-gray-500">{user.organization}</div>
              )}
            </div>

            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>

            {user?.role !== "admin" && (
              <Link
                to="/user/create-event"
                className="px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition"
              >
                + Create Event
              </Link>
            )}

            
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div> */}

          {/* Avatar */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold"
            >
              {user.name?.charAt(0).toUpperCase()}
            </button>

            {open && (
              <div className="z-50 absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-md">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
