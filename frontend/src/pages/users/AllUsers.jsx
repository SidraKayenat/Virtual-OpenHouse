import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Changed from motion/react to framer-motion as per standard
import {
  Eye,
  XCircle,
  CheckCircle,
  RefreshCw,
  Search,
  Users,
  UserCheck,
  ShieldAlert,
  UserPlus,
} from "lucide-react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { userAPI } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

// ─── Styled Input ─────────────────────────────
const inputBase = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.88)",
  borderRadius: 12,
  outline: "none",
  width: "100%",
  padding: "10px 14px",
  fontSize: 13.5,
};

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div
      className="flex-1 min-w-[200px] p-4 rounded-2xl flex items-center gap-4"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: `${color}15`, color: color }}
      >
        <Icon size={22} />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wider font-bold text-white/30">
          {label}
        </p>
        <h3 className="text-xl font-bold text-white mt-0.5">
          {value?.toLocaleString() || 0}
        </h3>
      </div>
    </div>
  );
}

function UserSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl animate-pulse bg-white/5 border border-white/10">
      <div className="w-10 h-10 rounded-full bg-white/10" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 w-1/3 bg-white/10 rounded" />
        <div className="h-3 w-1/4 bg-white/5 rounded" />
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────
export default function AllUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const navigate = useNavigate();
  const observer = useRef();

  const fetchUsers = useCallback(
    async (reset = false) => {
      try {
        setLoading(true);
        const currentPage = reset ? 1 : page;
        const res = await userAPI.getAllUsers({ page: currentPage, limit: 10 });

        const newData = res.data || [];
        const totalCount = res.pagination?.total || 0;

        setUsers((prev) => (reset ? newData : [...prev, ...newData]));
        setTotal(totalCount);
        setHasMore(newData.length === 10);
      } catch (err) {
        console.error("Failed to fetch users", err);
      } finally {
        setLoading(false);
      }
    },
    [page],
  );

  // Initial load
  useEffect(() => {
    fetchUsers(true);
  }, []);

  // Infinite Scroll Observer
  const lastUserRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((p) => p + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  // Trigger fetch on page change (only for pages > 1)
  useEffect(() => {
    if (page > 1) fetchUsers(false);
  }, [page, fetchUsers]);

  const handleActivate = async (userId) => {
    try {
      await userAPI.activateUser(userId);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isActive: true } : u)),
      );
      toast.success("User activated successfully");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to activate user");
    }
  };

  const handleDeactivate = async (userId) => {
    try {
      await userAPI.deactivateUser(userId);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isActive: false } : u)),
      );
      toast.success("User deactivated successfully");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to deactivate user");
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex h-screen bg-[#0C0C10] text-white overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardNavbar />

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2
              className="text-2xl font-bold"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              All Users
            </h2>
            <div className="relative w-full sm:w-72">
              <input
                style={inputBase}
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4">
            <StatCard
              label="Total Users"
              value={total}
              icon={Users}
              color="#a78bfa"
            />
            <StatCard
              label="Admins"
              value={users.filter((u) => u.role === "admin").length}
              icon={ShieldAlert}
              color="#f87171"
            />
            <StatCard
              label="Active"
              value={users.filter((u) => u.isActive).length}
              icon={UserCheck}
              color="#34d399"
            />
          </div>

          {/* List */}
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((user, index) => (
                <motion.div
                  key={user._id}
                  ref={index === filtered.length - 1 ? lastUserRef : null}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl flex items-center justify-between bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{user.name}</p>
                      <p className="text-xs text-white/40">
                        {user.email} •{" "}
                        <span className="capitalize">{user.role}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {user.isActive ? (
                      <button
                        onClick={() => handleDeactivate(user._id)}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5"
                      >
                        <XCircle size={14} /> Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(user._id)}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5"
                      >
                        <CheckCircle size={14} /> Activate
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/admin/users/${user._id}`)}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading &&
              Array(3)
                .fill(0)
                .map((_, i) => <UserSkeleton key={i} />)}

            {!hasMore && total > 0 && (
              <p className="text-center text-xs text-white/20 py-10">
                End of list. {total} users loaded.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
