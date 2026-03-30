import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  X,
  ChevronDown,
  Radio,
  Calendar,
  Zap,
  Tag,
  RotateCcw,
} from "lucide-react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import EventCard from "@/components/event/EventCard";
import { eventAPI } from "@/lib/api";

const EVENT_TYPES = [
  "conference",
  "exhibition",
  "fair",
  "workshop",
  "seminar",
  "other",
];
const SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "popular", label: "Most Popular" },
  { value: "soon", label: "Soonest" },
];
const TABS = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "live", label: "Live", icon: Radio },
  { id: "upcoming", label: "Upcoming", icon: Calendar },
];

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse"
      style={{ background: "#141320", aspectRatio: "3/4", minHeight: 280 }}
    >
      <div
        className="w-full h-full"
        style={{ background: "rgba(255,255,255,0.06)" }}
      />
    </div>
  );
}

export default function BrowseEvents() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("");
  const [tags, setTags] = useState("");
  const [sort, setSort] = useState("latest");
  const [tab, setTab] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  const observer = useRef();

  const fetchEvents = useCallback(
    async (reset = false) => {
      try {
        setLoading(true);
        const res = await eventAPI.getPublished({
          search,
          eventType,
          tags,
          sort,
          page: reset ? 1 : page,
          limit: 12,
        });
        const data = res.data || [];
        const tot = res.pagination?.total ?? data.length;
        if (reset) {
          setEvents(data);
          setPage(1);
        } else setEvents((prev) => [...prev, ...data]);
        setTotal(tot);
        setHasMore(data.length === 12);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    },
    [search, eventType, tags, sort, page],
  );

  useEffect(() => {
    const t = setTimeout(() => fetchEvents(true), 350);
    return () => clearTimeout(t);
  }, [search, eventType, tags, sort]);

  useEffect(() => {
    if (page !== 1) fetchEvents(false);
  }, [page]);

  const lastRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) setPage((p) => p + 1);
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  const displayed = events.filter((e) => {
    if (tab === "live") return e.status === "live";
    if (tab === "upcoming") return e.status === "published";
    return true;
  });

  const tabCount = {
    all: events.length,
    live: events.filter((e) => e.status === "live").length,
    upcoming: events.filter((e) => e.status === "published").length,
  };

  const clearAll = () => {
    setSearch("");
    setEventType("");
    setTags("");
    setSort("latest");
    setTab("all");
  };
  const hasFilters =
    search || eventType || tags || sort !== "latest" || tab !== "all";

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
        input::placeholder { color: rgba(255,255,255,0.25); }
      `}</style>

      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-0">
          {/* ══ TOOLBAR AREA ══════════════════════════════════════════════ */}
          <div
            className="rounded-2xl mb-6 overflow-visible"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {/* ── ROW 1: Search + result count left · view toggle right ── */}
            <div
              className="flex items-center justify-between gap-4 px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              {/* Left: heading + search */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="hidden sm:block flex-shrink-0">
                  <h1
                    className="text-white font-bold text-[16px] leading-none"
                    style={{ fontFamily: "'Syne',sans-serif" }}
                  >
                    Browse Events
                  </h1>
                  {!initialLoad && (
                    <p
                      className="text-[11px] mt-0.5"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      {total.toLocaleString()} event{total !== 1 ? "s" : ""}
                      {hasFilters ? " found" : " available"}
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div
                  className="hidden sm:block w-px h-8 flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                />

                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "rgba(255,255,255,0.28)" }}
                  />
                  <input
                    type="text"
                    placeholder="Search events…"
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
              </div>

              {/* Right: view toggle */}
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

            {/* ── ROW 2: Tabs left · filters right ── */}
            <div className="flex items-center justify-between gap-4 px-4 py-2.5 flex-wrap gap-y-2">
              {/* LEFT: Status tabs */}
              <div className="flex items-center gap-1">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12.5px] font-medium transition-all duration-150"
                    style={
                      tab === id
                        ? {
                            background: "rgba(124,58,237,0.22)",
                            color: "#c4b5fd",
                            border: "1px solid rgba(124,58,237,0.3)",
                          }
                        : {
                            color: "rgba(255,255,255,0.42)",
                            background: "transparent",
                            border: "1px solid transparent",
                          }
                    }
                  >
                    <Icon size={12} />
                    {label}
                    {/* Count pill */}
                    <span
                      className="text-[9.5px] font-bold px-1.5 py-px rounded-full min-w-[18px] text-center leading-none"
                      style={{
                        background:
                          tab === id
                            ? "rgba(167,139,250,0.25)"
                            : "rgba(255,255,255,0.07)",
                        color: tab === id ? "#c4b5fd" : "rgba(255,255,255,0.3)",
                      }}
                    >
                      {tabCount[id]}
                    </span>
                    {/* Active underline */}
                    {tab === id && (
                      <motion.span
                        layoutId="tabUnderline"
                        className="absolute bottom-0 left-3 right-3 h-px rounded-full"
                        style={{
                          background: "linear-gradient(90deg,#7c3aed,#a78bfa)",
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* RIGHT: Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Event Type dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setTypeOpen(!typeOpen);
                      setSortOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all"
                    style={{
                      background: eventType
                        ? "rgba(124,58,237,0.18)"
                        : "rgba(255,255,255,0.04)",
                      border: eventType
                        ? "1px solid rgba(124,58,237,0.3)"
                        : "1px solid rgba(255,255,255,0.08)",
                      color: eventType ? "#c4b5fd" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    <SlidersHorizontal size={12} />
                    {eventType ? (
                      <span className="capitalize">{eventType}</span>
                    ) : (
                      "Event Type"
                    )}
                    <ChevronDown
                      size={11}
                      className={`transition-transform duration-200 ${typeOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {typeOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setTypeOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          transition={{ duration: 0.14 }}
                          className="absolute right-0 top-full mt-1.5 w-44 rounded-xl overflow-hidden z-40"
                          style={{
                            background: "#1a1728",
                            border: "1px solid rgba(255,255,255,0.1)",
                            boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                          }}
                        >
                          <button
                            onClick={() => {
                              setEventType("");
                              setTypeOpen(false);
                            }}
                            className="flex items-center justify-between w-full px-4 py-2.5 text-[12px]"
                            style={{
                              color: !eventType
                                ? "#c4b5fd"
                                : "rgba(255,255,255,0.55)",
                              background: !eventType
                                ? "rgba(124,58,237,0.12)"
                                : "transparent",
                            }}
                            onMouseEnter={(e) => {
                              if (eventType)
                                e.currentTarget.style.background =
                                  "rgba(255,255,255,0.05)";
                            }}
                            onMouseLeave={(e) => {
                              if (eventType)
                                e.currentTarget.style.background =
                                  "transparent";
                            }}
                          >
                            All Types
                            {!eventType && (
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                            )}
                          </button>
                          {EVENT_TYPES.map((t) => (
                            <button
                              key={t}
                              onClick={() => {
                                setEventType(t);
                                setTypeOpen(false);
                              }}
                              className="flex items-center justify-between w-full px-4 py-2.5 text-[12px] capitalize"
                              style={{
                                color:
                                  eventType === t
                                    ? "#c4b5fd"
                                    : "rgba(255,255,255,0.55)",
                                background:
                                  eventType === t
                                    ? "rgba(124,58,237,0.12)"
                                    : "transparent",
                              }}
                              onMouseEnter={(e) => {
                                if (eventType !== t)
                                  e.currentTarget.style.background =
                                    "rgba(255,255,255,0.05)";
                              }}
                              onMouseLeave={(e) => {
                                if (eventType !== t)
                                  e.currentTarget.style.background =
                                    "transparent";
                              }}
                            >
                              {t}
                              {eventType === t && (
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Tags input */}
                <div className="relative">
                  <Tag
                    size={11}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  />
                  <input
                    type="text"
                    placeholder="Tags…"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="pl-7 pr-2.5 py-1.5 rounded-xl text-[12px] outline-none w-28"
                    style={{
                      background: tags
                        ? "rgba(124,58,237,0.12)"
                        : "rgba(255,255,255,0.04)",
                      border: tags
                        ? "1px solid rgba(124,58,237,0.28)"
                        : "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.8)",
                    }}
                    onFocus={(e) =>
                      (e.target.style.border =
                        "1px solid rgba(167,139,250,0.4)")
                    }
                    onBlur={(e) =>
                      (e.target.style.border = tags
                        ? "1px solid rgba(124,58,237,0.28)"
                        : "1px solid rgba(255,255,255,0.08)")
                    }
                  />
                  {tags && (
                    <button
                      onClick={() => setTags("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                    >
                      <X
                        size={10}
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      />
                    </button>
                  )}
                </div>

                {/* Sort dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setSortOpen(!sortOpen);
                      setTypeOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all"
                    style={{
                      background:
                        sort !== "latest"
                          ? "rgba(124,58,237,0.18)"
                          : "rgba(255,255,255,0.04)",
                      border:
                        sort !== "latest"
                          ? "1px solid rgba(124,58,237,0.3)"
                          : "1px solid rgba(255,255,255,0.08)",
                      color:
                        sort !== "latest" ? "#c4b5fd" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    Sort: {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                    <ChevronDown
                      size={11}
                      className={`transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {sortOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setSortOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          transition={{ duration: 0.14 }}
                          className="absolute right-0 top-full mt-1.5 w-40 rounded-xl overflow-hidden z-40"
                          style={{
                            background: "#1a1728",
                            border: "1px solid rgba(255,255,255,0.1)",
                            boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                          }}
                        >
                          {SORT_OPTIONS.map((o) => (
                            <button
                              key={o.value}
                              onClick={() => {
                                setSort(o.value);
                                setSortOpen(false);
                              }}
                              className="flex items-center justify-between w-full px-4 py-2.5 text-[12px]"
                              style={{
                                color:
                                  sort === o.value
                                    ? "#c4b5fd"
                                    : "rgba(255,255,255,0.55)",
                                background:
                                  sort === o.value
                                    ? "rgba(124,58,237,0.12)"
                                    : "transparent",
                              }}
                              onMouseEnter={(e) => {
                                if (sort !== o.value)
                                  e.currentTarget.style.background =
                                    "rgba(255,255,255,0.05)";
                              }}
                              onMouseLeave={(e) => {
                                if (sort !== o.value)
                                  e.currentTarget.style.background =
                                    "transparent";
                              }}
                            >
                              {o.label}
                              {sort === o.value && (
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Clear all */}
                {hasFilters && (
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[12px] font-medium transition-all"
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
            </div>
          </div>

          {/* ── Active filter chips ── */}
          <AnimatePresence>
            {hasFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 mb-5 overflow-hidden"
              >
                {tab !== "all" && (
                  <Chip
                    label={TABS.find((t) => t.id === tab)?.label}
                    onRemove={() => setTab("all")}
                  />
                )}
                {eventType && (
                  <Chip label={eventType} onRemove={() => setEventType("")} />
                )}
                {tags && (
                  <Chip label={`#${tags}`} onRemove={() => setTags("")} />
                )}
                {sort !== "latest" && (
                  <Chip
                    label={SORT_OPTIONS.find((o) => o.value === sort)?.label}
                    onRemove={() => setSort("latest")}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Error ── */}
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

          {/* ── Grid / list ── */}
          {initialLoad ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5"
                  : "flex flex-col gap-3"
              }
            >
              {[...Array(8)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-28 gap-4"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Zap size={22} style={{ color: "rgba(255,255,255,0.14)" }} />
              </div>
              <p className="text-white font-semibold">No events found</p>
              <p
                className="text-[13px]"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {search
                  ? `No results for "${search}"`
                  : "Try adjusting your filters"}
              </p>
              <button
                onClick={clearAll}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium mt-1"
                style={{
                  background: "rgba(124,58,237,0.15)",
                  color: "#c4b5fd",
                  border: "1px solid rgba(124,58,237,0.25)",
                }}
              >
                <RotateCcw size={13} /> Clear filters
              </button>
            </motion.div>
          ) : (
            <motion.div
              layout
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5"
                  : "flex flex-col gap-3"
              }
            >
              {displayed.map((event, i) => {
                const isLast = i === displayed.length - 1;
                return (
                  <motion.div
                    key={event._id}
                    ref={isLast ? lastRef : null}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: Math.min(i * 0.04, 0.28),
                      duration: 0.3,
                    }}
                    layout
                  >
                    <EventCard event={event} viewMode={viewMode} />
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Loading more */}
          {loading && !initialLoad && (
            <div className="flex justify-center mt-8">
              <div
                className="flex items-center gap-3 text-[12.5px]"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                <div className="w-4 h-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                Loading more events…
              </div>
            </div>
          )}

          {/* End of results */}
          {!hasMore && !loading && displayed.length > 0 && (
            <p
              className="text-center mt-10 text-[12px]"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              — All {total} events loaded —
            </p>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Filter chip ──────────────────────────────────────────────────────────
function Chip({ label, onRemove }) {
  return (
    <span
      className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full capitalize"
      style={{
        background: "rgba(124,58,237,0.14)",
        color: "#c4b5fd",
        border: "1px solid rgba(124,58,237,0.22)",
      }}
    >
      {label}
      <button onClick={onRemove} className="hover:text-white transition-colors">
        <X size={10} />
      </button>
    </span>
  );
}
