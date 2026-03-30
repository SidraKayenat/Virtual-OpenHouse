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
import EventCard from "@/components/event/EventCard";
import { eventAPI } from "@/lib/api";

// ─── Constants ────────────────────────────────────────────────────────────
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
  { id: "all", label: "All Events", icon: LayoutGrid },
  { id: "live", label: "Live Now", icon: Radio },
  { id: "upcoming", label: "Upcoming", icon: Calendar },
];

// ─── Filter sidebar item ──────────────────────────────────────────────────
function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="py-4"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-3 group"
      >
        <span
          className="text-[11px] font-bold uppercase tracking-[0.1em]"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          {title}
        </span>
        <ChevronDown
          size={13}
          className="transition-transform duration-200"
          style={{
            color: "rgba(255,255,255,0.25)",
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
          }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="rounded-xl overflow-hidden animate-pulse"
      style={{
        background: "#141320",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="h-44" style={{ background: "rgba(255,255,255,0.06)" }} />
      <div className="p-4 flex flex-col gap-3">
        <div
          className="h-4 rounded w-3/4"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        <div
          className="h-3 rounded w-full"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
        <div
          className="h-3 rounded w-2/3"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
        <div
          className="h-8 rounded-lg mt-2"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function PublicBrowseEvents() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("");
  const [tags, setTags] = useState("");
  const [sort, setSort] = useState("latest");
  const [tab, setTab] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState(null);
  const [sortOpen, setSortOpen] = useState(false);

  const observer = useRef();

  // ── Fetch ──────────────────────────────────────────────────────────
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
        } else {
          setEvents((prev) => [...prev, ...data]);
        }
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

  // ── Debounced filter change ────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => fetchEvents(true), 350);
    return () => clearTimeout(t);
  }, [search, eventType, tags, sort]);

  // ── Paginate ──────────────────────────────────────────────────────
  useEffect(() => {
    if (page === 1) return;
    fetchEvents(false);
  }, [page]);

  // ── Infinite scroll sentinel ───────────────────────────────────────
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

  // ── Filter by tab ──────────────────────────────────────────────────
  const displayed = events.filter((e) => {
    if (tab === "live") return e.status === "live";
    if (tab === "upcoming") return e.status === "published";
    return true;
  });

  const liveCount = events.filter((e) => e.status === "live").length;
  const upcomingCount = events.filter((e) => e.status === "published").length;

  const tabCount = {
    all: events.length,
    live: liveCount,
    upcoming: upcomingCount,
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
      `}</style>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          {/* ══ LEFT FILTER PANEL ═══════════════════════════════════════ */}
          <aside
            className="w-56 flex-shrink-0 overflow-y-auto px-5 py-6"
            style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
          >
            {/* Status tabs as filter */}
            <FilterSection title="Status" defaultOpen={true}>
              <div className="flex flex-col gap-1">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-[12.5px] transition-all duration-150"
                    style={
                      tab === id
                        ? {
                            background: "rgba(124,58,237,0.18)",
                            color: "#c4b5fd",
                            border: "1px solid rgba(124,58,237,0.25)",
                          }
                        : {
                            color: "rgba(255,255,255,0.45)",
                            background: "transparent",
                            border: "1px solid transparent",
                          }
                    }
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={13} />
                      {label}
                    </span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      {tabCount[id]}
                    </span>
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* Event type */}
            <FilterSection title="Event Type" defaultOpen={true}>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setEventType("")}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-[12.5px] transition-all duration-150"
                  style={
                    eventType === ""
                      ? {
                          background: "rgba(124,58,237,0.18)",
                          color: "#c4b5fd",
                          border: "1px solid rgba(124,58,237,0.25)",
                        }
                      : {
                          color: "rgba(255,255,255,0.45)",
                          background: "transparent",
                          border: "1px solid transparent",
                        }
                  }
                >
                  All Types
                </button>
                {EVENT_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setEventType(eventType === t ? "" : t)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-[12.5px] capitalize transition-all duration-150"
                    style={
                      eventType === t
                        ? {
                            background: "rgba(124,58,237,0.18)",
                            color: "#c4b5fd",
                            border: "1px solid rgba(124,58,237,0.25)",
                          }
                        : {
                            color: "rgba(255,255,255,0.45)",
                            background: "transparent",
                            border: "1px solid transparent",
                          }
                    }
                  >
                    {t}
                    {eventType === t && <X size={11} />}
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* Tags */}
            <FilterSection title="Tags" defaultOpen={false}>
              <div className="relative">
                <Tag
                  size={12}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                />
                <input
                  type="text"
                  placeholder="e.g. tech, ai"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg text-[12px] outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.8)",
                  }}
                  onFocus={(e) =>
                    (e.target.style.border = "1px solid rgba(167,139,250,0.4)")
                  }
                  onBlur={(e) =>
                    (e.target.style.border = "1px solid rgba(255,255,255,0.08)")
                  }
                />
              </div>
            </FilterSection>

            {/* Clear */}
            {hasFilters && (
              <button
                onClick={clearAll}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[12px] font-medium mt-2 transition-all"
                style={{
                  color: "#f87171",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.15)",
                }}
              >
                <RotateCcw size={12} />
                Clear all filters
              </button>
            )}
          </aside>

          {/* ══ MAIN CONTENT ════════════════════════════════════════════ */}
          <main className="flex-1 overflow-y-auto px-6 py-6">
            {/* ── Top bar ── */}
            <div className="flex items-center justify-between mb-6 gap-4">
              {/* Result count */}
              <div>
                <h1
                  className="text-white font-bold text-xl"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  {initialLoad
                    ? "Browse Events"
                    : `${total.toLocaleString()} event${total !== 1 ? "s" : ""}`}
                </h1>
                {hasFilters && (
                  <p
                    className="text-[11.5px] mt-0.5"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    Filtered results
                  </p>
                )}
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "rgba(255,255,255,0.28)" }}
                  />
                  <input
                    type="text"
                    placeholder="Search events…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-9 py-2 rounded-xl text-[13px] outline-none w-56 transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.85)",
                    }}
                    onFocus={(e) =>
                      (e.target.style.border =
                        "1px solid rgba(167,139,250,0.4)")
                    }
                    onBlur={(e) =>
                      (e.target.style.border =
                        "1px solid rgba(255,255,255,0.08)")
                    }
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X
                        size={11}
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      />
                    </button>
                  )}
                </div>

                {/* Sort dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setSortOpen(!sortOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12.5px] font-medium transition-all"
                    style={{
                      background: sortOpen
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    <SlidersHorizontal size={13} />
                    Sort: {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                    <ChevronDown
                      size={12}
                      className={`transition-transform ${sortOpen ? "rotate-180" : ""}`}
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
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-44 rounded-xl overflow-hidden z-40"
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
                              className="flex items-center justify-between w-full px-4 py-2.5 text-[12.5px] transition-colors"
                              style={{
                                color:
                                  sort === o.value
                                    ? "#c4b5fd"
                                    : "rgba(255,255,255,0.55)",
                                background:
                                  sort === o.value
                                    ? "rgba(124,58,237,0.15)"
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

                {/* View toggle */}
                <div
                  className="flex rounded-xl overflow-hidden p-0.5"
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
                      className="p-1.5 rounded-lg transition-all"
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
            </div>

            {/* ── Active filter chips ── */}
            {hasFilters && (
              <div className="flex flex-wrap gap-2 mb-5">
                {tab !== "all" && (
                  <span
                    className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
                    style={{
                      background: "rgba(124,58,237,0.14)",
                      color: "#c4b5fd",
                      border: "1px solid rgba(124,58,237,0.2)",
                    }}
                  >
                    {tab}
                    <button onClick={() => setTab("all")}>
                      <X size={10} />
                    </button>
                  </span>
                )}
                {eventType && (
                  <span
                    className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full capitalize"
                    style={{
                      background: "rgba(124,58,237,0.14)",
                      color: "#c4b5fd",
                      border: "1px solid rgba(124,58,237,0.2)",
                    }}
                  >
                    {eventType}
                    <button onClick={() => setEventType("")}>
                      <X size={10} />
                    </button>
                  </span>
                )}
                {tags && (
                  <span
                    className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
                    style={{
                      background: "rgba(124,58,237,0.14)",
                      color: "#c4b5fd",
                      border: "1px solid rgba(124,58,237,0.2)",
                    }}
                  >
                    #{tags}
                    <button onClick={() => setTags("")}>
                      <X size={10} />
                    </button>
                  </span>
                )}
                {sort !== "latest" && (
                  <span
                    className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
                    style={{
                      background: "rgba(124,58,237,0.14)",
                      color: "#c4b5fd",
                      border: "1px solid rgba(124,58,237,0.2)",
                    }}
                  >
                    {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                    <button onClick={() => setSort("latest")}>
                      <X size={10} />
                    </button>
                  </span>
                )}
              </div>
            )}

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

            {/* ── Events grid / list ── */}
            {initialLoad ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 xl:grid-cols-3 gap-5"
                    : "flex flex-col gap-3"
                }
              >
                {[...Array(9)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : displayed.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-24 gap-4"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Zap size={24} style={{ color: "rgba(255,255,255,0.15)" }} />
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
                    ? "grid grid-cols-2 xl:grid-cols-3 gap-5"
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
                        delay: Math.min(i * 0.04, 0.3),
                        duration: 0.32,
                      }}
                      layout
                    >
                      <EventCard event={event} viewMode={viewMode} />
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* ── Loading more ── */}
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

            {/* ── End of results ── */}
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
    </div>
  );
}
