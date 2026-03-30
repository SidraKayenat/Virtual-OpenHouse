import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Calendar,
  ClipboardList,
  CheckCircle,
  Clock,
  PlusCircle,
  Compass,
  ArrowRight,
  TrendingUp,
  Users,
  Bell,
  ChevronRight,
  Zap,
  CalendarCheck,
  XCircle,
  Eye,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { eventAPI, registrationAPI } from "@/lib/api";
import Sidebar from "@/components/sidebar/Sidebar";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";

// ─── Helpers ──────────────────────────────────────────────────────────────
const fmt = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const fmtShort = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const STATUS_EVENT = {
  pending: { label: "Pending", bg: "rgba(251,191,36,0.12)", color: "#fbbf24" },
  approved: {
    label: "Approved",
    bg: "rgba(52,211,153,0.12)",
    color: "#34d399",
  },
  published: {
    label: "Published",
    bg: "rgba(96,165,250,0.12)",
    color: "#60a5fa",
  },
  live: { label: "Live", bg: "rgba(248,113,113,0.12)", color: "#f87171" },
  rejected: {
    label: "Rejected",
    bg: "rgba(248,113,113,0.12)",
    color: "#f87171",
  },
  completed: {
    label: "Completed",
    bg: "rgba(148,163,184,0.1)",
    color: "#94a3b8",
  },
  cancelled: {
    label: "Cancelled",
    bg: "rgba(148,163,184,0.1)",
    color: "#94a3b8",
  },
};

const STATUS_REG = {
  pending: { label: "Pending", bg: "rgba(251,191,36,0.12)", color: "#fbbf24" },
  approved: {
    label: "Approved",
    bg: "rgba(52,211,153,0.12)",
    color: "#34d399",
  },
  rejected: {
    label: "Rejected",
    bg: "rgba(248,113,113,0.12)",
    color: "#f87171",
  },
  cancelled: {
    label: "Cancelled",
    bg: "rgba(148,163,184,0.1)",
    color: "#94a3b8",
  },
};

// ─── Animation helpers ────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1], delay },
  },
});

const stagger = { animate: { transition: { staggerChildren: 0.07 } } };

const cardChild = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  },
};

// ─── Reusable components ──────────────────────────────────────────────────
function StatusBadge({ status, map }) {
  const s = map[status] || map.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0"
      style={{ background: s.bg, color: s.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: s.color }}
      />
      {s.label}
    </span>
  );
}

function SectionHeader({ title, subtitle, linkTo, linkLabel }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2
          className="text-white font-bold text-[15px] tracking-tight"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-[12px] mt-0.5"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="flex items-center gap-1 text-[12px] font-medium"
          style={{ color: "#a78bfa" }}
        >
          {linkLabel || "View all"}
          <ChevronRight size={13} />
        </Link>
      )}
    </div>
  );
}

