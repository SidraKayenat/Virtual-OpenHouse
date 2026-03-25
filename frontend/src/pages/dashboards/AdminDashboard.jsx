import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { eventAPI, registrationAPI, userAPI } from "@/lib/api";
import {
  Clock,
  CheckCircle,
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  AlertCircle,
  Zap,
  ChevronRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";

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

// Date formatters
const fmt = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const fmtShort = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// Status maps
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

// ─── Reusable components ──────────────────────────────────────────────────
function Card({ children, className = "", style = {} }) {
  return (
    <div
      className={`rounded-2xl p-6 ${className}`}
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

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <motion.div variants={cardChild}>
      <Card className="flex flex-col gap-3 h-full">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}1a` }}
        >
          <Icon size={18} style={{ color: accent }} strokeWidth={2} />
        </div>
        <div>
          <p
            className="text-3xl font-bold text-white leading-none"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {value ?? "—"}
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            {label}
          </p>
        </div>
      </Card>
    </motion.div>
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

function Skeleton({ className = "" }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ background: "rgba(255,255,255,0.06)" }}
    />
  );
}


// ─── Main component ───────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    live: 0,
    published: 0,
    totalUsers: 0,
    totalAdmins: 0,
  });

  const [chartData, setChartData] = useState({
    eventsOverTime: [],
    topEventsRegistrations: [],
  });

  const [allEvents, setAllEvents] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load event statistics
      const statsData = await eventAPI.getStats();
      const eventStats = statsData.data || {};

      // Load user statistics
      const userStatsData = await userAPI.getStats();
      const userStats = userStatsData.data || {};

      // Calculate approved requests (approved + live + published)
      const approvedCount =
        (eventStats.approved || 0) +
        (eventStats.live || 0) +
        (eventStats.published || 0);

      setStats({
        pending: eventStats.pending || 0,
        approved: approvedCount,
        live: eventStats.live || 0,
        published: eventStats.published || 0,
        totalUsers: userStats.totalUsers || 0,
        totalAdmins: userStats.totalAdmins || 0,
      });

      // Fetch all events for tables
      const allEventsRes = await eventAPI.getAll({ limit: 1000 });
      const events = allEventsRes.data || [];
      setAllEvents(events);

      // Fetch recent users
      const recentUsersRes = await userAPI.getRecent(3);
      setRecentUsers(recentUsersRes.data || []);

      // Load chart data
      await loadChartData(events);
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async (allEvents = []) => {
    try {
      // Process data for "Events Created Over Time" chart
      const eventsByMonth = {};
      allEvents.forEach((event) => {
        const date = new Date(event.createdAt);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        if (!eventsByMonth[monthKey]) {
          eventsByMonth[monthKey] = 0;
        }
        eventsByMonth[monthKey]++;
      });

      const eventsChartData = Object.entries(eventsByMonth)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([month, count]) => ({
          month,
          events: count,
        }));

      setChartData((prev) => ({
        ...prev,
        eventsOverTime: eventsChartData,
      }));

      // Process data for "Top Events: Registrations vs Attendance"
      const topEventsData = [];
      for (const event of allEvents.slice(0, 5)) {
        try {
          const regStats = await registrationAPI.getStats(event._id);
          const regData = regStats.data || {};

          topEventsData.push({
            name: event.name.substring(0, 15),
            registrations: regData.totalRegistrations || 0,
            attendance: regData.totalAttendance || 0,
          });
        } catch (err) {
          console.warn(
            `Could not load stats for event ${event._id}:`,
            err.message
          );
        }
      }

      setChartData((prev) => ({
        ...prev,
        topEventsRegistrations: topEventsData,
      }));
    } catch (err) {
      console.error("Failed to load chart data:", err);
      // Continue without chart data if it fails
    }
  };

  const greeting =
    new Date().getHours() < 12
      ? "morning"
      : new Date().getHours() < 18
        ? "afternoon"
        : "evening";

  return (
    <div
      className="min-h-screen flex"
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

        <main className="flex-1 overflow-y-auto px-6 md:px-8 py-7 space-y-7">
          {/* Error */}
          {error && (
            <motion.div {...fadeUp(0)}>
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
            </motion.div>
          )}

          {/* Greeting */}
          <motion.div {...fadeUp(0)}>
            <h1
              className="text-white text-2xl font-bold leading-tight"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              Good {greeting}, <span style={{
                background: "linear-gradient(90deg,#a78bfa,#60a5fa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>Admin</span> 👋
            </h1>
            <p
              className="text-xs mt-1"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              Welcome back! Here's an overview of your platform activity.
            </p>
          </motion.div>

          {/* Stat Cards */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : (
            <motion.div
              variants={stagger}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 lg:grid-cols-6 gap-4"
            >
              <StatCard
                icon={Clock}
                label="Pending Requests"
                value={stats.pending}
                accent="#fbbf24"
              />
              <StatCard
                icon={CheckCircle}
                label="Approved Requests"
                value={stats.approved}
                accent="#34d399"
              />
              <StatCard
                icon={TrendingUp}
                label="Live Events"
                value={stats.live}
                accent="#ef4444"
              />
              <StatCard
                icon={Calendar}
                label="Published Events"
                value={stats.published}
                accent="#3b82f6"
              />
              <StatCard
                icon={Users}
                label="Total Users"
                value={stats.totalUsers}
                accent="#8b5cf6"
              />
              <StatCard
                icon={Zap}
                label="Total Admins"
                value={stats.totalAdmins}
                accent="#ec4899"
              />
            </motion.div>
          )}

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Events Created Over Time Chart */}
            <motion.div {...fadeUp(0.12)}>
              <Card>
                <SectionHeader
                  title="Events Created Over Time"
                  subtitle="Monthly event creation trend"
                />
                {chartData.eventsOverTime.length > 0 ? (
                  <div className="w-full h-80 -mx-6 px-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.eventsOverTime}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.1)"
                        />
                        <XAxis
                          dataKey="month"
                          tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                        />
                        <YAxis
                          tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(0,0,0,0.8)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            color: "white",
                          }}
                          cursor={{ stroke: "rgba(255,255,255,0.1)" }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="events"
                          stroke="#a78bfa"
                          strokeWidth={2.5}
                          dot={{
                            fill: "#a78bfa",
                            r: 5,
                          }}
                          activeDot={{ r: 7 }}
                          name="Events Created"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    No data available
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Top Events: Registrations vs Attendance Chart */}
            <motion.div {...fadeUp(0.14)}>
              <Card>
                <SectionHeader
                  title="Registrations vs Attendance"
                  subtitle="Top events comparison"
                />
                {chartData.topEventsRegistrations.length > 0 ? (
                  <div className="w-full h-80 -mx-6 px-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.topEventsRegistrations}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.1)"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                        />
                        <YAxis
                          tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(0,0,0,0.8)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            color: "white",
                          }}
                          cursor={{ stroke: "rgba(255,255,255,0.1)" }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="registrations"
                          stroke="#60a5fa"
                          strokeWidth={2.5}
                          dot={{
                            fill: "#60a5fa",
                            r: 5,
                          }}
                          activeDot={{ r: 7 }}
                          name="Registrations"
                        />
                        <Line
                          type="monotone"
                          dataKey="attendance"
                          stroke="#34d399"
                          strokeWidth={2.5}
                          dot={{
                            fill: "#34d399",
                            r: 5,
                          }}
                          activeDot={{ r: 7 }}
                          name="Attendance"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    No data available
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Data Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Live Events */}
            <motion.div {...fadeUp(0.15)}>
              <Card>
                <SectionHeader
                  title="Recent Live Events"
                  linkTo="/admin/events?status=live"
                  linkLabel="View all"
                />
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} />
                    ))}
                  </div>
                ) : allEvents.filter(e => e.status === "live").length > 0 ? (
                  <div className="space-y-3">
                    {allEvents
                      .filter(e => e.status === "live")
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .slice(0, 3)
                      .map(event => (
                        <RowItem
                          key={event._id}
                          to={`/admin/events/${event._id}`}
                          thumbnail={event.thumbnailUrl}
                          title={event.name}
                          sub={fmt(event.createdAt)}
                          badge={<StatusBadge status={event.status} map={STATUS_EVENT} />}
                          accentBg="linear-gradient(135deg,#ef4444,#dc2626)"
                        />
                      ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No live events currently</p>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Upcoming Events */}
            <motion.div {...fadeUp(0.16)}>
              <Card>
                <SectionHeader
                  title="Upcoming Events"
                  linkTo="/admin/events"
                  linkLabel="View all"
                />
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} />
                    ))}
                  </div>
                ) : allEvents.filter(
                  e => e.status === "published" && 
                    new Date(e.liveDate) > new Date()
                ).length > 0 ? (
                  <div className="space-y-3">
                    {allEvents
                      .filter(
                        e => e.status === "published" && 
                          new Date(e.liveDate) > new Date()
                      )
                      .sort((a, b) => new Date(a.liveDate) - new Date(b.liveDate))
                      .slice(0, 3)
                      .map(event => (
                        <RowItem
                          key={event._id}
                          to={`/admin/events/${event._id}`}
                          thumbnail={event.thumbnailUrl}
                          title={event.name}
                          sub={fmtShort(event.liveDate)}
                          badge={<StatusBadge status={event.status} map={STATUS_EVENT} />}
                          accentBg="linear-gradient(135deg,#3b82f6,#1d4ed8)"
                        />
                      ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No upcoming events scheduled</p>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Recent Users */}
            <motion.div {...fadeUp(0.17)}>
              <Card>
                <SectionHeader
                  title="Recent Users"
                  linkTo="/admin/users"
                  linkLabel="View all"
                />
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 rounded-xl" />
                    ))}
                  </div>
                ) : recentUsers.length > 0 ? (
                  <div className="space-y-3">
                    {recentUsers.map(user => (
                      <RowItem
                        key={user._id}
                        to={`/admin/users/${user._id}`}
                        thumbnail={user.profileImage}
                        title={user.name}
                        sub={`${user.email}`}
                        badge={
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                            style={{
                              background: "rgba(52,211,153,0.12)",
                              color: "#34d399",
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: "#34d399" }}
                            />
                            User
                          </span>
                        }
                        accentBg="linear-gradient(135deg,#8b5cf6,#6366f1)"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No users registered yet</p>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
