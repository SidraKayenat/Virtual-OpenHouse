import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export default function PublicNavbar() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (loading) return null;

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-gray-900 font-bold text-xl">
            OPEN HOUSE
          </Link>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-12">
            <Link
              to="/browseevents"
              className="relative text-gray-700 transition group"
            >
              Browse Events
              <span className="absolute left-1/2 bottom-0 w-0 h-[1px] bg-gray-700 transition-all -translate-x-1/2 group-hover:w-full"></span>
            </Link>

            <a
              href="#about"
              className="relative text-gray-700 transition group"
            >
              About
              <span className="absolute left-1/2 bottom-0 w-0 h-[1px] bg-gray-700 transition-all -translate-x-1/2 group-hover:w-full"></span>
            </a>

            <a
              href="#contact"
              className="relative text-gray-700 transition group"
            >
              Contact
              <span className="absolute left-1/2 bottom-0 w-0 h-[1px] bg-gray-700 transition-all -translate-x-1/2 group-hover:w-full"></span>
            </a>
          </div>

          {/* Right Side */}
          {!user ? (
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-gray-700 border border-gray-300 px-5 py-2 rounded-lg font-medium"
              >
                Log in
              </Link>

              <Link
                to="/signup"
                className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 font-medium"
              >
                Register
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4 relative">
              {/* Dashboard button */}
              <button
                onClick={() =>
                  navigate(
                    user.role === "admin"
                      ? "/admin/dashboard"
                      : "/user/dashboard",
                  )
                }
                className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Dashboard
              </button>

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
          )}
        </div>
      </div>
    </nav>
  );
}
