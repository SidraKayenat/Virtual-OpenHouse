import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  PlusCircle,
  Compass,
  ClipboardList,
  CheckSquare,
  Bell,
  BarChart2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Ticket,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// ─── Nav link groups ──────────────────────────────────────────────────────
const userGroups = [
  {
    label: "Overview",
    links: [
      { name: "Dashboard", path: "/user/dashboard", icon: LayoutDashboard },
      { name: "Browse Events", path: "/browseevents", icon: Compass },
      { name: "Notifications", path: "/notifications", icon: Bell },
    ],
  },
  {
    label: "My Activity",
    links: [
      { name: "My Events", path: "/user/events", icon: Calendar },
      {
        name: "Registrations",
        path: "/user/registrations",
        icon: ClipboardList,
      },
      {
        name: "Stalls",
        path: "/user/stalls",
        icon: ClipboardList,
      },
      // { name: "My Tickets (PF)", path: "/user/tickets", icon: Ticket },
      // { name: "Notifications", path: "/user/notifications", icon: Bell },
    ],
  },
  {
    label: "Manage",
    links: [
      { name: "Create Event", path: "/user/create-event", icon: PlusCircle },
      { name: "Settings", path: "/user/settings", icon: Settings },
    ],
  },
];

const adminGroups = [
  {
    label: "Overview",
    links: [
      { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
      { name: "Notifications", path: "/notifications", icon: Bell },
      { name: "Browse Events", path: "/browseevents", icon: Compass },
    ],
  },

  {
    label: "Management",
    links: [
      {
        name: "Event Requests",
        path: "/admin/events/requests",
        icon: CheckSquare,
      },
      { name: "All Events", path: "/admin/events", icon: Calendar },
      { name: "All Users", path: "/admin/users", icon: Users },
      // { name: "All Stalls", path: "/admin/stalls", icon: ClipboardList },
    ],
  },
  {
    label: "Moderation",
    links: [
      // {
      //   name: "Pending Events",
      //   path: "/admin/events/requests",
      //   icon: CheckSquare,
      // },
      {
        name: "Reported Content",
        path: "/admin/reports", // future
        icon: Bell,
      },
    ],
  },
  {
    label: "System",
    links: [
      { name: "Settings", path: "/admin/settings", icon: Settings },
      {
        name: "Team & Management",
        path: "/admin/teams",
        icon: ShieldCheck,
      },
      {
        name: "Logs / Activity",
        path: "/admin/logs",
        icon: BarChart2,
      },
    ],
  },
];

// ─── Animation variants ───────────────────────────────────────────────────
const sidebarVariants = {
  expanded: {
    width: 240,
    transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] },
  },
  collapsed: {
    width: 68,
    transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] },
  },
};

const labelVariants = {
  show: { opacity: 1, x: 0, transition: { duration: 0.2, delay: 0.1 } },
  hide: { opacity: 0, x: -8, transition: { duration: 0.15 } },
};

const groupLabelVariants = {
  show: { opacity: 1, transition: { duration: 0.2, delay: 0.12 } },
  hide: { opacity: 0, transition: { duration: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, duration: 0.25, ease: "easeOut" },
  }),
};

// ─── Single nav link ──────────────────────────────────────────────────────
function NavLink({ item, index, collapsed, active }) {
  return (
    <motion.div
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="show"
    >
      <Link
        to={item.path}
        title={collapsed ? item.name : undefined}
        className="relative flex items-center gap-3 rounded-xl px-3 py-[9px] text-sm transition-colors duration-150 group"
        style={{
          color: active ? "#fff" : "rgba(255,255,255,0.52)",
          background: active ? "rgba(255,255,255,0.1)" : "transparent",
        }}
      >
        {/* Active left bar */}
        <AnimatePresence>
          {active && (
            <motion.span
              layoutId="activeBar"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
              style={{ background: "linear-gradient(180deg,#a78bfa,#7c3aed)" }}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              transition={{ duration: 0.22 }}
            />
          )}
        </AnimatePresence>

        {/* Hover bg */}
        <span
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ background: "rgba(255,255,255,0.05)" }}
        />

        {/* Icon */}
        <item.icon
          size={17}
          className="relative z-10 flex-shrink-0"
          strokeWidth={active ? 2.2 : 1.8}
          style={{ color: active ? "#c4b5fd" : "rgba(255,255,255,0.45)" }}
        />

        {/* Label */}
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              variants={labelVariants}
              initial="hide"
              animate="show"
              exit="hide"
              className="relative z-10 truncate font-medium"
              style={{ fontSize: 13.5, letterSpacing: "0.01em" }}
            >
              {item.name}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Tooltip when collapsed */}
        {collapsed && (
          <span
            className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
            style={{
              background: "#1e1e2e",
              color: "#e2e8f0",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            }}
          >
            {item.name}
          </span>
        )}
      </Link>
    </motion.div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────
