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
  AlertCircle,
  Zap,
  ChevronRight,
  LayoutGrid,
  Eye,
  ThumbsUp,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
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

// Colors
const COLORS = {
  primary: "#a78bfa",
  secondary: "#60a5fa",
  success: "#34d399",
  warning: "#fbbf24",
  danger: "#f87171",
  info: "#60a5fa",
  pink: "#ec4899",
  purple: "#8b5cf6",
  gray: "#94a3b8",
};

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
            {value?.toLocaleString() ?? "—"}
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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-xl p-3 shadow-lg"
        style={{
          background: "#0C0C0F",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "12px",
        }}
      >
        <p
          className="text-[11px] font-semibold mb-2"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          {label}
        </p>
        {payload.map((item, idx) => (
          <p key={idx} className="text-[12px] flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: item.color }}
            />
            <span style={{ color: "rgba(255,255,255,0.8)" }}>{item.name}:</span>
            <span style={{ color: item.color, fontWeight: "bold" }}>
              {item.value.toLocaleString()}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    live: 0,
    published: 0,
    completed: 0,
    totalUsers: 0,
    totalAdmins: 0,
    totalRegistrations: 0, // Changed from totalStalls
    approvedRegistrations: 0, // New
    pendingRegistrations: 0, // New
  });

  const [eventStatusData, setEventStatusData] = useState([]);
  const [weeklyEvents, setWeeklyEvents] = useState([]);
  const [topEvents, setTopEvents] = useState([]);
  const [registrationTrend, setRegistrationTrend] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Helper function to get day of week name
  const getDayName = (date) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[date.getDay()];
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Load Event Statistics
      const eventStatsData = await eventAPI.getStats();
      console.log("Event Stats:", eventStatsData);
      const eventStats = eventStatsData.data || eventStatsData || {};

      // 2. Load User Statistics
      const userStatsData = await userAPI.getStats();
      console.log("User Stats:", userStatsData);
      const userStats = userStatsData.data || userStatsData || {};

      // 3. Fetch all events first (needed for registration calculations)
      const allEventsRes = await eventAPI.getAll({ limit: 100 });
      const events = allEventsRes.data || [];
      setRecentEvents(events.slice(0, 5));

      // 4. Initialize registration counters
      let allRegistrationsCount = 0;
      let approvedRegistrationsCount = 0;
      let pendingRegistrationsCount = 0;

      // 5. Collect registration trends (last 6 months)
      const registrationTrendMap = new Map();

      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString("default", { month: "short" });
        const year = date.getFullYear();
        const key = `${year}-${monthName}`;
        registrationTrendMap.set(key, {
          month: `${monthName} ${year}`,
          count: 0,
        });
      }

      // Count registrations per event
      for (const event of events) {
        try {
          const regStats = await registrationAPI.getStats(event._id);
          const regData = regStats.data || {};
          const totalRegs = regData.total || 0;

          // Add to running totals
          allRegistrationsCount += totalRegs;
          approvedRegistrationsCount += regData.approved || 0;
          pendingRegistrationsCount += regData.pending || 0;

          // For trend, distribute based on event creation date as a proxy
          if (event.createdAt && totalRegs > 0) {
            const date = new Date(event.createdAt);
            const monthName = date.toLocaleString("default", {
              month: "short",
            });
            const year = date.getFullYear();
            const key = `${year}-${monthName}`;
            const existing = registrationTrendMap.get(key);
            if (existing) {
              existing.count += totalRegs;
            }
          }
        } catch (err) {
          console.warn(
            `Failed to load registration stats for event ${event._id}:`,
            err,
          );
        }
      }

      // Calculate approved count
      const approvedCount =
        (eventStats.approved || 0) +
        (eventStats.live || 0) +
        (eventStats.published || 0);

      // Update stats state
      setStats({
        pending: eventStats.pending || 0,
        approved: approvedCount,
        live: eventStats.live || 0,
        published: eventStats.published || 0,
        completed: eventStats.completed || 0,
        totalUsers: userStats.totalUsers || 0,
        totalAdmins: userStats.totalAdmins || 0,
        totalRegistrations: allRegistrationsCount,
        approvedRegistrations: approvedRegistrationsCount,
        pendingRegistrations: pendingRegistrationsCount,
      });

      // 6. Event Status Distribution for Pie Chart
      const statusDist = [
        {
          name: "Pending",
          value: eventStats.pending || 0,
          color: COLORS.warning,
        },
        {
          name: "Approved",
          value: eventStats.approved || 0,
          color: COLORS.success,
        },
        {
          name: "Published",
          value: eventStats.published || 0,
          color: COLORS.secondary,
        },
        { name: "Live", value: eventStats.live || 0, color: COLORS.danger },
        {
          name: "Completed",
          value: eventStats.completed || 0,
          color: COLORS.gray,
        },
      ].filter((item) => item.value > 0);
      setEventStatusData(statusDist);

      // 7. Process Weekly Events (Last 7 days)
      const weeklyMap = new Map();
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);

      const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      daysOfWeek.forEach((day) => {
        weeklyMap.set(day, { day, count: 0 });
      });

      events.forEach((event) => {
        if (event.createdAt) {
          const date = new Date(event.createdAt);
          if (date >= sevenDaysAgo && date <= today) {
            const dayName = getDayName(date);
            const existing = weeklyMap.get(dayName);
            if (existing) {
              existing.count += 1;
            }
          }
        }
      });

      const weeklyData = daysOfWeek.map(
        (day) => weeklyMap.get(day) || { day, count: 0 },
      );
      setWeeklyEvents(weeklyData);

      // 8. Fetch recent users
      try {
        const recentUsersRes = await userAPI.getRecent(5);
        console.log("Recent Users:", recentUsersRes);
        setRecentUsers(recentUsersRes.data || []);
      } catch (err) {
        console.warn("Failed to load recent users:", err);
        setRecentUsers([]);
      }

      // 9. Get top events by registrations - Sort by highest registrations
      const eventsWithRegistrations = [];

      // Collect all events with their registration counts
      for (const event of events) {
        try {
          const regStats = await registrationAPI.getStats(event._id);
          const regData = regStats.data || {};
          eventsWithRegistrations.push({
            event: event,
            registrations: regData.registered || 0,
          });
        } catch (err) {
          eventsWithRegistrations.push({
            event: event,
            registrations: 0,
          });
        }
      }

      // Sort by registrations (highest first) and take top 5
      const sortedEvents = eventsWithRegistrations
        .sort((a, b) => b.registrations - a.registrations)
        .slice(0, 5);

      // Build the chart data
      const topEventsData = sortedEvents.map((item) => ({
        name:
          item.event.name?.length > 20
            ? item.event.name.substring(0, 17) + "..."
            : item.event.name || "Unknown",
        registrations: item.registrations,
      }));

      setTopEvents(topEventsData);

      // 10. Process registration trend data
      const trendData = Array.from(registrationTrendMap.values()).sort(
        (a, b) => {
          const [monthA, yearA] = a.month.split(" ");
          const [monthB, yearB] = b.month.split(" ");
          if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
          const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          return months.indexOf(monthA) - months.indexOf(monthB);
        },
      );
      setRegistrationTrend(trendData);
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);
      setError(err.message);
    } finally {
      setLoading(false);
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

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto px-6 md:px-8 py-7 space-y-7">
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
                Error: {error}
              </div>
            </motion.div>
          )}

          {/* Greeting */}
          <motion.div {...fadeUp(0)}>
            <h1
              className="text-white text-2xl font-bold"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              Good {greeting}, Admin 👋
            </h1>
            <p
              className="text-xs mt-1"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              Here's your platform overview
            </p>
          </motion.div>

          {/* Stats Row 1 */}
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
                label="Total Events"
                value={stats.published + stats.live + stats.completed}
                accent={COLORS.primary}
              />
              <StatCard
                icon={Users}
                label="Total Users"
                value={stats.totalUsers}
                accent={COLORS.secondary}
              />
              <StatCard
                icon={LayoutGrid}
                label="Total Registrations"
                value={stats.totalRegistrations}
                accent={COLORS.success}
              />
              <StatCard
                icon={Activity}
                label="Live Events"
                value={stats.live}
                accent={COLORS.danger}
              />
            </motion.div>
          )}

          {/* Stats Row 2 */}
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
                icon={Clock}
                label="Pending Approvals"
                value={stats.pending}
                accent={COLORS.warning}
              />
              <StatCard
                icon={CheckCircle}
                label="Approved Events"
                value={stats.approved}
                accent={COLORS.success}
              />
              <StatCard
                icon={Users}
                label="Pending Registrations"
                value={stats.pendingRegistrations}
                accent={COLORS.info}
              />
              <StatCard
                icon={CheckCircle}
                label="Approved Regs"
                value={stats.approvedRegistrations}
                accent={COLORS.success}
              />
            </motion.div>
          )}

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Events - Changed to weekly view */}
            <motion.div {...fadeUp(0.1)}>
              <Card>
                <SectionHeader
                  title="Events Created This Week"
                  subtitle="Daily creation trend (last 7 days)"
                />
                {weeklyEvents.length > 0 ? (
                  <div
                    className="w-full h-80"
                    style={{ background: "#0c0c0f", borderRadius: "12px" }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={weeklyEvents}
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                        style={{ backgroundColor: "transparent" }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.06)"
                        />
                        <XAxis
                          dataKey="day"
                          tick={{
                            fill: "rgba(255,255,255,0.45)",
                            fontSize: 11,
                          }}
                        />
                        <YAxis
                          tick={{
                            fill: "rgba(255,255,255,0.45)",
                            fontSize: 11,
                          }}
                          domain={[0, "auto"]}
                          allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey="count"
                          fill={COLORS.primary}
                          name="Events Created"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-400">
                    No data available
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Event Status Pie - Now includes Pending */}
            <motion.div {...fadeUp(0.12)}>
              <Card>
                <SectionHeader
                  title="Event Status Distribution"
                  subtitle="Current breakdown"
                />
                {eventStatusData.length > 0 ? (
                  <div
                    className="w-full h-80"
                    style={{ background: "#0c0c0f", borderRadius: "12px" }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={eventStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={{ stroke: "rgba(255,255,255,0.3)" }}
                        >
                          {eventStatusData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke="rgba(0,0,0,0.2)"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-400">
                    No data available
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Events - Fixed X axis domain */}
            <motion.div {...fadeUp(0.14)}>
              <Card>
                <SectionHeader
                  title="Top Events"
                  subtitle="Most popular by registrations"
                  linkTo={"/admin/events"}
                />
                {topEvents.length > 0 ? (
                  <div
                    className="w-full h-80"
                    style={{ background: "#0c0c0f", borderRadius: "12px" }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topEvents}
                        layout="vertical"
                        margin={{ left: 0, right: 30, top: 20, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.06)"
                        />
                        <XAxis
                          type="number"
                          domain={[1, 10]}
                          tick={{
                            fill: "rgba(255,255,255,0.45)",
                            fontSize: 11,
                          }}
                          tickCount={10}
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{
                            fill: "rgba(255,255,255,0.45)",
                            fontSize: 11,
                          }}
                          width={120}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey="registrations"
                          fill={COLORS.secondary}
                          name="Registrations"
                          radius={[0, 8, 8, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-400">
                    No data available
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Registration Trend */}
            <motion.div {...fadeUp(0.16)}>
              <Card>
                <SectionHeader
                  title="Registration Trend"
                  subtitle="Last 6 months registration activity"
                />
                {registrationTrend.length > 0 ? (
                  <div
                    className="w-full h-80"
                    style={{ background: "#0c0c0f", borderRadius: "12px" }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={registrationTrend}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.06)"
                        />
                        <XAxis
                          dataKey="month"
                          tick={{
                            fill: "rgba(255,255,255,0.45)",
                            fontSize: 11,
                          }}
                        />
                        <YAxis
                          tick={{
                            fill: "rgba(255,255,255,0.45)",
                            fontSize: 11,
                          }}
                          allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke={COLORS.success}
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: COLORS.success }}
                          activeDot={{ r: 6 }}
                          name="Registrations"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-400">
                    No registration data available
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Events */}
            <motion.div {...fadeUp(0.18)}>
              <Card>
                <SectionHeader
                  title="Recent Events"
                  linkTo="/admin/events"
                  linkLabel="View all"
                />
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 rounded-xl" />
                    ))}
                  </div>
                ) : recentEvents.length > 0 ? (
                  <div className="space-y-2">
                    {recentEvents.map((event) => (
                      <RowItem
                        key={event._id}
                        to={`/admin/events/${event._id}`}
                        thumbnail={event.thumbnailUrl}
                        title={event.name}
                        sub={`Created ${new Date(event.createdAt).toLocaleDateString()}`}
                        badge={
                          <StatusBadge
                            status={event.status}
                            map={STATUS_EVENT}
                          />
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400">
                    No events found
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Recent Users */}
            <motion.div {...fadeUp(0.2)}>
              <Card>
                <SectionHeader
                  title="Recent Users"
                  linkTo="/admin/users"
                  linkLabel="View all"
                />
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 rounded-xl" />
                    ))}
                  </div>
                ) : recentUsers.length > 0 ? (
                  <div className="space-y-2">
                    {recentUsers.map((user) => (
                      <RowItem
                        key={user._id}
                        to={`/admin/users/${user._id}`}
                        thumbnail={user.profileImage}
                        title={user.name}
                        sub={user.email}
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
                            {user.role === "admin" ? "Admin" : "User"}
                          </span>
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400">
                    No users found
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
