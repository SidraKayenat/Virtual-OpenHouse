import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Shield,
  User,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Mail,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  UserX,
  Crown,
  Filter,
  Loader2,
} from "lucide-react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { userAPI } from "@/lib/api";
import { toast } from "sonner";

export default function TeamsAndManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [stats, setStats] = useState({ totalUsers: 0, totalAdmins: 0 });
  const [actionLoading, setActionLoading] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch users with filters
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
      };

      if (search) params.search = search;
      if (roleFilter !== "all") params.role = roleFilter;

      const response = await userAPI.getAllUsers(params);

      if (response.success) {
        setUsers(response.data);
        setTotalPages(response.pagination?.pages || 1);
        setTotalUsers(response.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error(error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await userAPI.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchUsers();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    setActionLoading(selectedUser._id);
    try {
      const response = await userAPI.updateRole(selectedUser._id, newRole);
      if (response.success) {
        toast.success(
          `User role updated to ${newRole === "admin" ? "Admin" : "User"}`,
        );
        fetchUsers();
        fetchStats();
        setShowRoleModal(false);
        setSelectedUser(null);
      } else {
        throw new Error(response.message || "Failed to update role");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update user role");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (user) => {
    setActionLoading(user._id);
    try {
      const response = await userAPI[
        user.isActive ? "deactivateUser" : "activateUser"
      ](user._id);
      if (response.success) {
        toast.success(
          `User ${user.isActive ? "deactivated" : "activated"} successfully`,
        );
        fetchUsers();
        fetchStats();
      } else {
        throw new Error(response.message || "Failed to update status");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update user status");
    } finally {
      setActionLoading(null);
      setOpenMenuId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (deleteConfirmText !== selectedUser.name) {
      toast.error("User name does not match");
      return;
    }

    setActionLoading(selectedUser._id);
    try {
      const response = await userAPI.delete(selectedUser._id);
      if (response.success) {
        toast.success("User deleted successfully");
        fetchUsers();
        fetchStats();
        setShowDeleteModal(false);
        setSelectedUser(null);
        setDeleteConfirmText("");
      } else {
        throw new Error(response.message || "Failed to delete user");
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
    setOpenMenuId(null);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setDeleteConfirmText("");
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleBadge = (role) => {
    if (role === "admin") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
          <ShieldCheck size={12} />
          Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
        <User size={12} />
        User
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-green-500/20 text-green-400 border border-green-500/30">
          <CheckCircle size={12} />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-red-500/20 text-red-400 border border-red-500/30">
        <XCircle size={12} />
        Inactive
      </span>
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
              <h1 className="text-2xl font-bold font-syne">
                Teams & Management
              </h1>
              <p className="text-xs text-white/40 mt-1">
                Manage user roles, permissions, and system access
              </p>
            </div>
            <button
              onClick={() => {
                fetchUsers();
                fetchStats();
              }}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[12px] text-white/60 hover:text-white transition-all"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl bg-white/[0.025] border border-white/[0.07] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-white/30 uppercase tracking-wider">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold mt-1">{stats.totalUsers}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Users size={18} className="text-blue-400" />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white/[0.025] border border-white/[0.07] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-white/30 uppercase tracking-wider">
                    Administrators
                  </p>
                  <p className="text-2xl font-bold mt-1">{stats.totalAdmins}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Shield size={18} className="text-purple-400" />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white/[0.025] border border-white/[0.07] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-white/30 uppercase tracking-wider">
                    Active Users
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {users.filter((u) => u.isActive).length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <UserCheck size={18} className="text-green-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-2xl mb-6 bg-white/[0.025] border border-white/[0.07] overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-white/[0.06] flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[13px] outline-none focus:border-violet-500/50 transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    <XCircle size={12} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                  <Filter size={12} className="text-white/40" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-transparent text-[12px] text-white/60 outline-none cursor-pointer"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admins</option>
                    <option value="user">Users</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                  <Filter size={12} className="text-white/40" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent text-[12px] text-white/60 outline-none cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl bg-white/[0.025] border border-white/[0.07] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/[0.06]">
                  <tr>
                    <th className="text-left px-4 py-3 text-[11px] font-medium text-white/30 uppercase tracking-wider">
                      User
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-medium text-white/30 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-medium text-white/30 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-medium text-white/30 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-medium text-white/30 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-medium text-white/30 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="text-center px-4 py-3 text-[11px] font-medium text-white/30 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && users.length === 0 ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-white/[0.04]">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="h-12 bg-white/5 rounded-lg animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-12 text-white/30"
                      >
                        <Users size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No users found</p>
                        <p className="text-xs mt-1">
                          Try adjusting your filters
                        </p>
                      </td>
                    </tr>
                  ) : (
                    users
                      .filter(
                        (u) =>
                          statusFilter === "all" ||
                          (statusFilter === "active"
                            ? u.isActive
                            : !u.isActive),
                      )
                      .map((user) => (
                        <tr
                          key={user._id}
                          className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-all"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                                {user.profileImage ? (
                                  <img
                                    src={user.profileImage}
                                    alt={user.name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[12px] font-medium text-white/60">
                                    {user.name?.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="text-[13px] font-medium">
                                  {user.name}
                                </p>
                                <p className="text-[10px] text-white/30">
                                  ID: {user._id.slice(-8)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-0.5">
                              <p className="text-[12px] text-white/60 flex items-center gap-1">
                                <Mail size={10} className="text-white/30" />
                                {user.email}
                              </p>
                              {user.phoneNumber && (
                                <p className="text-[10px] text-white/30">
                                  {user.phoneNumber}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Building2 size={12} className="text-white/30" />
                              <span className="text-[12px] text-white/60">
                                {user.organization || "—"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {getRoleBadge(user.role)}
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(user.isActive)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={10} className="text-white/30" />
                              <span className="text-[11px] text-white/40">
                                {formatDate(user.createdAt)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="relative flex justify-center">
                              <button
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === user._id ? null : user._id,
                                  )
                                }
                                className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
                                disabled={actionLoading === user._id}
                              >
                                {actionLoading === user._id ? (
                                  <Loader2
                                    size={14}
                                    className="animate-spin text-white/40"
                                  />
                                ) : (
                                  <MoreVertical
                                    size={14}
                                    className="text-white/40"
                                  />
                                )}
                              </button>

                              <AnimatePresence>
                                {openMenuId === user._id && (
                                  <motion.div
                                    ref={menuRef}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-1 z-50 w-40 bg-[#1a1a1f] border border-white/10 rounded-xl shadow-xl overflow-hidden"
                                  >
                                    <button
                                      onClick={() => openRoleModal(user)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-white/60 hover:bg-white/5 transition-all"
                                    >
                                      <Shield size={12} />
                                      Change Role
                                    </button>
                                    <button
                                      onClick={() => handleToggleStatus(user)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-white/60 hover:bg-white/5 transition-all"
                                    >
                                      {user.isActive ? (
                                        <>
                                          <UserX size={12} />
                                          Deactivate
                                        </>
                                      ) : (
                                        <>
                                          <UserCheck size={12} />
                                          Activate
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => openDeleteModal(user)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-red-400 hover:bg-red-500/10 transition-all"
                                    >
                                      <Trash2 size={12} />
                                      Delete User
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
                <p className="text-[11px] text-white/30">
                  Showing {users.length} of {totalUsers} users
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white transition-all"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[11px] text-white/40 px-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Change Role Modal */}
      <AnimatePresence>
        {showRoleModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowRoleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md mx-4 bg-[#121216] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/[0.06]">
                <h2 className="text-lg font-semibold font-syne">
                  Change User Role
                </h2>
                <p className="text-xs text-white/40 mt-1">
                  Update role for {selectedUser.name}
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
                    Select Role
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setNewRole("user")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                        newRole === "user"
                          ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                          : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"
                      }`}
                    >
                      <User size={14} />
                      User
                    </button>
                    <button
                      onClick={() => setNewRole("admin")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                        newRole === "admin"
                          ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                          : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"
                      }`}
                    >
                      <Shield size={14} />
                      Admin
                    </button>
                  </div>
                </div>

                {selectedUser.role === "admin" && newRole === "user" && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <AlertCircle
                      size={14}
                      className="text-yellow-400 flex-shrink-0 mt-0.5"
                    />
                    <p className="text-[11px] text-yellow-400/80">
                      This user will lose admin privileges and access to
                      admin-only features.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 p-6 pt-0">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[13px] text-white/60 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateRole}
                  disabled={
                    newRole === selectedUser.role ||
                    actionLoading === selectedUser._id
                  }
                  className="flex-1 py-2.5 rounded-xl bg-violet-500 text-[13px] font-medium text-white hover:bg-violet-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === selectedUser._id ? (
                    <Loader2 size={14} className="animate-spin mx-auto" />
                  ) : (
                    "Update Role"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete User Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md mx-4 bg-[#121216] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/[0.06]">
                <h2 className="text-lg font-semibold font-syne text-red-400">
                  Delete User
                </h2>
                <p className="text-xs text-white/40 mt-1">
                  This action cannot be undone
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle
                    size={16}
                    className="text-red-400 flex-shrink-0"
                  />
                  <p className="text-[11px] text-red-400/80">
                    Deleting this user will permanently remove all their data,
                    including events and registrations.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
                    Type{" "}
                    <span className="text-red-400">{selectedUser.name}</span> to
                    confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={`Type "${selectedUser.name}"`}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[13px] outline-none focus:border-red-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 p-6 pt-0">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[13px] text-white/60 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={
                    deleteConfirmText !== selectedUser.name ||
                    actionLoading === selectedUser._id
                  }
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-[13px] font-medium text-white hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === selectedUser._id ? (
                    <Loader2 size={14} className="animate-spin mx-auto" />
                  ) : (
                    "Delete Permanently"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
