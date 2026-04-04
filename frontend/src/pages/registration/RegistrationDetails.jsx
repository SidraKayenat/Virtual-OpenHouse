import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  Hash,
  Wrench,
  Calendar,
  Building,
  Edit,
  ShieldAlert,
  Eye,
  ExternalLink,
  Box,
  Info,
} from "lucide-react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { registrationAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ─── Constants ────────────────────────────────────────────────────────────
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
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.1)",
    border: "rgba(148,163,184,0.2)",
    icon: XCircle,
  },
};

const CATEGORY_COLORS = {
  technology: "#60a5fa",
  business: "#34d399",
  art: "#f472b6",
  science: "#a78bfa",
  other: "#fb923c",
};

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
const fmtFull = (d) =>
  d
    ? new Date(d).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

// ─── Styled inputs ────────────────────────────────────────────────────────
const inputBase = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.88)",
  borderRadius: 12,
  outline: "none",
  width: "100%",
  padding: "10px 14px",
  fontSize: 13.5,
  transition: "border-color 0.18s",
};

function StyledInput({ ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        ...inputBase,
        borderColor: focused
          ? "rgba(167,139,250,0.5)"
          : "rgba(255,255,255,0.1)",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function StyledTextarea({ ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      style={{
        ...inputBase,
        resize: "vertical",
        minHeight: 90,
        borderColor: focused
          ? "rgba(167,139,250,0.5)"
          : "rgba(255,255,255,0.1)",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

// ─── Confirm modal ────────────────────────────────────────────────────────
function ConfirmModal({
  title,
  desc,
  accentColor = "#f87171",
  accentBg = "rgba(239,68,68,0.12)",
  confirmLabel,
  onConfirm,
  onCancel,
  loading,
  children,
}) {
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
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
        style={{
          background: "#1a1728",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: accentBg,
              border: `1px solid ${accentColor}40`,
            }}
          >
            <ShieldAlert size={18} style={{ color: accentColor }} />
          </div>
          <div>
            <h3
              className="text-white font-bold text-[15px]"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              {title}
            </h3>
            {desc && (
              <p
                className="text-[12px]"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                {desc}
              </p>
            )}
          </div>
        </div>
        {children}
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
            Go back
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white"
            style={{
              background: `${accentColor}30`,
              border: `1px solid ${accentColor}50`,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : null}
            {loading ? "Processing…" : confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────
function Section({ title, icon: Icon, accent = "#a78bfa", children }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
        >
          <Icon size={15} style={{ color: accent }} />
        </div>
        <h2
          className="text-white font-bold text-[14.5px]"
          style={{ fontFamily: "'Syne',sans-serif" }}
        >
          {title}
        </h2>
      </div>
      <div className="p-5 flex flex-col gap-4">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p
        className="text-[10.5px] font-bold uppercase tracking-wider"
        style={{ color: "rgba(255,255,255,0.28)" }}
      >
        {label}
      </p>
      <p
        className="text-[13px] font-medium"
        style={{ color: "rgba(255,255,255,0.82)" }}
      >
        {value || "—"}
      </p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────
export default function RegistrationDetails() {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Admin action state
  const [stallNumber, setStallNumber] = useState("");
  const [stallError, setStallError] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");
  const [modal, setModal] = useState(null); // "approve" | "reject" | "cancel"

  // User action state
  const [cancelModal, setCancelModal] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await registrationAPI.getById(registrationId);
      setRegistration(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [registrationId]);

  const handleApprove = async () => {
    if (!stallNumber || parseInt(stallNumber) < 1) {
      setStallError("Enter a valid stall number");
      return;
    }
    const max = registration.event?.numberOfStalls;
    if (max && parseInt(stallNumber) > max) {
      setStallError(`Max stall number is ${max}`);
      return;
    }
    try {
      setActionLoading(true);
      await registrationAPI.approve(registrationId, parseInt(stallNumber));
      setModal(null);
      setStallNumber("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setRejectionError("Rejection reason is required");
      return;
    }
    try {
      setActionLoading(true);
      await registrationAPI.reject(registrationId, rejectionReason);
      setModal(null);
      setRejectionReason("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      await registrationAPI.cancel(registrationId);
      setCancelModal(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Role detection
  const isOwner = user && registration && registration.user?._id === user._id;
  const isEventAdmin =
    user &&
    registration &&
    (registration.event?.createdBy === user._id ||
      registration.event?.createdBy?._id === user._id);

  const isPending = registration?.status === "pending";
  const isApproved = registration?.status === "approved";
  const isRejected = registration?.status === "rejected";
  const isCancelled = registration?.status === "cancelled";

  const eventLiveDate = registration?.event?.liveDate
    ? new Date(registration.event.liveDate)
    : null;
  const beforeLive = eventLiveDate ? new Date() < eventLiveDate : true;
  const canCancel = isOwner && (isPending || isApproved) && beforeLive;
  const canUpdate = isOwner && isPending;
  const canCreateStall = isOwner && isApproved;

  const s = registration
    ? STATUS_META[registration.status] || STATUS_META.pending
    : STATUS_META.pending;
  const SIcon = s.icon;
  const catColor =
    CATEGORY_COLORS[registration?.participantInfo?.category] || "#a78bfa";

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen flex" style={{ background: "#0c0c0f" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
              <p
                className="text-[13px]"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                Loading registration…
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="min-h-screen flex" style={{ background: "#0c0c0f" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-white font-semibold mb-2">
                Registration not found
              </p>
              <button
                onClick={() => navigate(-1)}
                className="text-violet-400 underline text-sm"
              >
                Go back
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const info = registration.participantInfo || {};

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
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
        select option { background: #1a1728; color: white; }
      `}</style>

      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between gap-4 mb-7"
          >
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => navigate(-1)}
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.5)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.5)")
                }
              >
                <ArrowLeft size={15} />
              </button>
              <div className="min-w-0">
                <h1
                  className="text-white text-xl font-bold"
                  style={{ fontFamily: "'Syne',sans-serif" }}
                >
                  Registration Details
                </h1>
                <p
                  className="text-[12.5px]"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {info.projectTitle || "—"} · {registration.event?.name}
                </p>
              </div>
            </div>

            {/* Status badge */}
            <span
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12.5px] font-bold flex-shrink-0"
              style={{
                background: s.bg,
                color: s.color,
                border: `1px solid ${s.border}`,
              }}
            >
              <SIcon size={13} />
              {s.label}
              {isApproved &&
                registration.stallNumber &&
                ` · Stall #${registration.stallNumber}`}
            </span>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Main content ── */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              {/* Status banner */}
              {isApproved && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 }}
                  className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{
                    background: "rgba(52,211,153,0.08)",
                    border: "1px solid rgba(52,211,153,0.2)",
                  }}
                >
                  <CheckCircle
                    size={20}
                    style={{ color: "#34d399", flexShrink: 0 }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-[13.5px]">
                      Registration Approved 🎉
                    </p>
                    <p
                      className="text-[12px]"
                      style={{ color: "rgba(255,255,255,0.45)" }}
                    >
                      {registration.stallNumber
                        ? `You've been assigned Stall #${registration.stallNumber}.`
                        : "Your registration has been approved."}
                      {registration.approvedBy
                        ? ` Approved by ${registration.approvedBy?.name || "Admin"} on ${fmt(registration.approvedAt)}.`
                        : ""}
                    </p>
                  </div>
                </motion.div>
              )}

              {isRejected && registration.rejectionReason && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 }}
                  className="flex items-start gap-3 p-4 rounded-2xl"
                  style={{
                    background: "rgba(248,113,113,0.08)",
                    border: "1px solid rgba(248,113,113,0.2)",
                  }}
                >
                  <XCircle
                    size={18}
                    style={{ color: "#f87171", flexShrink: 0, marginTop: 1 }}
                  />
                  <div>
                    <p className="text-white font-semibold text-[13.5px] mb-1">
                      Registration Rejected
                    </p>
                    <p className="text-[12.5px]" style={{ color: "#fca5a5" }}>
                      <span className="font-semibold">Reason: </span>
                      {registration.rejectionReason}
                    </p>
                    {registration.rejectedBy && (
                      <p
                        className="text-[11px] mt-1"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        By {registration.rejectedBy?.name} on{" "}
                        {fmt(registration.rejectedAt)}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {isCancelled && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 }}
                  className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{
                    background: "rgba(148,163,184,0.08)",
                    border: "1px solid rgba(148,163,184,0.18)",
                  }}
                >
                  <XCircle
                    size={18}
                    style={{ color: "#94a3b8", flexShrink: 0 }}
                  />
                  <p
                    className="text-[13px]"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    This registration was cancelled
                    {registration.cancellationReason
                      ? `: "${registration.cancellationReason}"`
                      : "."}
                    .
                  </p>
                </motion.div>
              )}

              {/* Project Info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
              >
                <Section
                  title="Project Information"
                  icon={Hash}
                  accent="#a78bfa"
                >
                  <div>
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: "rgba(255,255,255,0.25)" }}
                    >
                      Project Title
                    </p>
                    <p
                      className="text-white font-bold text-[17px]"
                      style={{ fontFamily: "'Syne',sans-serif" }}
                    >
                      {info.projectTitle || "—"}
                    </p>
                  </div>
                  {info.category && (
                    <span
                      className="self-start text-[11px] font-bold px-3 py-1 rounded-full capitalize"
                      style={{
                        background: `${catColor}18`,
                        color: catColor,
                        border: `1px solid ${catColor}30`,
                      }}
                    >
                      {info.category}
                    </span>
                  )}
                  {info.projectDescription && (
                    <div>
                      <p
                        className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
                        style={{ color: "rgba(255,255,255,0.25)" }}
                      >
                        Description
                      </p>
                      <p
                        className="text-[13px] leading-relaxed"
                        style={{ color: "rgba(255,255,255,0.65)" }}
                      >
                        {info.projectDescription}
                      </p>
                    </div>
                  )}
                </Section>
              </motion.div>

              {/* Team */}
              {info.teamMembers?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                >
                  <Section
                    title={`Team Members (${info.teamMembers.length})`}
                    icon={Users}
                    accent="#60a5fa"
                  >
                    <div className="flex flex-col gap-2">
                      {info.teamMembers.map((m, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 rounded-xl"
                          style={{
                            background: "rgba(96,165,250,0.06)",
                            border: "1px solid rgba(96,165,250,0.12)",
                          }}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
                            style={{
                              background:
                                "linear-gradient(135deg,#7c3aed,#2563eb)",
                            }}
                          >
                            {m.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white text-[13px] font-semibold">
                              {m.name}
                            </p>
                            <p
                              className="text-[11px] capitalize"
                              style={{ color: "rgba(255,255,255,0.38)" }}
                            >
                              {m.role}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                </motion.div>
              )}

              {/* Requirements */}
              {info.requirements && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16 }}
                >
                  <Section
                    title="Special Requirements"
                    icon={Wrench}
                    accent="#fb923c"
                  >
                    <p
                      className="text-[13px] leading-relaxed"
                      style={{ color: "rgba(255,255,255,0.65)" }}
                    >
                      {info.requirements}
                    </p>
                  </Section>
                </motion.div>
              )}

              {/* ── EVENT ADMIN ACTIONS ── */}
              {isEventAdmin && isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Section
                    title="Admin Actions"
                    icon={ShieldAlert}
                    accent="#fbbf24"
                  >
                    <div
                      className="p-3.5 rounded-xl text-[12px]"
                      style={{
                        background: "rgba(251,191,36,0.07)",
                        border: "1px solid rgba(251,191,36,0.15)",
                        color: "#fde68a",
                      }}
                    >
                      <Info size={13} className="inline mr-1.5 mb-0.5" />
                      Review this registration and assign a stall number to
                      approve, or provide a reason to reject.
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setModal("approve")}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold text-white transition-all"
                        style={{
                          background: "rgba(52,211,153,0.18)",
                          color: "#6ee7b7",
                          border: "1px solid rgba(52,211,153,0.28)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(52,211,153,0.28)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(52,211,153,0.18)")
                        }
                      >
                        <CheckCircle size={15} /> Approve & Assign Stall
                      </button>
                      <button
                        onClick={() => setModal("reject")}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold transition-all"
                        style={{
                          background: "rgba(248,113,113,0.12)",
                          color: "#fca5a5",
                          border: "1px solid rgba(248,113,113,0.22)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(248,113,113,0.22)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(248,113,113,0.12)")
                        }
                      >
                        <XCircle size={15} /> Reject
                      </button>
                    </div>
                  </Section>
                </motion.div>
              )}

              {/* ── USER ACTIONS ── */}
              {isOwner && (canUpdate || canCancel || canCreateStall) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Section title="Your Actions" icon={Eye} accent="#60a5fa">
                    <div className="flex flex-wrap gap-3">
                      {canCreateStall && (
                        <button
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
                          style={{
                            background:
                              "linear-gradient(135deg,#7c3aed,#6d28d9)",
                            border: "1px solid rgba(167,139,250,0.3)",
                            boxShadow: "0 4px 16px rgba(124,58,237,0.28)",
                          }}
                          onClick={() =>
                            alert(
                              "Create stall flow — connect to your stall creation page",
                            )
                          }
                        >
                          <Box size={14} /> Create Stall
                        </button>
                      )}
                      {canUpdate && (
                        <Link
                          to={`/registration/${registrationId}/edit`}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                          style={{
                            background: "rgba(96,165,250,0.12)",
                            color: "#93c5fd",
                            border: "1px solid rgba(96,165,250,0.22)",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(96,165,250,0.22)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(96,165,250,0.12)")
                          }
                        >
                          <Edit size={14} /> Update Registration
                        </Link>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => setCancelModal(true)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                          style={{
                            background: "rgba(248,113,113,0.1)",
                            color: "#fca5a5",
                            border: "1px solid rgba(248,113,113,0.2)",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(248,113,113,0.2)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(248,113,113,0.1)")
                          }
                        >
                          <XCircle size={14} /> Cancel Registration
                        </button>
                      )}
                    </div>
                    {!beforeLive && canCancel === false && !isCancelled && (
                      <p
                        className="text-[12px]"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        Cancellation is no longer available after the event's
                        live date.
                      </p>
                    )}
                  </Section>
                </motion.div>
              )}
            </div>

            {/* ── Sidebar info ── */}
            <div className="flex flex-col gap-5">
              {/* Applicant */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div
                    className="flex items-center gap-3 px-4 py-3.5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{
                        background: "rgba(167,139,250,0.12)",
                        border: "1px solid rgba(167,139,250,0.2)",
                      }}
                    >
                      <Users size={14} style={{ color: "#a78bfa" }} />
                    </div>
                    <h3
                      className="text-white font-bold text-[13.5px]"
                      style={{ fontFamily: "'Syne',sans-serif" }}
                    >
                      Applicant
                    </h3>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{
                          background: "linear-gradient(135deg,#7c3aed,#2563eb)",
                        }}
                      >
                        {registration.user?.name?.charAt(0)?.toUpperCase() ||
                          "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-[13.5px] truncate">
                          {registration.user?.name}
                        </p>
                        <p
                          className="text-[11px] truncate"
                          style={{ color: "rgba(255,255,255,0.35)" }}
                        >
                          {registration.user?.email}
                        </p>
                      </div>
                    </div>
                    {registration.user?.organization && (
                      <p
                        className="text-[12px] px-3 py-2 rounded-lg"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          color: "rgba(255,255,255,0.5)",
                        }}
                      >
                        🏢 {registration.user.organization}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Event summary */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.14 }}
              >
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div
                    className="flex items-center gap-3 px-4 py-3.5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{
                        background: "rgba(96,165,250,0.12)",
                        border: "1px solid rgba(96,165,250,0.2)",
                      }}
                    >
                      <Calendar size={14} style={{ color: "#60a5fa" }} />
                    </div>
                    <h3
                      className="text-white font-bold text-[13.5px]"
                      style={{ fontFamily: "'Syne',sans-serif" }}
                    >
                      Event
                    </h3>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <p className="text-white font-semibold text-[13.5px] leading-snug">
                      {registration.event?.name}
                    </p>
                    <div className="flex flex-col gap-2">
                      <InfoRow
                        label="Live Date"
                        value={fmt(registration.event?.liveDate)}
                      />
                      <InfoRow
                        label="Total Stalls"
                        value={registration.event?.numberOfStalls}
                      />
                    </div>
                    {registration.event?._id && (
                      <Link
                        to={`/events/${registration.event._id}`}
                        className="flex items-center gap-2 text-[12px] font-medium transition-colors"
                        style={{ color: "#a78bfa" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "#c4b5fd")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "#a78bfa")
                        }
                      >
                        <ExternalLink size={12} /> View Event Page
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Timestamps */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 }}
              >
                <div
                  className="rounded-2xl p-4 flex flex-col gap-3"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  >
                    Timeline
                  </p>
                  {[
                    {
                      label: "Submitted",
                      value: fmtFull(registration.createdAt),
                    },
                    isApproved && {
                      label: "Approved",
                      value: fmtFull(registration.approvedAt),
                    },
                    isRejected && {
                      label: "Rejected",
                      value: fmtFull(registration.rejectedAt),
                    },
                    isCancelled && {
                      label: "Cancelled",
                      value: fmtFull(registration.cancelledAt),
                    },
                  ]
                    .filter(Boolean)
                    .map(({ label, value }) => (
                      <div key={label} className="flex flex-col gap-0.5">
                        <p
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: "rgba(255,255,255,0.25)" }}
                        >
                          {label}
                        </p>
                        <p
                          className="text-[12px]"
                          style={{ color: "rgba(255,255,255,0.65)" }}
                        >
                          {value}
                        </p>
                      </div>
                    ))}
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {/* Approve modal */}
        {modal === "approve" && (
          <ConfirmModal
            title="Approve Registration"
            desc="Assign a stall number to confirm"
            accentColor="#34d399"
            accentBg="rgba(52,211,153,0.1)"
            confirmLabel="Confirm Approval"
            onConfirm={handleApprove}
            onCancel={() => {
              setModal(null);
              setStallNumber("");
              setStallError("");
            }}
            loading={actionLoading}
          >
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Stall Number <span style={{ color: "#f87171" }}>*</span>
              </label>
              <StyledInput
                type="number"
                min={1}
                max={registration.event?.numberOfStalls}
                placeholder={`1 – ${registration.event?.numberOfStalls || "?"}`}
                value={stallNumber}
                onChange={(e) => {
                  setStallNumber(e.target.value);
                  setStallError("");
                }}
              />
              {stallError && (
                <p className="text-[11.5px]" style={{ color: "#f87171" }}>
                  {stallError}
                </p>
              )}
            </div>
          </ConfirmModal>
        )}

        {/* Reject modal */}
        {modal === "reject" && (
          <ConfirmModal
            title="Reject Registration"
            desc="Provide a reason for the applicant"
            accentColor="#f87171"
            accentBg="rgba(239,68,68,0.1)"
            confirmLabel="Confirm Rejection"
            onConfirm={handleReject}
            onCancel={() => {
              setModal(null);
              setRejectionReason("");
              setRejectionError("");
            }}
            loading={actionLoading}
          >
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Rejection Reason <span style={{ color: "#f87171" }}>*</span>
              </label>
              <StyledTextarea
                placeholder="Explain why this registration is being rejected…"
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  setRejectionError("");
                }}
                rows={3}
              />
              {rejectionError && (
                <p className="text-[11.5px]" style={{ color: "#f87171" }}>
                  {rejectionError}
                </p>
              )}
            </div>
          </ConfirmModal>
        )}

        {/* User cancel modal */}
        {cancelModal && (
          <ConfirmModal
            title="Cancel Registration"
            desc="Are you sure? This cannot be undone."
            accentColor="#f87171"
            accentBg="rgba(239,68,68,0.1)"
            confirmLabel="Yes, Cancel"
            onConfirm={handleCancel}
            onCancel={() => setCancelModal(false)}
            loading={actionLoading}
          >
            <div
              className="p-3.5 rounded-xl text-[12.5px]"
              style={{
                background: "rgba(248,113,113,0.07)",
                border: "1px solid rgba(248,113,113,0.15)",
                color: "#fca5a5",
              }}
            >
              You are about to cancel your registration for{" "}
              <strong>{registration.event?.name}</strong>.
              {isApproved && " Your assigned stall will be released."}
            </div>
          </ConfirmModal>
        )}
      </AnimatePresence>
    </div>
  );
}
