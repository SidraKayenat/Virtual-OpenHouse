import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Lock,
  Bell,
  Sliders,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronRight,
  Camera,
  ShieldAlert,
  LogOut,
  X,
} from "lucide-react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

// ─── Section ids ──────────────────────────────────────────────────────────
const SECTIONS = [
  {
    id: "profile",
    label: "Profile",
    icon: User,
    desc: "Name, contact & avatar",
  },
  { id: "security", label: "Security", icon: Lock, desc: "Password & login" },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    desc: "Email & alert preferences",
  },
  {
    id: "preferences",
    label: "Preferences",
    icon: Sliders,
    desc: "Display & defaults",
  },
  {
    id: "danger",
    label: "Danger Zone",
    icon: Trash2,
    desc: "Delete your account",
    danger: true,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────
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

const lockedBase = {
  ...inputBase,
  background: "rgba(255,255,255,0.02)",
  color: "rgba(255,255,255,0.28)",
  cursor: "not-allowed",
  border: "1px solid rgba(255,255,255,0.06)",
};

function Field({ label, hint, locked, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label
          className="text-[12px] font-semibold uppercase tracking-wide"
          style={{
            color: locked ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.45)",
            letterSpacing: "0.07em",
          }}
        >
          {label}
          {locked && (
            <span
              className="ml-2 normal-case font-normal text-[10px] px-1.5 py-0.5 rounded"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              Read-only
            </span>
          )}
        </label>
        {hint && (
          <span
            className="text-[11px]"
            style={{ color: "rgba(255,255,255,0.22)" }}
          >
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function StyledInput({ icon: Icon, locked, type = "text", ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      {Icon && (
        <Icon
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            color: locked
              ? "rgba(255,255,255,0.15)"
              : focused
                ? "#a78bfa"
                : "rgba(255,255,255,0.25)",
            transition: "color 0.18s",
          }}
        />
      )}
      <input
        type={type}
        {...props}
        disabled={locked}
        style={{
          ...(locked ? lockedBase : inputBase),
          paddingLeft: Icon ? 38 : 14,
          borderColor: locked
            ? "rgba(255,255,255,0.06)"
            : focused
              ? "rgba(167,139,250,0.5)"
              : "rgba(255,255,255,0.1)",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

function PasswordInput({ ...props }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <Lock
        size={14}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          color: focused ? "#a78bfa" : "rgba(255,255,255,0.25)",
          transition: "color 0.18s",
        }}
      />
      <input
        type={show ? "text" : "password"}
        {...props}
        style={{
          ...inputBase,
          paddingLeft: 38,
          paddingRight: 40,
          borderColor: focused
            ? "rgba(167,139,250,0.5)"
            : "rgba(255,255,255,0.1)",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
        style={{ color: show ? "#a78bfa" : "rgba(255,255,255,0.25)" }}
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

function Toggle({ checked, onChange, label, desc }) {
  return (
    <div
      className="flex items-center justify-between gap-4 py-3"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div>
        <p className="text-[13.5px] font-medium text-white">{label}</p>
        {desc && (
          <p
            className="text-[11.5px] mt-0.5"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            {desc}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-250"
        style={{
          background: checked
            ? "linear-gradient(90deg,#7c3aed,#a78bfa)"
            : "rgba(255,255,255,0.1)",
        }}
      >
        <span
          className="absolute top-0.5 transition-all duration-250 w-5 h-5 rounded-full bg-white shadow-sm"
          style={{ left: checked ? "calc(100% - 22px)" : 2 }}
        />
      </button>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.22 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
      style={
        type === "success"
          ? {
              background: "#1a1728",
              border: "1px solid rgba(52,211,153,0.35)",
              color: "#6ee7b7",
            }
          : {
              background: "#1a1728",
              border: "1px solid rgba(248,113,113,0.35)",
              color: "#fca5a5",
            }
      }
    >
      {type === "success" ? (
        <CheckCircle size={15} />
      ) : (
        <AlertCircle size={15} />
      )}
      <span className="text-[13px] font-medium">{message}</span>
    </motion.div>
  );
}

// ─── Confirm modal ────────────────────────────────────────────────────────
function ConfirmModal({
  title,
  desc,
  confirmLabel,
  accentColor,
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
        transition={{ duration: 0.2 }}
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
              background: `${accentColor}15`,
              border: `1px solid ${accentColor}35`,
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
            Cancel
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

// ─── Section card wrapper ─────────────────────────────────────────────────
function SectionCard({ id, title, icon: Icon, accent = "#a78bfa", children }) {
  return (
    <div
      id={id}
      className="rounded-2xl overflow-hidden scroll-mt-24"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
        >
          <Icon size={16} style={{ color: accent }} />
        </div>
        <h2
          className="text-white font-bold text-[15px]"
          style={{ fontFamily: "'Syne',sans-serif" }}
        >
          {title}
        </h2>
      </div>
      <div className="p-6 flex flex-col gap-4">{children}</div>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ["#7c3aed", "#4f46e5"],
  ["#0891b2", "#0e7490"],
  ["#059669", "#047857"],
  ["#d97706", "#b45309"],
  ["#dc2626", "#b91c1c"],
  ["#db2777", "#be185d"],
];

function AvatarPicker({ name, color, onColorChange }) {
  return (
    <div className="flex items-center gap-5">
      <div className="relative flex-shrink-0">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold"
          style={{
            background: `linear-gradient(135deg,${color[0]},${color[1]})`,
            fontFamily: "'Syne',sans-serif",
          }}
        >
          {name?.charAt(0)?.toUpperCase() || "U"}
        </div>
      </div>
      <div>
        <p
          className="text-[12px] font-semibold mb-2"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          AVATAR COLOR
        </p>
        <div className="flex gap-2">
          {AVATAR_COLORS.map(([a, b]) => (
            <button
              key={a}
              type="button"
              onClick={() => onColorChange([a, b])}
              className="w-7 h-7 rounded-lg transition-all"
              style={{
                background: `linear-gradient(135deg,${a},${b})`,
                outline: color[0] === a ? `2px solid white` : "none",
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
        <p
          className="text-[11px] mt-2"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          Initials are used as your avatar throughout the app
        </p>
      </div>
    </div>
  );
}

// ─── PREFS stored in localStorage ─────────────────────────────────────────
const PREFS_KEY = "openhouse_user_prefs";
const DEFAULT_PREFS = {
  defaultEventType: "exhibition",
  defaultViewMode: "grid",
  compactSidebar: false,
};
const DEFAULT_NOTIFS = {
  regApproved: true,
  regRejected: true,
  eventApproved: true,
  eventRejected: true,
  reminders: false,
  newsletter: false,
};

function loadPrefs() {
  try {
    return {
      ...DEFAULT_PREFS,
      ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"),
    };
  } catch {
    return DEFAULT_PREFS;
  }
}
function savePrefs(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}
function loadNotifs() {
  try {
    return {
      ...DEFAULT_NOTIFS,
      ...JSON.parse(localStorage.getItem(PREFS_KEY + "_notifs") || "{}"),
    };
  } catch {
    return DEFAULT_NOTIFS;
  }
}
function saveNotifs(n) {
  localStorage.setItem(PREFS_KEY + "_notifs", JSON.stringify(n));
}

// ─── Main ─────────────────────────────────────────────────────────────────
export default function UserSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Active section for nav highlight
  const [activeSection, setActiveSection] = useState("profile");

  // Toast
  const [toast, setToast] = useState(null); // { message, type }
  const showToast = (message, type = "success") => setToast({ message, type });

  // ── Profile ──────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    name: user?.name || "",
    organization: user?.organization || "",
    phoneNumber: user?.phoneNumber || "",
  });
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileDirty, setProfileDirty] = useState(false);
  const originalProfile = useRef({
    name: user?.name || "",
    organization: user?.organization || "",
    phoneNumber: user?.phoneNumber || "",
  });

  const setProfileField = (k, v) => {
    setProfile((p) => ({ ...p, [k]: v }));
    setProfileDirty(true);
  };

  const handleSaveProfile = async () => {
    if (!profile.name.trim()) {
      showToast("Name is required", "error");
      return;
    }
    try {
      setProfileLoading(true);
      await api("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(profile),
      });
      originalProfile.current = { ...profile };
      setProfileDirty(false);
      showToast("Profile updated successfully");
    } catch (err) {
      showToast(err.message || "Failed to update profile", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Security ─────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);

  const validatePw = () => {
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = "Required";
    if (!pwForm.newPassword) errs.newPassword = "Required";
    else if (pwForm.newPassword.length < 6)
      errs.newPassword = "Min 6 characters";
    if (pwForm.newPassword !== pwForm.confirmPassword)
      errs.confirmPassword = "Passwords don't match";
    return errs;
  };

  const handleChangePassword = async () => {
    const errs = validatePw();
    if (Object.keys(errs).length) {
      setPwErrors(errs);
      return;
    }
    try {
      setPwLoading(true);
      await api("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwErrors({});
      showToast("Password changed successfully");
    } catch (err) {
      showToast(err.message || "Failed to change password", "error");
    } finally {
      setPwLoading(false);
    }
  };

  // ── Notifications ────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState(loadNotifs);
  const setNotif = (k, v) => {
    const next = { ...notifs, [k]: v };
    setNotifs(next);
    saveNotifs(next);
    showToast("Notification preference saved");
  };

  // ── Preferences ──────────────────────────────────────────────────────
  const [prefs, setPrefs] = useState(loadPrefs);
  const setPref = (k, v) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    savePrefs(next);
    showToast("Preference saved");
  };

  // ── Danger zone ───────────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const deleteAllowed = deleteConfirmText === "DELETE";

  // ── Scroll-spy ────────────────────────────────────────────────────────
  useEffect(() => {
    const ids = SECTIONS.map((s) => s.id);
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  };

  const lastLoginStr = user?.lastLogin
    ? new Date(user.lastLogin).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

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
        input::placeholder { color: rgba(255,255,255,0.2); }
        select option { background: #1a1728; color: white; }
      `}</style>

      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <DashboardNavbar />

        <div className="">
          {/* ── top nav ── */}
          <div
            className="w-full shrink-0 overflow-x-auto py-7 px-4"
            style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
          >
            {/* User card at top */}
            <div
              className="mb-6 pb-5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-2.5 px-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg,${avatarColor[0]},${avatarColor[1]})`,
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-[12px] font-semibold truncate">
                    {user?.name}
                  </p>
                  <p
                    className="text-[10px] truncate"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    {user?.role === "admin" ? "System Admin" : "Event Admin"}
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex flex-row gap-1">
              {SECTIONS.map(({ id, label, icon: Icon, desc, danger }) => {
                const active = activeSection === id;
                return (
                  <button
                    key={id}
                    onClick={() => scrollTo(id)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 w-full group"
                    style={{
                      background: active
                        ? danger
                          ? "rgba(239,68,68,0.1)"
                          : "rgba(124,58,237,0.18)"
                        : "transparent",
                      border: active
                        ? danger
                          ? "1px solid rgba(239,68,68,0.25)"
                          : "1px solid rgba(124,58,237,0.3)"
                        : "1px solid transparent",
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: active
                          ? danger
                            ? "rgba(239,68,68,0.2)"
                            : "rgba(124,58,237,0.3)"
                          : "rgba(255,255,255,0.05)",
                      }}
                    >
                      <Icon
                        size={13}
                        style={{
                          color: active
                            ? danger
                              ? "#f87171"
                              : "#c4b5fd"
                            : "rgba(255,255,255,0.3)",
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-[12.5px] font-semibold leading-tight truncate"
                        style={{
                          color: active
                            ? danger
                              ? "#fca5a5"
                              : "#c4b5fd"
                            : "rgba(255,255,255,0.5)",
                        }}
                      >
                        {label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* ── Main scroll area ── */}
          <main className="flex-1 overflow-y-auto px-6 md:px-10 py-7 flex flex-col gap-6">
            {/* Page header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1
                className="text-white text-2xl font-bold"
                style={{ fontFamily: "'Syne',sans-serif" }}
              >
                Settings
              </h1>
              <p
                className="text-[13px] mt-0.5"
                style={{ color: "rgba(255,255,255,0.38)" }}
              >
                Manage your account, security, and preferences
              </p>
            </motion.div>

            {/* ══ PROFILE ══════════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <SectionCard
                id="profile"
                title="Profile"
                icon={User}
                accent="#a78bfa"
              >
                {/* Avatar */}
                <AvatarPicker
                  name={profile.name}
                  color={avatarColor}
                  onColorChange={setAvatarColor}
                />

                <div
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    paddingTop: 20,
                  }}
                />

                {/* Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" hint={`${profile.name.length}/50`}>
                    <StyledInput
                      placeholder="Your full name"
                      value={profile.name}
                      maxLength={50}
                      onChange={(e) => setProfileField("name", e.target.value)}
                    />
                  </Field>
                  <Field label="Email" locked>
                    <StyledInput locked value={user?.email || ""} readOnly />
                  </Field>
                  <Field label="Organization">
                    <StyledInput
                      placeholder="Your company or institution"
                      value={profile.organization}
                      onChange={(e) =>
                        setProfileField("organization", e.target.value)
                      }
                    />
                  </Field>
                  <Field label="Phone Number">
                    <StyledInput
                      placeholder="+1 234 567 8900"
                      value={profile.phoneNumber}
                      onChange={(e) =>
                        setProfileField("phoneNumber", e.target.value)
                      }
                    />
                  </Field>
                </div>

                {/* Read-only meta */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div
                    className="rounded-xl p-3"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: "rgba(255,255,255,0.25)" }}
                    >
                      Role
                    </p>
                    <p
                      className="text-[13px] font-semibold capitalize"
                      style={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      {user?.role === "admin" ? "System Admin" : "Event Admin"}
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-3"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: "rgba(255,255,255,0.25)" }}
                    >
                      Last Login
                    </p>
                    <p
                      className="text-[13px] font-semibold"
                      style={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      {lastLoginStr}
                    </p>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleSaveProfile}
                    disabled={!profileDirty || profileLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
                    style={
                      profileDirty
                        ? {
                            background:
                              "linear-gradient(135deg,#7c3aed,#6d28d9)",
                            border: "1px solid rgba(167,139,250,0.25)",
                            boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
                          }
                        : {
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "rgba(255,255,255,0.3)",
                            cursor: "not-allowed",
                          }
                    }
                  >
                    {profileLoading ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    {profileLoading ? "Saving…" : "Save Profile"}
                  </button>
                </div>
              </SectionCard>
            </motion.div>

            {/* ══ SECURITY ═════════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <SectionCard
                id="security"
                title="Security"
                icon={Lock}
                accent="#60a5fa"
              >
                {/* Password strength hint */}
                <div
                  className="p-3.5 rounded-xl text-[12px]"
                  style={{
                    background: "rgba(96,165,250,0.06)",
                    border: "1px solid rgba(96,165,250,0.15)",
                    color: "#93c5fd",
                  }}
                >
                  Use at least 6 characters. A mix of uppercase, lowercase,
                  numbers, and symbols makes your password stronger.
                </div>

                <div className="flex flex-col gap-3">
                  <Field
                    label="Current Password"
                    error={pwErrors.currentPassword}
                  >
                    <PasswordInput
                      placeholder="Enter current password"
                      value={pwForm.currentPassword}
                      onChange={(e) => {
                        setPwForm((f) => ({
                          ...f,
                          currentPassword: e.target.value,
                        }));
                        setPwErrors((e) => ({ ...e, currentPassword: "" }));
                      }}
                    />
                    {pwErrors.currentPassword && (
                      <p
                        className="text-[11.5px] flex items-center gap-1"
                        style={{ color: "#f87171" }}
                      >
                        <AlertCircle size={11} /> {pwErrors.currentPassword}
                      </p>
                    )}
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="New Password">
                      <PasswordInput
                        placeholder="New password"
                        value={pwForm.newPassword}
                        onChange={(e) => {
                          setPwForm((f) => ({
                            ...f,
                            newPassword: e.target.value,
                          }));
                          setPwErrors((e) => ({ ...e, newPassword: "" }));
                        }}
                      />
                      {pwErrors.newPassword && (
                        <p
                          className="text-[11.5px] flex items-center gap-1"
                          style={{ color: "#f87171" }}
                        >
                          <AlertCircle size={11} /> {pwErrors.newPassword}
                        </p>
                      )}
                      {/* Strength bar */}
                      {pwForm.newPassword &&
                        (() => {
                          const len = pwForm.newPassword.length;
                          const strong =
                            len >= 10 &&
                            /[A-Z]/.test(pwForm.newPassword) &&
                            /[0-9]/.test(pwForm.newPassword);
                          const medium = len >= 6;
                          const pct = strong ? 100 : medium ? 55 : 25;
                          const color = strong
                            ? "#34d399"
                            : medium
                              ? "#fbbf24"
                              : "#f87171";
                          const label = strong
                            ? "Strong"
                            : medium
                              ? "Medium"
                              : "Weak";
                          return (
                            <div className="mt-1">
                              <div
                                className="h-1 rounded-full"
                                style={{ background: "rgba(255,255,255,0.07)" }}
                              >
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${pct}%`,
                                    background: color,
                                  }}
                                />
                              </div>
                              <p
                                className="text-[10.5px] mt-1"
                                style={{ color }}
                              >
                                {label}
                              </p>
                            </div>
                          );
                        })()}
                    </Field>
                    <Field label="Confirm New Password">
                      <PasswordInput
                        placeholder="Confirm new password"
                        value={pwForm.confirmPassword}
                        onChange={(e) => {
                          setPwForm((f) => ({
                            ...f,
                            confirmPassword: e.target.value,
                          }));
                          setPwErrors((e) => ({ ...e, confirmPassword: "" }));
                        }}
                      />
                      {pwErrors.confirmPassword && (
                        <p
                          className="text-[11.5px] flex items-center gap-1"
                          style={{ color: "#f87171" }}
                        >
                          <AlertCircle size={11} /> {pwErrors.confirmPassword}
                        </p>
                      )}
                    </Field>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleChangePassword}
                    disabled={pwLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
                    style={{
                      background: "rgba(96,165,250,0.2)",
                      border: "1px solid rgba(96,165,250,0.3)",
                      cursor: pwLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {pwLoading ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    ) : (
                      <Lock size={13} />
                    )}
                    {pwLoading ? "Changing…" : "Change Password"}
                  </button>
                </div>
              </SectionCard>
            </motion.div>

            {/* ══ NOTIFICATIONS ════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <SectionCard
                id="notifications"
                title="Notifications"
                icon={Bell}
                accent="#fbbf24"
              >
                <p
                  className="text-[12.5px]"
                  style={{ color: "rgba(255,255,255,0.38)" }}
                >
                  Preferences are saved locally. Email delivery depends on your
                  backend configuration.
                </p>
                <div className="-mb-3">
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mb-2"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  >
                    Registrations
                  </p>
                  <Toggle
                    checked={notifs.regApproved}
                    onChange={(v) => setNotif("regApproved", v)}
                    label="Registration Approved"
                    desc="When the event admin approves your stall registration"
                  />
                  <Toggle
                    checked={notifs.regRejected}
                    onChange={(v) => setNotif("regRejected", v)}
                    label="Registration Rejected"
                    desc="When your registration is rejected with a reason"
                  />
                </div>
                <div className="-mb-3 mt-2">
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mb-2"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  >
                    Events
                  </p>
                  <Toggle
                    checked={notifs.eventApproved}
                    onChange={(v) => setNotif("eventApproved", v)}
                    label="Event Approved"
                    desc="When the system admin approves your submitted event"
                  />
                  <Toggle
                    checked={notifs.eventRejected}
                    onChange={(v) => setNotif("eventRejected", v)}
                    label="Event Rejected"
                    desc="When your event submission is rejected with feedback"
                  />
                  <Toggle
                    checked={notifs.reminders}
                    onChange={(v) => setNotif("reminders", v)}
                    label="Event Reminders"
                    desc="Get reminded before events you're registered for"
                  />
                </div>
                <div className="mt-2">
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mb-2"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  >
                    General
                  </p>
                  <Toggle
                    checked={notifs.newsletter}
                    onChange={(v) => setNotif("newsletter", v)}
                    label="Platform Updates"
                    desc="News about new features and improvements"
                  />
                </div>
              </SectionCard>
            </motion.div>

            {/* ══ PREFERENCES ══════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SectionCard
                id="preferences"
                title="Preferences"
                icon={Sliders}
                accent="#34d399"
              >
                <p
                  className="text-[12.5px]"
                  style={{ color: "rgba(255,255,255,0.38)" }}
                >
                  These are saved in your browser and applied across the app.
                </p>

                {/* Default view mode */}
                <div>
                  <p
                    className="text-[12px] font-semibold uppercase tracking-wide mb-3"
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      letterSpacing: "0.07em",
                    }}
                  >
                    Default View Mode
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        value: "grid",
                        label: "Grid View",
                        desc: "Cards in a grid layout",
                      },
                      {
                        value: "list",
                        label: "List View",
                        desc: "Compact rows",
                      },
                    ].map(({ value, label, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPref("defaultViewMode", value)}
                        className="flex flex-col gap-1 p-4 rounded-xl text-left transition-all"
                        style={
                          prefs.defaultViewMode === value
                            ? {
                                background: "rgba(52,211,153,0.12)",
                                border: "1px solid rgba(52,211,153,0.3)",
                              }
                            : {
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.08)",
                              }
                        }
                      >
                        <p
                          className="text-[13px] font-semibold"
                          style={{
                            color:
                              prefs.defaultViewMode === value
                                ? "#6ee7b7"
                                : "rgba(255,255,255,0.6)",
                          }}
                        >
                          {label}
                        </p>
                        <p
                          className="text-[11px]"
                          style={{ color: "rgba(255,255,255,0.28)" }}
                        >
                          {desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Default event type */}
                <div>
                  <p
                    className="text-[12px] font-semibold uppercase tracking-wide mb-3"
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      letterSpacing: "0.07em",
                    }}
                  >
                    Default Event Type (when creating)
                  </p>
                  <div className="relative">
                    <select
                      value={prefs.defaultEventType}
                      onChange={(e) =>
                        setPref("defaultEventType", e.target.value)
                      }
                      style={{
                        ...inputBase,
                        paddingRight: 36,
                        appearance: "none",
                        cursor: "pointer",
                      }}
                    >
                      {[
                        "conference",
                        "exhibition",
                        "fair",
                        "workshop",
                        "seminar",
                        "other",
                      ].map((t) => (
                        <option key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                      ))}
                    </select>
                    <ChevronRight
                      size={13}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none rotate-90"
                      style={{ color: "rgba(255,255,255,0.25)" }}
                    />
                  </div>
                </div>

                {/* Compact sidebar */}
                <Toggle
                  checked={prefs.compactSidebar}
                  onChange={(v) => setPref("compactSidebar", v)}
                  label="Compact Sidebar by Default"
                  desc="Start with the sidebar collapsed on every page load"
                />
              </SectionCard>
            </motion.div>

            {/* ══ DANGER ZONE ══════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div
                id="danger"
                className="rounded-2xl overflow-hidden scroll-mt-24"
                style={{
                  background: "rgba(239,68,68,0.04)",
                  border: "1px solid rgba(239,68,68,0.18)",
                }}
              >
                <div
                  className="flex items-center gap-3 px-6 py-4"
                  style={{ borderBottom: "1px solid rgba(239,68,68,0.12)" }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: "rgba(239,68,68,0.12)",
                      border: "1px solid rgba(239,68,68,0.25)",
                    }}
                  >
                    <Trash2 size={16} style={{ color: "#f87171" }} />
                  </div>
                  <h2
                    className="text-white font-bold text-[15px]"
                    style={{ fontFamily: "'Syne',sans-serif" }}
                  >
                    Danger Zone
                  </h2>
                </div>
                <div className="p-6 flex flex-col gap-4">
                  {/* Sign out all devices */}
                  <div
                    className="flex items-center justify-between gap-4 p-4 rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <div>
                      <p className="text-white font-semibold text-[13.5px]">
                        Sign out
                      </p>
                      <p
                        className="text-[12px] mt-0.5"
                        style={{ color: "rgba(255,255,255,0.38)" }}
                      >
                        End your current session and return to login
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await logout?.();
                        } catch {}
                        navigate("/login");
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-semibold flex-shrink-0 transition-all"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.6)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.1)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.06)")
                      }
                    >
                      <LogOut size={13} /> Sign Out
                    </button>
                  </div>

                  {/* Delete account */}
                  <div
                    className="flex items-center justify-between gap-4 p-4 rounded-xl"
                    style={{
                      background: "rgba(239,68,68,0.06)",
                      border: "1px solid rgba(239,68,68,0.18)",
                    }}
                  >
                    <div>
                      <p className="text-white font-semibold text-[13.5px]">
                        Delete Account
                      </p>
                      <p
                        className="text-[12px] mt-0.5"
                        style={{ color: "rgba(255,255,255,0.38)" }}
                      >
                        Permanently delete your account, events, registrations
                        and stalls. This cannot be undone.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-semibold flex-shrink-0 transition-all"
                      style={{
                        background: "rgba(239,68,68,0.15)",
                        color: "#fca5a5",
                        border: "1px solid rgba(239,68,68,0.3)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(239,68,68,0.25)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(239,68,68,0.15)")
                      }
                    >
                      <Trash2 size={13} /> Delete Account
                    </button>
                  </div>

                  <div
                    className="p-3.5 rounded-xl text-[12px]"
                    style={{
                      background: "rgba(251,191,36,0.06)",
                      border: "1px solid rgba(251,191,36,0.15)",
                      color: "#fde68a",
                    }}
                  >
                    ⚠️ Account deletion is not yet available via API. Please
                    contact support to request account removal.
                  </div>
                </div>
              </div>
            </motion.div>
          </main>
        </div>
      </div>

      {/* ── Delete confirmation modal ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <ConfirmModal
            title="Delete Account"
            desc="This action is permanent and irreversible"
            confirmLabel="Delete My Account"
            accentColor="#f87171"
            onConfirm={() => {
              // No backend endpoint — show info toast
              setShowDeleteModal(false);
              setDeleteConfirmText("");
              showToast("Contact support to delete your account", "error");
            }}
            onCancel={() => {
              setShowDeleteModal(false);
              setDeleteConfirmText("");
            }}
            loading={false}
          >
            <div className="flex flex-col gap-3">
              <div
                className="p-3.5 rounded-xl text-[12.5px]"
                style={{
                  background: "rgba(239,68,68,0.07)",
                  border: "1px solid rgba(239,68,68,0.18)",
                  color: "#fca5a5",
                }}
              >
                Deleting your account will permanently remove all your events,
                registrations, and stalls.
              </div>
              <div>
                <p
                  className="text-[12px] mb-1.5"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  Type <strong style={{ color: "white" }}>DELETE</strong> to
                  confirm
                </p>
                <input
                  type="text"
                  placeholder="DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  style={{
                    ...inputBase,
                    borderColor:
                      deleteConfirmText === "DELETE"
                        ? "rgba(248,113,113,0.5)"
                        : "rgba(255,255,255,0.1)",
                  }}
                />
              </div>
            </div>
          </ConfirmModal>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <Toast
            key={toast.message + Date.now()}
            {...toast}
            onDone={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
