import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  PlusCircle,
  Compass,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const userLinks = [
    { name: "Dashboard", path: "/user/dashboard", icon: LayoutDashboard },
    { name: "My Events", path: "/user/events", icon: Calendar },
    {
      name: "My Registrations",
      path: "/user/registrations",
      icon: ClipboardList,
    },
    { name: "Browse Events", path: "/browseevents", icon: Compass },
    { name: "Create Event", path: "/user/create-event", icon: PlusCircle },
    { name: "Settings", path: "/user/settings", icon: Settings },
  ];

  const adminLinks = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Event Approvals", path: "/admin/events/pending", icon: Calendar },
    { name: "All Events", path: "/admin/events", icon: Calendar },
    {
      name: "Registrations",
      path: "/admin/registrations",
      icon: ClipboardList,
    },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Settings", path: "/admin/settings", icon: Settings },
  ];

  const links = user?.role === "admin" ? adminLinks : userLinks;

  return (
    <aside className="w-64 h-full border-r bg-white p-5">
      {/* Logo */}
      <div className="text-xl font-bold mb-10">
        <Link to="/">OPEN HOUSE</Link>
      </div>

      <nav className="flex flex-col gap-2">
        {links.map((item) => {
          const Icon = item.icon;
          const active = location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
                ${
                  active
                    ? "bg-gray-100 text-black font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
