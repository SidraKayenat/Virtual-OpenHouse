import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
// import STATUS_META from "@/components/registrations/STATUS_META";
import {
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  LayoutGrid,
  List,
  X,
  RotateCcw,
  Calendar,
  MapPin,
  Users,
  Hash,
  Eye,
  ExternalLink,
  Compass,
  ChevronRight,
} from "lucide-react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { registrationAPI } from "@/lib/api";

// ─── Re-exported components (put in separate files if needed) ─────────────
import RegistrationCard from "@/components/registrations/RegistrationCard";
import RegistrationRow from "@/components/registrations/RegistrationRow";
import RegistrationStatCard from "@/components/registrations/RegistrationStatCard";
import StatusBadge from "@/components/registrations/StatusBadge";

const STATUS_META = {
  pending: {
    label: "Pending",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    border: "rgba(251,191,36,0.25)",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
    border: "rgba(52,211,153,0.25)",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
    border: "rgba(248,113,113,0.25)",
    icon: AlertCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.1)",
    border: "rgba(148,163,184,0.2)",
    icon: XCircle,
  },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse"
      style={{
        background: "#141320",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="h-36" style={{ background: "rgba(255,255,255,0.06)" }} />
      <div className="p-4 flex flex-col gap-3">
        <div
          className="h-4 rounded w-2/3"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        <div
          className="h-3 rounded w-full"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
        <div
          className="h-3 rounded w-1/2"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
        <div
          className="h-8 rounded-xl mt-2"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-2xl animate-pulse"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.07)" }}
      />
      <div className="flex-1 flex flex-col gap-2">
        <div
          className="h-4 rounded w-2/3"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        <div
          className="h-3 rounded w-1/3"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
      </div>
    </div>
  );
}

const FILTER_TABS = ["all", "pending", "approved", "rejected", "cancelled"];

