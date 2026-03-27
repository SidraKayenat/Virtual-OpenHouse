import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Building,
  Eye,
  Heart,
  Radio,
  EyeOff,
  Search,
  LayoutGrid,
  List,
  X,
  RotateCcw,
  TrendingUp,
  PlusCircle,
  AlertCircle,
  Zap,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { stallAPI } from "@/lib/api";
import { StallCard } from "@/components/stalls/StallCard";

// ─── Stat card ────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon: Icon, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2 p-4 rounded-2xl text-left transition-all duration-200 w-full"
      style={{
        background: active ? `${color}15` : "rgba(255,255,255,0.03)",
        border: active
          ? `1px solid ${color}40`
          : "1px solid rgba(255,255,255,0.07)",
        boxShadow: active ? `0 0 20px ${color}12` : "none",
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon size={15} style={{ color }} strokeWidth={2} />
        </div>
        {active && (
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: color }}
          />
        )}
      </div>
      <div>
        <p
          className="text-[26px] font-bold leading-none text-white"
          style={{ fontFamily: "'Syne',sans-serif" }}
        >
          {value ?? "—"}
        </p>
        <p
          className="text-[11.5px] mt-1"
          style={{ color: "rgba(255,255,255,0.38)" }}
        >
          {label}
        </p>
      </div>
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────
function SkeletonCard({ viewMode }) {
  if (viewMode === "list") {
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
          className="h-8 rounded-xl mt-1"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
      </div>
    </div>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────
function DeleteModal({ stallName, onConfirm, onCancel, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
        style={{
          background: "#1a1728",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            <ShieldAlert size={18} style={{ color: "#f87171" }} />
          </div>
          <div>
            <h3
              className="text-white font-bold text-[15px]"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              Delete Stall?
            </h3>
            <p
              className="text-[12px]"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              This cannot be undone
            </p>
          </div>
        </div>
        <p
          className="text-[12.5px]"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          You're about to permanently delete{" "}
          <strong style={{ color: "white" }}>{stallName}</strong> and all its
          media files.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
            style={{
              color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white"
            style={{
              background: "rgba(239,68,68,0.3)",
              border: "1px solid rgba(239,68,68,0.4)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : null}
            {loading ? "Deleting…" : "Delete Stall"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────
const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Draft" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
];

export default function MyStalls() {
  const [stalls, setStalls] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [deleteModal, setDeleteModal] = useState(null); // { stallId, stallName }
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(null); // stallId

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [stallRes, statsRes] = await Promise.all([
        stallAPI.getMyStalls(),
        stallAPI.getStats?.() ?? Promise.resolve({ data: null }),
      ]);
      setStalls(stallRes.data || []);
      setStats(statsRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  // ── Derived stats from stall list (fallback if getStats fails) ──────────
  const derived = {
    total: stalls.length,
    published: stalls.filter((s) => s.isPublished).length,
    draft: stalls.filter((s) => !s.isPublished).length,
    active: stalls.filter((s) => s.isActive).length,
    totalViews: stalls.reduce((acc, s) => acc + (s.viewCount || 0), 0),
    totalLikes: stalls.reduce((acc, s) => acc + (s.likeCount || 0), 0),
  };

  const displayStats = stats || derived;

  // ── Filter ──────────────────────────────────────────────────────────────
  const filtered = stalls.filter((s) => {
    const matchFilter =
      filter === "all"
        ? true
        : filter === "published"
          ? s.isPublished
          : filter === "draft"
            ? !s.isPublished
            : filter === "active"
              ? s.isActive
              : filter === "inactive"
                ? !s.isActive
                : true;

    const matchSearch =
      !search ||
      [s.projectTitle, s.projectDescription, s.event?.name, s.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

    return matchFilter && matchSearch;
  });

  const tabCounts = {
    all: stalls.length,
    published: stalls.filter((s) => s.isPublished).length,
    draft: stalls.filter((s) => !s.isPublished).length,
    active: stalls.filter((s) => s.isActive).length,
    inactive: stalls.filter((s) => !s.isActive).length,
  };

  const hasFilters = filter !== "all" || search;

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleToggleActive = async (stallId) => {
    try {
      setToggling(stallId);
      await stallAPI.toggleActive(stallId);
      setStalls((prev) =>
        prev.map((s) =>
          s._id === stallId ? { ...s, isActive: !s.isActive } : s,
        ),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setToggling(null);
    }
  };

  const confirmDelete = (stallId, stallName) =>
    setDeleteModal({ stallId, stallName });

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      setDeleting(true);
      await stallAPI.delete(deleteModal.stallId);
      setStalls((prev) => prev.filter((s) => s._id !== deleteModal.stallId));
      setDeleteModal(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

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
        input::placeholder { color: rgba(255,255,255,0.22); }
      `}</style>

      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto px-6 md:px-8 py-7">
          {/* Error */}
          {error && (
            <div
              className="mb-5 p-4 rounded-xl text-sm flex items-center justify-between gap-3"
              style={{
                background: "rgba(248,113,113,0.1)",
                border: "1px solid rgba(248,113,113,0.2)",
                color: "#fca5a5",
              }}
            >
              <span>
                <AlertCircle size={13} className="inline mr-1.5" />
                {error}
              </span>
              <button onClick={() => setError(null)}>
                <X size={13} />
              </button>
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
                My Stalls
              </h1>
              <p
                className="text-[13px] mt-0.5"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Manage and publish your event stalls
              </p>
            </div>
            <Link
              to="/user/registrations"
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
              <PlusCircle size={15} /> New Stall
            </Link>
          </motion.div>

          {/* ══ STAT CARDS ══════════════════════════════════════════════ */}
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-7">
              {[...Array(6)].map((_, i) => (
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
              className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-7"
            >
              <StatCard
                label="Total Stalls"
                value={displayStats.totalStalls ?? derived.total}
                color="#a78bfa"
                icon={Building}
                onClick={() => setFilter("all")}
                active={filter === "all"}
              />
              <StatCard
                label="Published"
                value={displayStats.publishedStalls ?? derived.published}
                color="#34d399"
                icon={Radio}
                onClick={() => setFilter("published")}
                active={filter === "published"}
              />
              <StatCard
                label="Drafts"
                value={displayStats.unpublishedStalls ?? derived.draft}
                color="#fbbf24"
                icon={EyeOff}
                onClick={() => setFilter("draft")}
                active={filter === "draft"}
              />
              <StatCard
                label="Active"
                value={derived.active}
                color="#60a5fa"
                icon={Zap}
                onClick={() => setFilter("active")}
                active={filter === "active"}
              />
              <StatCard
                label="Total Views"
                value={displayStats.totalViews ?? derived.totalViews}
                color="#fb923c"
                icon={Eye}
                onClick={() => {}}
                active={false}
              />
              <StatCard
                label="Total Likes"
                value={displayStats.totalLikes ?? derived.totalLikes}
                color="#f472b6"
                icon={Heart}
                onClick={() => {}}
                active={false}
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
            {/* Row 1: search + view toggle */}
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
                    placeholder="Search by title, event, category…"
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
                  {filtered.length} stall{filtered.length !== 1 ? "s" : ""}
                </span>
              </div>
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

            {/* Row 2: filter tabs */}
            <div
              className="flex items-center gap-1 px-4 py-2.5 overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {FILTER_TABS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-medium transition-all duration-150 flex-shrink-0"
                  style={
                    filter === id
                      ? {
                          background: "rgba(167,139,250,0.18)",
                          color: "#c4b5fd",
                          border: "1px solid rgba(167,139,250,0.3)",
                        }
                      : {
                          color: "rgba(255,255,255,0.38)",
                          background: "transparent",
                          border: "1px solid transparent",
                        }
                  }
                >
                  {label}
                  <span
                    className="text-[9.5px] font-bold px-1.5 py-px rounded-full min-w-[18px] text-center"
                    style={{
                      background:
                        filter === id
                          ? "rgba(255,255,255,0.12)"
                          : "rgba(255,255,255,0.07)",
                      color: filter === id ? "white" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {tabCounts[id]}
                  </span>
                  {filter === id && (
                    <motion.span
                      layoutId="stallTab"
                      className="absolute bottom-0 left-3 right-3 h-px rounded-full"
                      style={{
                        background: "linear-gradient(90deg,#7c3aed,#a78bfa)",
                      }}
                    />
                  )}
                </button>
              ))}
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

          {/* ══ STALLS ══════════════════════════════════════════════════ */}
          {loading ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                  : "flex flex-col gap-3"
              }
            >
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} viewMode={viewMode} />
              ))}
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
                <Building
                  size={22}
                  style={{ color: "rgba(255,255,255,0.14)" }}
                />
              </div>
              <p className="text-white font-semibold">
                {hasFilters ? "No stalls match" : "No stalls yet"}
              </p>
              <p
                className="text-[13px]"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {search
                  ? `No results for "${search}"`
                  : filter !== "all"
                    ? `No ${filter} stalls`
                    : "Get approved for an event to create your first stall"}
              </p>
              {!hasFilters ? (
                <Link
                  to="/user/registrations"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white mt-1"
                  style={{
                    background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                    border: "1px solid rgba(167,139,250,0.25)",
                  }}
                >
                  <ChevronRight size={14} /> View Registrations
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
              {filtered.map((stall, i) => (
                <motion.div
                  key={stall._id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: Math.min(i * 0.04, 0.25),
                    duration: 0.3,
                  }}
                >
                  <StallCard
                    stall={stall}
                    viewMode={viewMode}
                    onToggleActive={handleToggleActive}
                    onDelete={(id) => confirmDelete(id, stall.projectTitle)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </main>
      </div>

      {/* Delete modal */}
      <AnimatePresence>
        {deleteModal && (
          <DeleteModal
            stallName={deleteModal.stallName}
            onConfirm={handleDelete}
            onCancel={() => setDeleteModal(null)}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
