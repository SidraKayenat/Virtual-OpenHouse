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
  Plus,
  MoreVertical,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  FileText,
  Archive,
  CheckCircle,
  XCircle,
  Send,
} from "lucide-react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { eventAPI } from "@/lib/api";
import { toast } from "sonner";

const EVENT_TYPES = [
  { value: "", label: "All Types" },
  { value: "conference", label: "Conference" },
  { value: "exhibition", label: "Exhibition" },
  { value: "fair", label: "Fair" },
  { value: "workshop", label: "Workshop" },
  { value: "seminar", label: "Seminar" },
  { value: "other", label: "Other" },
];

const SORT_OPTIONS = [
  { value: "-createdAt", label: "Latest Created" },
  { value: "createdAt", label: "Oldest Created" },
  { value: "-liveDate", label: "Starting Soon" },
  { value: "liveDate", label: "Starting Later" },
  { value: "-updatedAt", label: "Recently Edited" },
];

// Map frontend tabs to backend status filters
const TAB_FILTERS = {
  all: null, // No status filter - get all events
  published: "published",
  pending: "pending",
  draft: "approved", // "draft" in frontend = "approved" in backend (ready to publish)
  archived: "completed",
};

// Additional statuses for admin view
const STATUS_BADGES = {
  pending: {
    label: "Pending",
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  approved: {
    label: "Approved",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  published: {
    label: "Published",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  live: {
    label: "Live",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  completed: {
    label: "Completed",
    color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

export default function AdminBrowseEvents() {
  const [events, setEvents] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [tab, setTab] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [sortOpen, setSortOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const observer = useRef();
  const sortRef = useRef();
  const typeRef = useRef();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setSortOpen(false);
      }
      if (typeRef.current && !typeRef.current.contains(event.target)) {
        setTypeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchEvents = async (resetPage = true) => {
    try {
      setLoading(true);
      if (resetPage) setPage(1);

      const params = {
        page: resetPage ? 1 : page,
        limit: 12,
        search: search || undefined,
      };

      // Add status filter based on tab
      const statusFilter = TAB_FILTERS[tab];
      if (statusFilter) {
        params.status = statusFilter;
      }

      // Add event type filter
      if (eventType) {
        params.eventType = eventType;
      }

      // Add sort
      if (sort) {
        params.sort = sort;
      }

      const response = await eventAPI.getAll(params);

      if (response.success) {
        if (resetPage) {
          setEvents(response.data);
        } else {
          setEvents((prev) => [...prev, ...response.data]);
        }
        setTotal(response.pagination?.total || 0);
        setTotalPages(response.pagination?.pages || 0);
        setError(null);
      } else {
        throw new Error(response.message || "Failed to fetch events");
      }
    } catch (err) {
      console.error("Failed to load events", err);
      setError(err.message);
      toast.error(err.message || "Failed to load events");
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, eventType, sort, tab]);

  // Handle pagination
  useEffect(() => {
    if (page > 1) {
      fetchEvents(false);
    }
  }, [page]);

  const handleApprove = async (eventId) => {
    setActionLoading(eventId);
    try {
      const response = await eventAPI.approve(eventId);
      if (response.success) {
        toast.success("Event approved successfully");
        fetchEvents(true);
      } else {
        throw new Error(response.message || "Failed to approve event");
      }
    } catch (err) {
      toast.error(err.message || "Failed to approve event");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (eventId) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason || reason.trim() === "") {
      toast.error("Rejection reason is required");
      return;
    }

    setActionLoading(eventId);
    try {
      const response = await eventAPI.reject(eventId, reason);
      if (response.success) {
        toast.success("Event rejected successfully");
        fetchEvents(true);
      } else {
        throw new Error(response.message || "Failed to reject event");
      }
    } catch (err) {
      toast.error(err.message || "Failed to reject event");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublish = async (eventId) => {
    setActionLoading(eventId);
    try {
      const response = await eventAPI.publish(eventId);
      if (response.success) {
        toast.success("Event published successfully");
        fetchEvents(true);
      } else {
        throw new Error(response.message || "Failed to publish event");
      }
    } catch (err) {
      toast.error(err.message || "Failed to publish event");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (eventId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this event? This action cannot be undone.",
      )
    )
      return;

    setActionLoading(eventId);
    try {
      const response = await eventAPI.delete(eventId);
      if (response.success) {
        toast.success("Event deleted successfully");
        fetchEvents(true);
      } else {
        throw new Error(response.message || "Failed to delete event");
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete event");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Delete ${selectedEvents.length} events? This action cannot be undone.`,
      )
    )
      return;

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const eventId of selectedEvents) {
      try {
        await eventAPI.delete(eventId);
        successCount++;
      } catch (err) {
        failCount++;
        console.error(`Failed to delete event ${eventId}:`, err);
      }
    }

    if (successCount > 0) {
      toast.success(`Deleted ${successCount} events successfully`);
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} events`);
    }

    fetchEvents(true);
    setSelectedEvents([]);
    setLoading(false);
  };

  const lastElementRef = useCallback(
    (node) => {
      if (loading || initialLoad) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && page < totalPages) {
          setPage((p) => p + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, initialLoad, page, totalPages],
  );

  const getStatusBadge = (status) => {
    const badge = STATUS_BADGES[status] || STATUS_BADGES.pending;
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.color}`}
      >
        {badge.label}
      </span>
    );
  };

  // Render admin action buttons based on event status
  const renderAdminActions = (event) => {
    const isLoading = actionLoading === event._id;

    return (
      <div className="flex items-center gap-1">
        {event.status === "pending" && (
          <>
            <button
              onClick={() => handleApprove(event._id)}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-50"
              title="Approve Event"
            >
              <CheckCircle size={14} />
            </button>
            <button
              onClick={() => handleReject(event._id)}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
              title="Reject Event"
            >
              <XCircle size={14} />
            </button>
          </>
        )}

        {event.status === "approved" && (
          <button
            onClick={() => handlePublish(event._id)}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all disabled:opacity-50"
            title="Publish Event"
          >
            <Send size={14} />
          </button>
        )}

        <button
          onClick={() => handleDelete(event._id)}
          disabled={isLoading}
          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
          title="Delete Event"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#0c0c0f] text-white font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-0">
          {/* ══ HEADER AREA ══════════════════════════════════════════════ */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold font-syne">Event Management</h1>
              <p className="text-xs text-white/40 mt-1">
                Manage, moderate and monitor all platform events
              </p>
            </div>
            <div className="text-xs text-white/30">
              {total} event{total !== 1 ? "s" : ""} total
            </div>
          </div>

          {/* ══ ADMIN TOOLBAR ══════════════════════════════════════════════ */}
          <div className="rounded-2xl mb-6 bg-white/[0.025] border border-white/[0.07] overflow-visible">
            {/* Search & Actions */}
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-white/[0.06] flex-wrap">
              <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                <div className="relative flex-1 max-w-md">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                  />
                  <input
                    type="text"
                    placeholder="Search by title, ID, or organizer..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[13px] outline-none focus:border-violet-500/50 transition-all"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {selectedEvents.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="h-6 w-px bg-white/10 mx-2" />
                    <span className="text-xs text-violet-300 font-medium">
                      {selectedEvents.length} selected
                    </span>
                    <button
                      onClick={handleBulkDelete}
                      className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                      title="Bulk Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                )}
              </div>

              <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
                {[
                  { id: "grid", Icon: LayoutGrid },
                  { id: "list", Icon: List },
                ].map(({ id, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setViewMode(id)}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === id
                        ? "bg-violet-500/30 text-violet-300"
                        : "text-white/30 hover:text-white/60"
                    }`}
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs & Filters */}
            <div className="flex items-center justify-between px-4 py-2 flex-wrap gap-2">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {ADMIN_TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium whitespace-nowrap transition-all ${
                      tab === id
                        ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                        : "text-white/40 border border-transparent hover:text-white/60"
                    }`}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 relative">
                {/* Sort Dropdown */}
                <div ref={sortRef} className="relative">
                  <button
                    onClick={() => setSortOpen(!sortOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[12px] text-white/60 hover:text-white transition-all"
                  >
                    <SlidersHorizontal size={12} />
                    Sort:{" "}
                    {SORT_OPTIONS.find((o) => o.value === sort)?.label ||
                      "Latest Created"}
                    <ChevronDown
                      size={10}
                      className={`transition-transform ${sortOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {sortOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1f] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                      >
                        {SORT_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSort(option.value);
                              setSortOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-[12px] hover:bg-white/5 transition-all ${
                              sort === option.value
                                ? "text-violet-400 bg-violet-500/10"
                                : "text-white/60"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Event Type Dropdown */}
                <div ref={typeRef} className="relative">
                  <button
                    onClick={() => setTypeOpen(!typeOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[12px] text-white/60 hover:text-white transition-all"
                  >
                    <Tag size={12} />
                    Type:{" "}
                    {EVENT_TYPES.find((t) => t.value === eventType)?.label ||
                      "All Types"}
                    <ChevronDown
                      size={10}
                      className={`transition-transform ${typeOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {typeOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1f] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                      >
                        {EVENT_TYPES.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setEventType(option.value);
                              setTypeOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-[12px] hover:bg-white/5 transition-all ${
                              eventType === option.value
                                ? "text-violet-400 bg-violet-500/10"
                                : "text-white/60"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Reset Filters */}
                {(search || eventType || tab !== "all") && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setEventType("");
                      setTab("all");
                      setSort("-createdAt");
                    }}
                    className="p-2 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white/80 transition-all"
                    title="Reset all filters"
                  >
                    <RotateCcw size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ══ CONTENT AREA ══════════════════════════════════════════════ */}
          {initialLoad ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5"
                  : "flex flex-col gap-3"
              }
            >
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`${viewMode === "grid" ? "h-48" : "h-24"} rounded-2xl bg-white/5 animate-pulse`}
                />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-white/20">
              <Zap size={48} strokeWidth={1} />
              <p className="mt-4 text-sm font-medium">No events found</p>
              <p className="text-xs text-white/10 mt-1">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5"
                  : "flex flex-col gap-3"
              }
            >
              {events.map((event, index) => (
                <div
                  key={event._id}
                  ref={index === events.length - 1 ? lastElementRef : null}
                >
                  {viewMode === "list" ? (
                    // List view row
                    <div
                      className={`flex items-center justify-between p-4 rounded-xl bg-white/[0.025] border border-white/[0.07] hover:bg-white/[0.04] transition-all ${
                        selectedEvents.includes(event._id)
                          ? "border-violet-500/50 bg-violet-500/5"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedEvents.includes(event._id)}
                          onChange={() => {
                            setSelectedEvents((prev) =>
                              prev.includes(event._id)
                                ? prev.filter((id) => id !== event._id)
                                : [...prev, event._id],
                            );
                          }}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500/20"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-medium truncate">
                              {event.name}
                            </h3>
                            {getStatusBadge(event.status)}
                          </div>
                          <div className="flex items-center gap-4 text-[11px] text-white/30">
                            <span>
                              Created:{" "}
                              {new Date(event.createdAt).toLocaleDateString()}
                            </span>
                            <span>
                              Live:{" "}
                              {new Date(event.liveDate).toLocaleDateString()}
                            </span>
                            <span>
                              By: {event.createdBy?.name || "Unknown"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderAdminActions(event)}
                      </div>
                    </div>
                  ) : (
                    // Grid view card
                    <div
                      className={`relative rounded-xl bg-white/[0.025] border border-white/[0.07] overflow-hidden hover:bg-white/[0.04] transition-all ${
                        selectedEvents.includes(event._id)
                          ? "border-violet-500/50 bg-violet-500/5"
                          : ""
                      }`}
                    >
                      {/* Selection checkbox */}
                      <div className="absolute top-3 left-3 z-10">
                        <input
                          type="checkbox"
                          checked={selectedEvents.includes(event._id)}
                          onChange={() => {
                            setSelectedEvents((prev) =>
                              prev.includes(event._id)
                                ? prev.filter((id) => id !== event._id)
                                : [...prev, event._id],
                            );
                          }}
                          className="w-4 h-4 rounded border-white/20 bg-black/50 text-violet-500 focus:ring-violet-500/20"
                        />
                      </div>

                      {/* Thumbnail */}
                      <div className="h-32 bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center">
                        {event.thumbnailUrl ? (
                          <img
                            src={event.thumbnailUrl}
                            alt={event.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Calendar size={32} className="text-white/20" />
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm font-medium line-clamp-1">
                            {event.name}
                          </h3>
                          {getStatusBadge(event.status)}
                        </div>
                        <p className="text-[11px] text-white/30 line-clamp-2 mb-3">
                          {event.description || "No description"}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] text-white/20">
                            {new Date(event.liveDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            {renderAdminActions(event)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Loading indicator for pagination */}
          {loading && !initialLoad && (
            <div className="flex justify-center py-10 text-white/30 text-xs gap-2">
              <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              Loading more events...
            </div>
          )}

          {/* End of results */}
          {!loading &&
            !initialLoad &&
            events.length > 0 &&
            page >= totalPages &&
            totalPages > 0 && (
              <div className="text-center py-8 text-white/20 text-xs">
                End of results — {total} event{total !== 1 ? "s" : ""} total
              </div>
            )}
        </main>
      </div>
    </div>
  );
}

// ADMIN_TABS definition
const ADMIN_TABS = [
  { id: "all", label: "All Events", icon: LayoutGrid },
  { id: "published", label: "Published", icon: CheckCircle2 },
  { id: "pending", label: "Pending", icon: AlertCircle },
  { id: "draft", label: "Approved", icon: FileText },
  { id: "archived", label: "Completed", icon: Archive },
];
