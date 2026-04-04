import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  X,
  ChevronDown,
  Calendar,
  Zap,
  Tag,
  RotateCcw,
  Trash2,
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

// --- Constants Moved Outside Component ---
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

const TAB_FILTERS = {
  all: null,
  published: "published",
  pending: "pending",
  draft: "approved",
  archived: "completed",
};

const ADMIN_TABS = [
  { id: "all", label: "All Events", icon: LayoutGrid },
  { id: "published", label: "Published", icon: CheckCircle2 },
  { id: "pending", label: "Pending", icon: AlertCircle },
  { id: "draft", label: "Approved", icon: FileText },
  { id: "archived", label: "Completed", icon: Archive },
];

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

export default function AllEvents() {
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
  const [error, setError] = useState(null); // Fixed: Added missing error state

  const observer = useRef();
  const sortRef = useRef();
  const typeRef = useRef();

  const fetchEvents = useCallback(
    async (resetPage = true) => {
      try {
        setLoading(true);
        const currentPage = resetPage ? 1 : page;
        if (resetPage) setPage(1);

        const params = {
          page: currentPage,
          limit: 12,
          search: search || undefined,
          eventType: eventType || undefined,
          sort: sort || undefined,
          //   status: TAB_FILTERS[tab] || undefined,
        };

        const response = await eventAPI.getAll(params);

        if (response.success) {
          setEvents(resetPage ? data : [...prev, ...data]);
          setTotal(response.pagination?.total || 0);
          setTotalPages(response.pagination?.pages || 0);
          setError(null);
        } else {
          throw new Error(response.message || "Failed to fetch events");
        }
      } catch (err) {
        setError(err.message);
        toast.error(err.message || "Failed to load events");
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    },
    [search, eventType, sort, tab, page],
  );

  // Handle Search/Filter Changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, eventType, sort, tab]);

  // Infinite Scroll Trigger
  useEffect(() => {
    if (page > 1) fetchEvents(false);
  }, [page]);

  // Click Outside logic
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target))
        setSortOpen(false);
      if (typeRef.current && !typeRef.current.contains(event.target))
        setTypeOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const lastElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && page < totalPages) {
          setPage((p) => p + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, page, totalPages],
  );

  // --- Actions ---
  const handleApprove = async (eventId) => {
    setActionLoading(eventId);
    try {
      const response = await eventAPI.approve(eventId);
      if (response.success) {
        toast.success("Event approved");
        fetchEvents(true);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm("Delete this event?")) return;
    setActionLoading(eventId);
    try {
      await eventAPI.delete(eventId);
      toast.success("Event deleted");
      fetchEvents(true);
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setActionLoading(null);
    }
  };

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

  const renderAdminActions = (event) => {
    const isLoading = actionLoading === event._id;
    return (
      <div className="flex items-center gap-1">
        {event.status === "pending" && (
          <>
            <button
              onClick={() => handleApprove(event._id)}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-50"
            >
              <CheckCircle size={14} />
            </button>
            <button
              onClick={() => {
                /* handleReject */
              }}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50"
            >
              <XCircle size={14} />
            </button>
          </>
        )}
        <button
          onClick={() => handleDelete(event._id)}
          disabled={isLoading}
          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className="h-screen flex bg-[#0c0c0f] text-white font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <DashboardNavbar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Event Management</h1>
              <p className="text-xs text-white/40 mt-1">
                Moderate platform events
              </p>
            </div>
            <div className="text-xs text-white/30">{total} events total</div>
          </div>

          {/* Toolbar */}
          <div className="rounded-2xl mb-6 bg-white/[0.025] border border-white/[0.07] p-3">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                />
                <input
                  className="w-full pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-sm"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex bg-white/5 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-violet-500/20 text-violet-400" : ""}`}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-violet-500/20 text-violet-400" : ""}`}
                >
                  <List size={14} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2 overflow-x-auto">
                {ADMIN_TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 ${tab === t.id ? "bg-violet-500/20 text-violet-300" : "text-white/40"}`}
                  >
                    <t.icon size={12} /> {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          {initialLoad ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 bg-white/5 animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="py-20 text-center text-white/20">
              <Zap className="mx-auto mb-2" /> No events found
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5"
                  : "flex flex-col gap-3"
              }
            >
              {events.map((event, index) => (
                <div
                  key={event._id}
                  ref={index === events.length - 1 ? lastElementRef : null}
                >
                  {viewMode === "list" ? (
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {event.name}
                        </span>
                        <span className="text-[10px] text-white/30">
                          {event.status}
                        </span>
                      </div>
                      {renderAdminActions(event)}
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
                      <div className="h-24 bg-violet-500/10 flex items-center justify-center">
                        {event.thumbnailUrl ? (
                          <img
                            src={event.thumbnailUrl}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Calendar className="text-white/10" />
                        )}
                      </div>
                      <div className="p-3">
                        <div className="flex justify-between items-start">
                          <h3 className="text-xs font-bold truncate w-2/3">
                            {event.name}
                          </h3>
                          {getStatusBadge(event.status)}
                        </div>
                        <div className="mt-4 flex justify-end">
                          {renderAdminActions(event)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