export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const groups = user?.role === "admin" ? adminGroups : userGroups;

  // Flatten for active check
  const allLinks = groups.flatMap((g) => g.links);

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  // Track global link index for stagger
  let linkIndex = 0;

  const handleLogout = async () => {
    try {
      await logout?.();
      navigate("/login");
    } catch {
      navigate("/login");
    }
  };

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={collapsed ? "collapsed" : "expanded"}
      className="relative flex flex-col min-h-screen h-full flex-shrink-0 overflow-visible"
      style={{
        background: "linear-gradient(180deg, #0f0f1a 0%, #12101e 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Top: Logo ── */}
      <div
        className="flex items-center px-4 pt-5 pb-4"
        style={{ minHeight: 64 }}
      >
        {/* Icon mark */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
        >
          <svg viewBox="0 0 20 20" className="w-4 h-4 fill-white">
            <path
              d="M10 2L2 7l8 5 8-5-8-5zM2 13l8 5 8-5M2 10l8 5 8-5"
              stroke="white"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              variants={labelVariants}
              initial="hide"
              animate="show"
              exit="hide"
              className="ml-3 overflow-hidden"
            >
              <p
                className="text-white font-bold text-[15px] leading-none tracking-wide"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                OPEN HOUSE
              </p>
              <p
                className="text-[10.5px] mt-0.5"
                style={{
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: "0.08em",
                }}
              >
                {user?.role === "admin" ? "ADMIN PORTAL" : "EVENT PLATFORM"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Divider ── */}
      <div
        className="mx-4 mb-3"
        style={{ height: 1, background: "rgba(255,255,255,0.06)" }}
      />

      {/* ── User chip ── */}
      {/* {!collapsed && user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="mx-3 mb-4 px-3 py-2.5 rounded-xl flex items-center gap-3"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-xs font-semibold truncate leading-none">
              {user?.name || "User"}
            </p>
            <p
              className="text-[10.5px] mt-0.5 truncate capitalize"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              {user?.role === "admin" ? "System Admin" : "Event Admin"}
            </p>
          </div>
        </motion.div>
      )}
      {collapsed && user && (
        <div className="mx-3 mb-4 flex justify-center">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}
            title={user?.name}
          >
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        </div>
      )} */}

      {/* ── Nav groups ── */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 flex flex-col gap-1 pb-4"
        style={{ scrollbarWidth: "none" }}
      >
        {groups.map((group, gIdx) => (
          <div key={group.label} className={gIdx > 0 ? "mt-3" : ""}>
            {/* Group label */}
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  variants={groupLabelVariants}
                  initial="hide"
                  animate="show"
                  exit="hide"
                  className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: "rgba(255,255,255,0.22)" }}
                >
                  {group.label}
                </motion.p>
              )}
            </AnimatePresence>
            {collapsed && gIdx > 0 && (
              <div
                className="mx-2 my-2"
                style={{ height: 1, background: "rgba(255,255,255,0.06)" }}
              />
            )}

            {/* Links */}
            <div className="flex flex-col gap-0.5">
              {group.links.map((item) => {
                const idx = linkIndex++;
                return (
                  <NavLink
                    key={item.path}
                    item={item}
                    index={idx}
                    collapsed={collapsed}
                    active={isActive(item.path)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom: Logout ── */}
      <div className="px-3 pb-5">
        <div
          className="mb-3"
          style={{ height: 1, background: "rgba(255,255,255,0.06)" }}
        />
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className="relative flex items-center gap-3 w-full rounded-xl px-3 py-[9px] text-sm transition-colors duration-150 group"
          style={{ color: "rgba(255,255,255,0.38)" }}
        >
          <span
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            style={{ background: "rgba(239,68,68,0.08)" }}
          />
          <LogOut
            size={16}
            strokeWidth={1.8}
            className="relative z-10 flex-shrink-0 group-hover:text-red-400 transition-colors"
          />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                variants={labelVariants}
                initial="hide"
                animate="show"
                exit="hide"
                className="relative z-10 font-medium group-hover:text-red-400 transition-colors"
                style={{ fontSize: 13.5 }}
              >
                Log out
              </motion.span>
            )}
          </AnimatePresence>
          {collapsed && (
            <span
              className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
              style={{
                background: "#1e1e2e",
                color: "#fca5a5",
                border: "1px solid rgba(239,68,68,0.2)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              }}
            >
              Log out
            </span>
          )}
        </button>
      </div>

      {/* ── Collapse toggle ── */}
      <motion.button
        onClick={() => setCollapsed(!collapsed)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        className="absolute -right-3 top-[72px] z-0 w-6 h-6 rounded-full flex items-center justify-center"
        style={{
          background: "#1e1b30",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          color: "rgba(255,255,255,0.5)",
        }}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight size={12} strokeWidth={2.5} />
        ) : (
          <ChevronLeft size={12} strokeWidth={2.5} />
        )}
      </motion.button>
    </motion.aside>
  );
}
