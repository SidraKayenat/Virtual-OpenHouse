import { useState } from "react";
import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { Bell, ChevronRight, Home } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "../notifications/notificationBell";
// ─── Route → breadcrumb map ───────────────────────────────────────────────
// Each entry: path pattern → array of { label, href? }
// Dynamic segments (:id) are handled separately below.

const STATIC_CRUMBS = {
  "/user/dashboard": [{ label: "Dashboard" }],
  "/user/create-event": [
    { label: "Dashboard", href: "/user/dashboard" },
    { label: "Create Event" },
  ],
  "/user/events": [
    { label: "Dashboard", href: "/user/dashboard" },
    { label: "My Events" },
  ],
  "/user/registrations": [
    { label: "Dashboard", href: "/user/dashboard" },
    { label: "My Registrations" },
  ],
  "/user/settings": [
    { label: "Dashboard", href: "/user/dashboard" },
    { label: "Settings" },
  ],
  "/user/notifications": [
    { label: "Dashboard", href: "/user/dashboard" },
    { label: "Notifications" },
  ],
  "/user/tickets": [
    { label: "Dashboard", href: "/user/dashboard" },
    { label: "My Tickets" },
  ],
  "/browseevents": [{ label: "Browse Events" }],
  "/admin/dashboard": [{ label: "Admin Dashboard" }],
  "/admin/events": [
    { label: "Admin Dashboard", href: "/admin/dashboard" },
    { label: "All Events" },
  ],
  "/admin/events/pending": [
    { label: "Admin Dashboard", href: "/admin/dashboard" },
    { label: "Event Approvals" },
  ],
  "/admin/events/live": [
    { label: "Admin Dashboard", href: "/admin/dashboard" },
    { label: "Live Events" },
  ],
  "/admin/registrations": [
    { label: "Admin Dashboard", href: "/admin/dashboard" },
    { label: "Registrations" },
  ],
  "/admin/users": [
    { label: "Admin Dashboard", href: "/admin/dashboard" },
    { label: "Users" },
  ],
  "/admin/analytics": [
    { label: "Admin Dashboard", href: "/admin/dashboard" },
    { label: "Analytics" },
  ],
  "/admin/settings": [
    { label: "Admin Dashboard", href: "/admin/dashboard" },
    { label: "Settings" },
  ],
  "/admin/permissions": [
    { label: "Admin Dashboard", href: "/admin/dashboard" },
    { label: "Permissions" },
  ],
};

// Dynamic patterns — matched in order, first match wins.
// `test` receives the full pathname, `crumbs` is a function(params) → crumb array.
const DYNAMIC_CRUMBS = [
  {
    test: /^\/events\/([^/]+)$/,
    crumbs: ([, id]) => [
      { label: "Browse Events", href: "/browseevents" },
      { label: "Event Details" },
    ],
  },
  {
    test: /^\/event\/([^/]+)\/edit$/,
    crumbs: ([, id]) => [
      { label: "My Events", href: "/user/events" },
      { label: "Edit Event" },
    ],
  },
  {
    test: /^\/event\/manage\/([^/]+)$/,
    crumbs: ([, id]) => [
      { label: "My Events", href: "/user/events" },
      { label: "Manage Event" },
    ],
  },
  {
    test: /^\/event\/view\/([^/]+)$/,
    crumbs: ([, id]) => [
      { label: "Browse Events", href: "/browseevents" },
      { label: "Event Viewer" },
    ],
  },
  {
    test: /^\/user\/register\/([^/]+)$/,
    crumbs: ([, id]) => [
      { label: "Browse Events", href: "/browseevents" },
      { label: "Register for Event" },
    ],
  },
  {
    test: /^\/registration\/([^/]+)$/,
    crumbs: ([, id]) => [
      { label: "My Registrations", href: "/user/registrations" },
      { label: "Registration Details" },
    ],
  },
];

function useBreadcrumbs() {
  const location = useLocation();
  const path = location.pathname;

  // Try static map first (exact match)
  if (STATIC_CRUMBS[path]) return STATIC_CRUMBS[path];

  // Try dynamic patterns
  for (const { test, crumbs } of DYNAMIC_CRUMBS) {
    const match = path.match(test);
    if (match) return crumbs(match);
  }

  // Fallback: capitalise each segment
  const parts = path.split("/").filter(Boolean);
  return parts.map((part, i) => ({
    label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " "),
    href:
      i < parts.length - 1 ? "/" + parts.slice(0, i + 1).join("/") : undefined,
  }));
}

// ─── Breadcrumb renderer ──────────────────────────────────────────────────
function Breadcrumbs() {
  const crumbs = useBreadcrumbs();

  return (
    <nav className="flex items-center gap-1" aria-label="Breadcrumb">
      {/* Home icon always first */}
      <Link
        to="/"
        className="flex items-center transition-colors"
        style={{ color: "rgba(255,255,255,0.3)" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "rgba(255,255,255,0.7)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "rgba(255,255,255,0.3)")
        }
      >
        <Home size={13} strokeWidth={2} />
      </Link>

      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight
              size={12}
              strokeWidth={2}
              style={{ color: "rgba(255,255,255,0.18)" }}
            />
            {!isLast && crumb.href ? (
              <Link
                to={crumb.href}
                className="text-[12.5px] font-medium transition-colors whitespace-nowrap"
                style={{ color: "rgba(255,255,255,0.38)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.72)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.38)")
                }
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className="text-[12.5px] font-semibold whitespace-nowrap"
                style={{
                  color: isLast
                    ? "rgba(255,255,255,0.88)"
                    : "rgba(255,255,255,0.38)",
                }}
              >
                {crumb.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

// ─── Main Navbar ──────────────────────────────────────────────────────────
export default function DashboardNavbar() {
  const { user, loading } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);

  if (loading) {
    return (
      <div
        className="h-14 flex items-center px-6 flex-shrink-0"
        style={{
          background: "rgba(12,12,15,0.9)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
        }}
      />
    );
  }

  return (
    <nav
      className="h-14 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-40"
      style={{
        background: "rgba(12,12,15,0.88)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* ── Left: Breadcrumbs ── */}
      <Breadcrumbs />

      {/* ── Right: Bell + Avatar ── */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <div className="relative">
          <NotificationBell />
        </div>

        <div
          className="w-px h-5"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />

        {/* Avatar + name */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="hidden sm:block">
            <p
              className="text-[13px] font-semibold leading-none"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              {user?.name || "User"}
            </p>
            {user?.organization && (
              <p
                className="text-[10.5px] mt-0.5"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {user.organization}
              </p>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