function Card({ children, className = "", style = {} }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Skeleton({ className = "" }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ background: "rgba(255,255,255,0.06)" }}
    />
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <motion.div variants={cardChild}>
      <Card className="flex flex-col gap-3 h-full">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}1a` }}
        >
          <Icon size={17} style={{ color: accent }} strokeWidth={2} />
        </div>
        <div>
          <p
            className="text-[28px] font-bold text-white leading-none"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {value ?? "—"}
          </p>
          <p
            className="text-[12px] mt-1"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            {label}
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

function RowItem({ thumbnail, title, sub, badge, to, accentBg }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3 rounded-xl transition-all duration-150 group"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "rgba(255,255,255,0.02)")
      }
    >
      <div
        className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center"
        style={{
          background: accentBg || "linear-gradient(135deg,#4f46e5,#7c3aed)",
        }}
      >
        {thumbnail ? (
          <img src={thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <Calendar size={16} className="text-white opacity-60" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-[13px] font-semibold truncate leading-tight">
          {title}
        </p>
        <p
          className="text-[11px] mt-0.5"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          {sub}
        </p>
      </div>
      {badge}
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────────────────
export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [myEvents, setMyEvents] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [eventsRes, liveRes, regsRes] = await Promise.all([
          eventAPI.getMyEvents(),
          eventAPI.getPublished(),
          registrationAPI.getMyRegistrations(),
        ]);
        setMyEvents(eventsRes.data || []);
        setLiveEvents(liveRes.data || []);
        setMyRegistrations(regsRes.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Derived values ────────────────────────────────────────────────────
  const totalEvents = myEvents.length;
  const pendingApprovals = myEvents.filter(
    (e) => e.status === "pending",
  ).length;
  const totalRegs = myRegistrations.length;
  const eventsAttended = myRegistrations.filter(
    (r) => r.status === "approved",
  ).length;

  const recentEvents = [...myEvents]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  const recentRegs = [...myRegistrations]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  const upcoming = myRegistrations
    .filter(
      (r) =>
        r.status === "approved" &&
        r.event?.liveDate &&
        new Date(r.event.liveDate) > new Date(),
    )
    .sort((a, b) => new Date(a.event.liveDate) - new Date(b.event.liveDate))
    .slice(0, 3);

  const notifications = [
    ...myEvents
      .filter((e) => e.status === "approved")
      .map((e) => ({
        id: `ev-${e._id}`,
        type: "success",
        text: `"${e.name}" was approved by admin.`,
        time: fmt(e.reviewedAt || e.updatedAt),
      })),
    ...myEvents
      .filter((e) => e.status === "rejected")
      .map((e) => ({
        id: `rej-${e._id}`,
        type: "error",
        text: `"${e.name}" was rejected.${e.rejectionReason ? ` "${e.rejectionReason}"` : ""}`,
        time: fmt(e.reviewedAt || e.updatedAt),
      })),
    ...myRegistrations
      .filter((r) => r.status === "approved")
      .slice(0, 2)
      .map((r) => ({
        id: `reg-${r._id}`,
        type: "success",
        text: `Your registration for "${r.event?.name || "an event"}" was approved.`,
        time: fmt(r.updatedAt),
      })),
  ].slice(0, 5);

  const greeting =
    new Date().getHours() < 12
      ? "morning"
      : new Date().getHours() < 18
        ? "afternoon"
        : "evening";

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <div
      className="h-screen flex"
      style={{
        background: "#0c0c0f",
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Syne:wght@700;800&display=swap');
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
      `}</style>

      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto px-6 md:px-8 py-7 space-y-6">
          {/* Error */}
          {error && (
            <div
              className="p-4 rounded-xl text-sm"
              style={{
                background: "rgba(248,113,113,0.1)",
                border: "1px solid rgba(248,113,113,0.2)",
                color: "#fca5a5",
              }}
            >
              {error}
            </div>
          )}

          {/* ── Greeting ────────────────────────────────────────────── */}
          <motion.div {...fadeUp(0)}>
            <h1
              className="text-white text-2xl font-bold leading-tight"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              Good {greeting},{" "}
              <span
                style={{
                  background: "linear-gradient(90deg,#a78bfa,#60a5fa)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {user?.name?.split(" ")[0] || "there"}
              </span>{" "}
              👋
            </h1>
            <p
              className="text-[13px] mt-1"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              Here's what's happening with your events today.
            </p>
          </motion.div>

          {/* ══ 1. STAT CARDS ══════════════════════════════════════════ */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : (
            <motion.div
              variants={stagger}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <StatCard
                icon={Calendar}
                label="Events Created"
                value={totalEvents}
                accent="#a78bfa"
              />
              <StatCard
                icon={ClipboardList}
                label="Registrations Received"
                value={totalRegs}
                accent="#60a5fa"
              />
              <StatCard
                icon={CalendarCheck}
                label="Events Attended"
                value={eventsAttended}
                accent="#34d399"
              />
              <StatCard
                icon={Clock}
                label="Pending Approvals"
                value={pendingApprovals}
                accent="#fbbf24"
              />
            </motion.div>
          )}

          {/* ══ Live Events Banner ══════════════════════════════════════ */}
          {!loading && liveEvents.length > 0 && (
            <motion.div {...fadeUp(0.08)}>
              <div
                className="rounded-2xl p-4 flex items-center justify-between gap-4"
                style={{
                  background:
                    "linear-gradient(135deg,rgba(239,68,68,0.1),rgba(124,58,237,0.08))",
                  border: "1px solid rgba(239,68,68,0.18)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                  <div>
                    <p className="text-white text-[13.5px] font-bold">
                      {liveEvents.length} event
                      {liveEvents.length > 1 ? "s" : ""} happening right now
                    </p>
                    <p
                      className="text-[11.5px]"
                      style={{ color: "rgba(255,255,255,0.38)" }}
                    >
                      Don't miss out — join while they're live
                    </p>
                  </div>
                </div>
                <Link
                  to="/browseevents"
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-semibold text-white"
                  style={{
                    background: "rgba(239,68,68,0.22)",
                    border: "1px solid rgba(239,68,68,0.28)",
                  }}
                >
                  <Zap size={13} /> Join Now
                </Link>
              </div>
            </motion.div>
          )}

          {/* ══ 2 + 5: Quick Actions + Notifications ═══════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Quick Actions */}
            <motion.div {...fadeUp(0.12)}>
              <Card className="h-full">
                <SectionHeader title="Quick Actions" subtitle="Jump right in" />
                <div className="flex flex-col gap-2.5">
                  {[
                    {
                      icon: PlusCircle,
                      label: "Create New Event",
                      sub: "Submit for approval",
                      to: "/user/create-event",
                      accent: "#a78bfa",
                    },
                    {
                      icon: Compass,
                      label: "Browse Events",
                      sub: "Discover & register",
                      to: "/browseevents",
                      accent: "#60a5fa",
                    },
                    {
                      icon: ClipboardList,
                      label: "My Registrations",
                      sub: "Track your registrations",
                      to: "/user/registrations",
                      accent: "#34d399",
                    },
                    {
                      icon: Eye,
                      label: "View My Events",
                      sub: "Manage created events",
                      to: "/user/events",
                      accent: "#fb923c",
                    },
                  ].map(({ icon: Icon, label, sub, to, accent }) => (
                    <Link
                      key={to}
                      to={to}
                      className="flex items-center gap-3 p-3 rounded-xl transition-all duration-150 group"
                      style={{
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.055)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.025)")
                      }
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${accent}1a` }}
                      >
                        <Icon size={15} style={{ color: accent }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-[13px] font-semibold leading-tight">
                          {label}
                        </p>
                        <p
                          className="text-[11px] truncate mt-0.5"
                          style={{ color: "rgba(255,255,255,0.3)" }}
                        >
                          {sub}
                        </p>
                      </div>
                      <ArrowRight
                        size={13}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: accent }}
                      />
                    </Link>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Notifications */}
            <motion.div {...fadeUp(0.16)} className="lg:col-span-2">
              <Card className="h-full">
                <SectionHeader
                  title="Notifications"
                  subtitle="Recent activity on your account"
                  linkTo="/user/notifications"
                />
                {loading ? (
                  <div className="flex flex-col gap-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-12 rounded-xl" />
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Bell
                      size={26}
                      style={{ color: "rgba(255,255,255,0.1)" }}
                    />
                    <p
                      className="text-[13px]"
                      style={{ color: "rgba(255,255,255,0.28)" }}
                    >
                      No notifications yet
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-start gap-3 p-3 rounded-xl"
                        style={{
                          background: "rgba(255,255,255,0.025)",
                          border: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {n.type === "success" ? (
                            <CheckCircle
                              size={14}
                              style={{ color: "#34d399" }}
                            />
                          ) : (
                            <XCircle size={14} style={{ color: "#f87171" }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] text-white leading-snug">
                            {n.text}
                          </p>
                          <p
                            className="text-[11px] mt-0.5"
                            style={{ color: "rgba(255,255,255,0.28)" }}
                          >
                            {n.time}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Pending registrations to review */}
                    {myEvents.some((e) =>
                      ["published", "live"].includes(e.status),
                    ) && (
                      <div
                        className="flex items-center gap-3 p-3 rounded-xl"
                        style={{
                          background: "rgba(251,191,36,0.06)",
                          border: "1px solid rgba(251,191,36,0.14)",
                        }}
                      >
                        <Users size={14} style={{ color: "#fbbf24" }} />
                        <p
                          className="text-[12.5px]"
                          style={{ color: "#fde68a" }}
                        >
                          You have active events — check your registrations to
                          review.
                        </p>
                        <Link
                          to="/user/registrations"
                          className="ml-auto text-[11px] font-semibold flex-shrink-0"
                          style={{ color: "#fbbf24" }}
                        >
                          Review →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* ══ 3 + 4: My Events + My Registrations ════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* My Events */}
            <motion.div {...fadeUp(0.2)}>
              <Card className="h-full">
                <SectionHeader
                  title="My Events"
                  subtitle={`${totalEvents} total`}
                  linkTo="/user/events"
                />
                {loading ? (
                  <div className="flex flex-col gap-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 rounded-xl" />
                    ))}
                  </div>
                ) : recentEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Calendar
                      size={26}
                      style={{ color: "rgba(255,255,255,0.1)" }}
                    />
                    <p
                      className="text-[13px]"
                      style={{ color: "rgba(255,255,255,0.28)" }}
                    >
                      No events created yet
                    </p>
                    <Link
                      to="/user/create-event"
                      className="text-[12px] font-semibold px-4 py-2 rounded-lg"
                      style={{
                        background: "rgba(167,139,250,0.12)",
                        color: "#a78bfa",
                        border: "1px solid rgba(167,139,250,0.2)",
                      }}
                    >
                      Create your first event
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {recentEvents.map((ev) => (
                      <RowItem
                        key={ev._id}
                        to={`/events/${ev._id}`}
                        thumbnail={ev.thumbnailUrl}
                        title={ev.name}
                        sub={fmt(ev.createdAt)}
                        badge={
                          <StatusBadge status={ev.status} map={STATUS_EVENT} />
                        }
                        accentBg="linear-gradient(135deg,#4f46e5,#7c3aed)"
                      />
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>

            {/* My Registrations */}
            <motion.div {...fadeUp(0.24)}>
              <Card className="h-full">
                <SectionHeader
                  title="My Registrations"
                  subtitle={`${totalRegs} total`}
                  linkTo="/user/registrations"
                />
                {loading ? (
                  <div className="flex flex-col gap-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 rounded-xl" />
                    ))}
                  </div>
                ) : recentRegs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <ClipboardList
                      size={26}
                      style={{ color: "rgba(255,255,255,0.1)" }}
                    />
                    <p
                      className="text-[13px]"
                      style={{ color: "rgba(255,255,255,0.28)" }}
                    >
                      No registrations yet
                    </p>
                    <Link
                      to="/browseevents"
                      className="text-[12px] font-semibold px-4 py-2 rounded-lg"
                      style={{
                        background: "rgba(96,165,250,0.12)",
                        color: "#60a5fa",
                        border: "1px solid rgba(96,165,250,0.2)",
                      }}
                    >
                      Browse events
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {recentRegs.map((reg) => (
                      <RowItem
                        key={reg._id}
                        to={`/registration/${reg._id}`}
                        title={reg.event?.name || "Event"}
                        sub={
                          reg.event?.liveDate
                            ? fmtShort(reg.event.liveDate)
                            : fmt(reg.createdAt)
                        }
                        badge={
                          <StatusBadge status={reg.status} map={STATUS_REG} />
                        }
                        accentBg="linear-gradient(135deg,#1e3a5f,#2563eb)"
                      />
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* ══ 6. Upcoming Events ══════════════════════════════════════ */}
          <motion.div {...fadeUp(0.28)}>
            <Card>
              <SectionHeader
                title="Upcoming Events"
                subtitle="Events you're attending soon"
                linkTo="/user/registrations"
              />
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-xl" />
                  ))}
                </div>
              ) : upcoming.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Zap size={26} style={{ color: "rgba(255,255,255,0.1)" }} />
                  <p
                    className="text-[13px]"
                    style={{ color: "rgba(255,255,255,0.28)" }}
                  >
                    No upcoming events — go register for one!
                  </p>
                  <Link
                    to="/browseevents"
                    className="text-[12px] font-semibold px-4 py-2 rounded-lg"
                    style={{
                      background: "rgba(167,139,250,0.12)",
                      color: "#a78bfa",
                      border: "1px solid rgba(167,139,250,0.2)",
                    }}
                  >
                    Browse events
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {upcoming.map((reg) => {
                    const ev = reg.event;
                    const daysLeft = Math.ceil(
                      (new Date(ev.liveDate) - new Date()) / 86400000,
                    );
                    const urgent = daysLeft <= 3;
                    return (
                      <Link
                        key={reg._id}
                        to={`/events/${ev._id}`}
                        className="relative flex flex-col justify-between p-4 rounded-xl group transition-all duration-200"
                        style={{
                          background:
                            "linear-gradient(135deg,rgba(79,70,229,0.16),rgba(124,58,237,0.09))",
                          border: "1px solid rgba(167,139,250,0.14)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.border =
                            "1px solid rgba(167,139,250,0.32)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.border =
                            "1px solid rgba(167,139,250,0.14)")
                        }
                      >
                        <span
                          className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: urgent
                              ? "rgba(248,113,113,0.18)"
                              : "rgba(167,139,250,0.18)",
                            color: urgent ? "#f87171" : "#c4b5fd",
                          }}
                        >
                          {daysLeft === 0
                            ? "Today!"
                            : daysLeft === 1
                              ? "Tomorrow"
                              : `${daysLeft}d left`}
                        </span>
                        <div>
                          <p className="text-white text-[13px] font-bold leading-tight pr-14 mb-1">
                            {ev.name}
                          </p>
                          <p
                            className="text-[11px]"
                            style={{ color: "rgba(255,255,255,0.38)" }}
                          >
                            {fmtShort(ev.liveDate)} · {ev.startTime || "TBD"}
                          </p>
                        </div>
                        <div
                          className="flex items-center gap-1 mt-4 text-[11px] font-semibold"
                          style={{ color: "#a78bfa" }}
                        >
                          View details{" "}
                          <ArrowRight
                            size={11}
                            className="group-hover:translate-x-0.5 transition-transform"
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