// ─── Main page ────────────────────────────────────────────────────────────
export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await registrationAPI.getMyRegistrations();
      setRegistrations(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────
  const stats = {
    total: registrations.length,
    pending: registrations.filter((r) => r.status === "pending").length,
    approved: registrations.filter((r) => r.status === "approved").length,
    rejected: registrations.filter((r) => r.status === "rejected").length,
    cancelled: registrations.filter((r) => r.status === "cancelled").length,
  };

  // ── Filter + search ────────────────────────────────────────────────
  const filtered = registrations.filter((r) => {
    const matchTab = filter === "all" || r.status === filter;
    const searchable = [
      r.event?.name,
      r.participantInfo?.projectTitle,
      r.participantInfo?.category,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchSearch = !search || searchable.includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const hasFilters = filter !== "all" || search;

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
        input::placeholder { color: rgba(255,255,255,0.22); }
      `}</style>

      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto px-6 md:px-8 py-7">
          {/* Error */}
          {error && (
            <div
              className="mb-5 p-4 rounded-xl text-sm"
              style={{
                background: "rgba(248,113,113,0.1)",
                border: "1px solid rgba(248,113,113,0.2)",
                color: "#fca5a5",
              }}
            >
              {error}
            </div>
          )}

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-center justify-between mb-7"
          >
            <div>
              <h1
                className="text-white text-2xl font-bold"
                style={{ fontFamily: "'Syne',sans-serif" }}
              >
                My Registrations
              </h1>
              <p
                className="text-[13px] mt-0.5"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Track and manage all events you've registered for
              </p>
            </div>
            <Link
              to="/browseevents"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-semibold text-white transition-all"
              style={{
                background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                border: "1px solid rgba(167,139,250,0.25)",
                boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 6px 28px rgba(124,58,237,0.45)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(124,58,237,0.3)")
              }
            >
              <Compass size={15} /> Browse Events
            </Link>
          </motion.div>

          {/* ══ STAT CARDS ══════════════════════════════════════════════ */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-7">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl animate-pulse"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.38 }}
              className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-7"
            >
              <RegistrationStatCard
                label="Total"
                value={stats.total}
                color="#a78bfa"
                icon={ClipboardList}
                onClick={() => setFilter("all")}
                active={filter === "all"}
              />
              <RegistrationStatCard
                label="Pending"
                value={stats.pending}
                color="#fbbf24"
                icon={Clock}
                onClick={() => setFilter("pending")}
                active={filter === "pending"}
              />
              <RegistrationStatCard
                label="Approved"
                value={stats.approved}
                color="#34d399"
                icon={CheckCircle}
                onClick={() => setFilter("approved")}
                active={filter === "approved"}
              />
              <RegistrationStatCard
                label="Rejected"
                value={stats.rejected}
                color="#f87171"
                icon={AlertCircle}
                onClick={() => setFilter("rejected")}
                active={filter === "rejected"}
              />
              <RegistrationStatCard
                label="Cancelled"
                value={stats.cancelled}
                color="#94a3b8"
                icon={XCircle}
                onClick={() => setFilter("cancelled")}
                active={filter === "cancelled"}
              />
            </motion.div>
          )}

          {/* ══ TOOLBAR ════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="rounded-2xl mb-6"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {/* Row 1: search + count + view toggle */}
            <div
              className="flex items-center justify-between gap-4 px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative flex-1 max-w-xs">
                  <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  />
                  <input
                    type="text"
                    placeholder="Search by event, project, category…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 rounded-xl text-[13px] outline-none"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.88)",
                    }}
                    onFocus={(e) =>
                      (e.target.style.border =
                        "1px solid rgba(167,139,250,0.45)")
                    }
                    onBlur={(e) =>
                      (e.target.style.border =
                        "1px solid rgba(255,255,255,0.08)")
                    }
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2"
                    >
                      <X
                        size={11}
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      />
                    </button>
                  )}
                </div>
                <span
                  className="text-[12px] flex-shrink-0"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </span>
              </div>
              {/* View toggle */}
              <div
                className="flex rounded-xl overflow-hidden p-0.5 flex-shrink-0"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {[
                  { id: "grid", Icon: LayoutGrid },
                  { id: "list", Icon: List },
                ].map(({ id, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setViewMode(id)}
                    className="p-2 rounded-lg transition-all duration-150"
                    style={
                      viewMode === id
                        ? {
                            background: "rgba(124,58,237,0.35)",
                            color: "#c4b5fd",
                          }
                        : { color: "rgba(255,255,255,0.3)" }
                    }
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: status filter tabs */}
            <div
              className="flex items-center gap-1 px-4 py-2.5 overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {FILTER_TABS.map((st) => {
                const count =
                  st === "all"
                    ? registrations.length
                    : registrations.filter((r) => r.status === st).length;
                const m = STATUS_META[st];
                return (
                  <button
                    key={st}
                    onClick={() => setFilter(st)}
                    className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-medium transition-all duration-150 flex-shrink-0 capitalize"
                    style={
                      filter === st
                        ? {
                            background: m
                              ? `${m.color}18`
                              : "rgba(167,139,250,0.18)",
                            color: m ? m.color : "#c4b5fd",
                            border: `1px solid ${m ? m.border : "rgba(167,139,250,0.3)"}`,
                          }
                        : {
                            color: "rgba(255,255,255,0.38)",
                            background: "transparent",
                            border: "1px solid transparent",
                          }
                    }
                  >
                    {st}
                    <span
                      className="text-[9.5px] font-bold px-1.5 py-px rounded-full min-w-[18px] text-center"
                      style={{
                        background:
                          filter === st
                            ? "rgba(255,255,255,0.12)"
                            : "rgba(255,255,255,0.07)",
                        color:
                          filter === st ? "white" : "rgba(255,255,255,0.3)",
                      }}
                    >
                      {count}
                    </span>
                    {filter === st && (
                      <motion.span
                        layoutId="regTab"
                        className="absolute bottom-0 left-3 right-3 h-px rounded-full"
                        style={{
                          background: m
                            ? `linear-gradient(90deg,${m.color},${m.color}88)`
                            : "linear-gradient(90deg,#7c3aed,#a78bfa)",
                        }}
                      />
                    )}
                  </button>
                );
              })}
              {hasFilters && (
                <button
                  onClick={() => {
                    setFilter("all");
                    setSearch("");
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11.5px] font-medium ml-auto flex-shrink-0 transition-all"
                  style={{
                    color: "#f87171",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.15)",
                  }}
                >
                  <RotateCcw size={11} /> Reset
                </button>
              )}
            </div>
          </motion.div>

          {/* ══ LIST ═══════════════════════════════════════════════════ */}
          {loading ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                  : "flex flex-col gap-3"
              }
            >
              {[...Array(6)].map((_, i) =>
                viewMode === "grid" ? (
                  <SkeletonCard key={i} />
                ) : (
                  <SkeletonRow key={i} />
                ),
              )}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-4"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <ClipboardList
                  size={22}
                  style={{ color: "rgba(255,255,255,0.14)" }}
                />
              </div>
              <p className="text-white font-semibold">
                {hasFilters ? "No registrations match" : "No registrations yet"}
              </p>
              <p
                className="text-[13px]"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {search
                  ? `No results for "${search}"`
                  : filter !== "all"
                    ? `No ${filter} registrations`
                    : "Register for an event to get started"}
              </p>
              {!hasFilters ? (
                <Link
                  to="/browseevents"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white mt-1"
                  style={{
                    background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                    border: "1px solid rgba(167,139,250,0.25)",
                  }}
                >
                  <Compass size={14} /> Browse Events
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setFilter("all");
                    setSearch("");
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium mt-1"
                  style={{
                    background: "rgba(124,58,237,0.15)",
                    color: "#c4b5fd",
                    border: "1px solid rgba(124,58,237,0.25)",
                  }}
                >
                  <RotateCcw size={13} /> Clear filters
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              layout
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                  : "flex flex-col gap-3"
              }
            >
              {filtered.map((reg, i) => (
                <motion.div
                  key={reg._id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: Math.min(i * 0.04, 0.25),
                    duration: 0.3,
                  }}
                >
                  {viewMode === "grid" ? (
                    <RegistrationCard registration={reg} />
                  ) : (
                    <RegistrationRow registration={reg} />
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
