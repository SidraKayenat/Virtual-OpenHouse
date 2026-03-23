import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Users,
  Wrench,
  ChevronRight,
  Save,
  X,
  Plus,
  Trash2,
  Info,
  ShieldAlert,
  Lock,
} from "lucide-react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { registrationAPI } from "@/lib/api";

// ─── Constants ────────────────────────────────────────────────────────────
const CATEGORIES = ["technology", "business", "art", "science", "other"];
const ROLES = ["lead", "developer", "designer", "manager", "other"];

const CATEGORY_COLORS = {
  technology: "#60a5fa",
  business: "#34d399",
  art: "#f472b6",
  science: "#a78bfa",
  other: "#fb923c",
};

const STEPS = [
  {
    id: 0,
    label: "Project Info",
    icon: Briefcase,
    desc: "Title, description & category",
  },
  { id: 1, label: "Team Members", icon: Users, desc: "Edit your team" },
  { id: 2, label: "Requirements", icon: Wrench, desc: "Special stall needs" },
  { id: 3, label: "Review", icon: CheckCircle, desc: "Review & save changes" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

function getDiff(original, current) {
  const LABELS = {
    projectTitle: "Project Title",
    projectDescription: "Description",
    category: "Category",
    requirements: "Requirements",
  };
  const changes = [];
  Object.keys(LABELS).forEach((k) => {
    if (String(original[k] || "") !== String(current[k] || ""))
      changes.push({
        field: LABELS[k],
        from: original[k] || "—",
        to: current[k] || "—",
      });
  });
  const origTeam = JSON.stringify(original.teamMembers || []);
  const currTeam = JSON.stringify(current.teamMembers || []);
  if (origTeam !== currTeam)
    changes.push({
      field: "Team Members",
      from: `${(original.teamMembers || []).length} member(s)`,
      to: `${(current.teamMembers || []).length} member(s)`,
    });
  return changes;
}

// ─── Styled primitives ────────────────────────────────────────────────────
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

function Field({ label, required, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label
          className="text-[12px] font-semibold uppercase tracking-wide"
          style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.07em" }}
        >
          {label}
          {required && <span style={{ color: "#f87171" }}> *</span>}
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
      {error && (
        <p
          className="text-[11.5px] flex items-center gap-1"
          style={{ color: "#f87171" }}
        >
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

function StyledInput({ icon: Icon, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      {Icon && (
        <Icon
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            color: focused ? "#a78bfa" : "rgba(255,255,255,0.25)",
            transition: "color 0.18s",
          }}
        />
      )}
      <input
        {...props}
        style={{
          ...inputBase,
          paddingLeft: Icon ? 38 : 14,
          borderColor: focused
            ? "rgba(167,139,250,0.5)"
            : "rgba(255,255,255,0.1)",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
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
        minHeight: 100,
        borderColor: focused
          ? "rgba(167,139,250,0.5)"
          : "rgba(255,255,255,0.1)",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

// ─── Step nav ─────────────────────────────────────────────────────────────
function StepNav({ currentStep, completedSteps, onGoTo }) {
  return (
    <div className="flex flex-col gap-1">
      {STEPS.map((step) => {
        const done = completedSteps.includes(step.id);
        const active = currentStep === step.id;
        const Icon = step.icon;
        return (
          <button
            key={step.id}
            onClick={() => (done || step.id <= currentStep) && onGoTo(step.id)}
            disabled={step.id > currentStep && !done}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150"
            style={{
              background: active ? "rgba(124,58,237,0.18)" : "transparent",
              border: active
                ? "1px solid rgba(124,58,237,0.3)"
                : "1px solid transparent",
              cursor:
                done || step.id <= currentStep ? "pointer" : "not-allowed",
              opacity: step.id > currentStep && !done ? 0.4 : 1,
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={
                done
                  ? {
                      background: "rgba(52,211,153,0.2)",
                      border: "1px solid rgba(52,211,153,0.4)",
                      color: "#34d399",
                    }
                  : active
                    ? {
                        background: "rgba(124,58,237,0.35)",
                        border: "1px solid rgba(167,139,250,0.5)",
                        color: "#c4b5fd",
                      }
                    : {
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.3)",
                      }
              }
            >
              {done ? <CheckCircle size={13} /> : <Icon size={13} />}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[12.5px] font-semibold leading-tight"
                style={{
                  color: active
                    ? "#c4b5fd"
                    : done
                      ? "#6ee7b7"
                      : "rgba(255,255,255,0.45)",
                }}
              >
                {step.label}
              </p>
              <p
                className="text-[10.5px] truncate"
                style={{ color: "rgba(255,255,255,0.22)" }}
              >
                {step.desc}
              </p>
            </div>
          </button>
        );
      })}
      <div className="mt-4 px-1">
        <div
          className="h-1 rounded-full"
          style={{ background: "rgba(255,255,255,0.07)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(completedSteps.length / STEPS.length) * 100}%`,
              background: "linear-gradient(90deg,#7c3aed,#a78bfa)",
            }}
          />
        </div>
        <p
          className="text-[10px] mt-1.5 text-right"
          style={{ color: "rgba(255,255,255,0.22)" }}
        >
          {Math.round((completedSteps.length / STEPS.length) * 100)}% complete
        </p>
      </div>
    </div>
  );
}

// ─── Preview panel ────────────────────────────────────────────────────────
function RegistrationPreview({ registration, form }) {
  const event = registration?.event || {};
  const catColor = CATEGORY_COLORS[form.category] || "#a78bfa";
  return (
    <div
      className="rounded-2xl overflow-hidden sticky top-6"
      style={{
        background: "#141320",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="relative h-28 overflow-hidden"
        style={{ background: "linear-gradient(135deg,#1e1b30,#2d1f5e)" }}
      >
        {event.thumbnailUrl && (
          <img
            src={event.thumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top,#141320,transparent 55%)",
          }}
        />
        <span
          className="absolute top-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(251,191,36,0.22)",
            color: "#fbbf24",
            border: "1px solid rgba(251,191,36,0.3)",
            backdropFilter: "blur(6px)",
          }}
        >
          Pending
        </span>
      </div>
      <div className="p-4 flex flex-col gap-3">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            Event
          </p>
          <p
            className="text-white font-bold text-[13px] leading-snug"
            style={{ fontFamily: "'Syne',sans-serif" }}
          >
            {event.name || "—"}
          </p>
          {event.liveDate && (
            <p
              className="text-[11px] mt-0.5"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              📅 {fmt(event.liveDate)}
            </p>
          )}
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: 12,
          }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            Your Project
          </p>
          {form.projectTitle ? (
            <p className="text-white font-semibold text-[13px] line-clamp-1">
              {form.projectTitle}
            </p>
          ) : (
            <p
              className="text-[12px]"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              No title yet…
            </p>
          )}
          {form.category && (
            <span
              className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
              style={{
                background: `${catColor}18`,
                color: catColor,
                border: `1px solid ${catColor}30`,
              }}
            >
              {form.category}
            </span>
          )}
          {form.projectDescription && (
            <p
              className="text-[11px] mt-2 line-clamp-3 leading-relaxed"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              {form.projectDescription}
            </p>
          )}
          {form.teamMembers.length > 0 && (
            <p
              className="flex items-center gap-1.5 text-[11px] mt-2"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              <Users size={10} /> {form.teamMembers.length} member
              {form.teamMembers.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Confirm modal ────────────────────────────────────────────────────────
function ConfirmModal({ changes, onConfirm, onCancel, loading }) {
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
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
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
              background: "rgba(251,191,36,0.12)",
              border: "1px solid rgba(251,191,36,0.25)",
            }}
          >
            <ShieldAlert size={18} style={{ color: "#fbbf24" }} />
          </div>
          <div>
            <h3
              className="text-white font-bold text-[15px]"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              Save Changes?
            </h3>
            <p
              className="text-[12px]"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Review your modifications before saving
            </p>
          </div>
        </div>

        {changes.length > 0 && (
          <div
            className="rounded-xl p-4 flex flex-col gap-3"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <p
              className="text-[10.5px] font-bold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              Modified fields
            </p>
            {changes.map(({ field, from, to }) => (
              <div key={field} className="flex flex-col gap-0.5">
                <p
                  className="text-[12px] font-semibold"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  {field}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[11px] px-2 py-0.5 rounded line-through truncate max-w-[130px]"
                    style={{
                      background: "rgba(248,113,113,0.1)",
                      color: "#f87171",
                    }}
                  >
                    {String(from).length > 40
                      ? String(from).slice(0, 40) + "…"
                      : from}
                  </span>
                  <ChevronRight
                    size={11}
                    style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }}
                  />
                  <span
                    className="text-[11px] px-2 py-0.5 rounded truncate max-w-[130px]"
                    style={{
                      background: "rgba(52,211,153,0.1)",
                      color: "#34d399",
                    }}
                  >
                    {String(to).length > 40
                      ? String(to).slice(0, 40) + "…"
                      : to}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <p
          className="text-[12.5px]"
          style={{ color: "rgba(255,255,255,0.38)" }}
        >
          Only <strong style={{ color: "white" }}>pending</strong> registrations
          can be updated. Once the event admin reviews it, changes will no
          longer be possible.
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
            Go back
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white"
            style={{
              background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
              border: "1px solid rgba(167,139,250,0.25)",
              boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />{" "}
                Saving…
              </>
            ) : (
              <>
                <Save size={14} /> Confirm Save
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────
function validateStep(step, form) {
  const errs = {};
  if (step === 0) {
    if (!form.projectTitle.trim())
      errs.projectTitle = "Project title is required";
    if (form.projectTitle.length > 200)
      errs.projectTitle = "Max 200 characters";
    if (!form.projectDescription.trim())
      errs.projectDescription = "Description is required";
    if (form.projectDescription.length > 1000)
      errs.projectDescription = "Max 1000 characters";
    if (!form.category) errs.category = "Select a category";
  }
  if (step === 2) {
    if (form.requirements.length > 500)
      errs.requirements = "Max 500 characters";
  }
  return errs;
}

// ─── Main component ───────────────────────────────────────────────────────
export default function UpdateRegistration() {
  const { registrationId } = useParams();
  const navigate = useNavigate();

  const [registration, setRegistration] = useState(null);
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [step, setStep] = useState(0);
  const [done, setDone] = useState([]);
  const [errors, setErrors] = useState({});

  const [form, setFormState] = useState({
    projectTitle: "",
    projectDescription: "",
    category: "other",
    teamMembers: [],
    requirements: "",
  });

  const [memberInput, setMemberInput] = useState({ name: "", role: "other" });
  const [memberError, setMemberError] = useState("");

  const setForm = (updater) =>
    setFormState((prev) =>
      typeof updater === "function" ? updater(prev) : { ...prev, ...updater },
    );
  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // ── Load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await registrationAPI.getById(registrationId);
        const reg = res.data;

        if (reg.status !== "pending") {
          setError(
            `This registration is "${reg.status}" and can no longer be edited.`,
          );
          setLoading(false);
          return;
        }

        setRegistration(reg);
        const info = reg.participantInfo || {};
        const mapped = {
          projectTitle: info.projectTitle || "",
          projectDescription: info.projectDescription || "",
          category: info.category || "other",
          teamMembers: (info.teamMembers || []).map((m) => ({
            name: m.name || "",
            role: m.role || "other",
          })),
          requirements: info.requirements || "",
        };
        setFormState(mapped);
        setOriginal(JSON.parse(JSON.stringify(mapped)));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [registrationId]);

  // ── Team ──────────────────────────────────────────────────────────────
  const addMember = () => {
    if (!memberInput.name.trim()) {
      setMemberError("Enter a member name");
      return;
    }
    if (form.teamMembers.length >= 10) {
      setMemberError("Max 10 members");
      return;
    }
    setField("teamMembers", [
      ...form.teamMembers,
      { name: memberInput.name.trim(), role: memberInput.role },
    ]);
    setMemberInput({ name: "", role: "other" });
    setMemberError("");
  };
  const removeMember = (i) =>
    setField(
      "teamMembers",
      form.teamMembers.filter((_, idx) => idx !== i),
    );
  const updateMember = (i, key, val) =>
    setField(
      "teamMembers",
      form.teamMembers.map((m, idx) => (idx === i ? { ...m, [key]: val } : m)),
    );

  // ── Navigation ────────────────────────────────────────────────────────
  const goToStep = (n) => {
    setStep(n);
    setErrors({});
  };
  const nextStep = () => {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    if (!done.includes(step)) setDone((d) => [...d, step]);
    setErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const prevStep = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  // ── Save ──────────────────────────────────────────────────────────────
  const diff = original ? getDiff(original, form) : [];
  const isDirty = diff.length > 0;

  const handleSave = async () => {
    try {
      setSaving(true);
      await registrationAPI.update(registrationId, {
        participantInfo: {
          projectTitle: form.projectTitle,
          projectDescription: form.projectDescription,
          category: form.category,
          teamMembers: form.teamMembers,
          requirements: form.requirements,
        },
      });
      setOriginal(JSON.parse(JSON.stringify(form)));
      setShowConfirm(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to save");
      setShowConfirm(false);
    } finally {
      setSaving(false);
    }
  };

  const fadeUp = {
    initial: { opacity: 0, y: 14 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
    },
    exit: { opacity: 0, y: -10, transition: { duration: 0.18 } },
  };

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex" style={{ background: "#0c0c0f" }}>
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

  // ── Not-pending guard ─────────────────────────────────────────────────
  if (error && !registration) {
    return (
      <div
        className="min-h-screen flex"
        style={{
          background: "#0c0c0f",
          fontFamily: "'DM Sans','Segoe UI',sans-serif",
        }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&family=Syne:wght@700;800&display=swap');`}</style>
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="max-w-sm w-full text-center flex flex-col items-center gap-5 p-8 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: "rgba(248,113,113,0.1)",
                  border: "1px solid rgba(248,113,113,0.2)",
                }}
              >
                <Lock size={22} style={{ color: "#f87171" }} />
              </div>
              <div>
                <h2
                  className="text-white font-bold text-[17px] mb-1"
                  style={{ fontFamily: "'Syne',sans-serif" }}
                >
                  Cannot Edit Registration
                </h2>
                <p
                  className="text-[13px]"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  {error}
                </p>
              </div>
              <div
                className="p-3.5 w-full rounded-xl text-[12px]"
                style={{
                  background: "rgba(251,191,36,0.07)",
                  border: "1px solid rgba(251,191,36,0.15)",
                  color: "#fde68a",
                }}
              >
                Only registrations with <strong>Pending</strong> status can be
                edited. Once reviewed by the admin, edits are locked.
              </div>
              <button
                onClick={() => navigate(-1)}
                className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                  border: "1px solid rgba(167,139,250,0.25)",
                }}
              >
                Go Back
              </button>
            </motion.div>
          </main>
        </div>
      </div>
    );
  }

  // ─── Main render ─────────────────────────────────────────────────────
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
        select option { background: #1a1728; color: white; }
        ::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto px-6 md:px-8 py-7">
          {/* API error */}
          {error && registration && (
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
                  Update Registration
                </h1>
                <p
                  className="text-[12.5px]"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  Step {step + 1} of {STEPS.length} · {STEPS[step].label}
                </p>
              </div>
            </div>

            {/* Dirty indicator + save button */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <AnimatePresence>
                {isDirty && (
                  <motion.span
                    key="dirty"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[11.5px] font-medium px-3 py-1.5 rounded-full"
                    style={{
                      background: "rgba(251,191,36,0.1)",
                      color: "#fbbf24",
                      border: "1px solid rgba(251,191,36,0.2)",
                    }}
                  >
                    {diff.length} unsaved change{diff.length !== 1 ? "s" : ""}
                  </motion.span>
                )}
                {saveSuccess && (
                  <motion.span
                    key="saved"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[11.5px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5"
                    style={{
                      background: "rgba(52,211,153,0.1)",
                      color: "#34d399",
                      border: "1px solid rgba(52,211,153,0.2)",
                    }}
                  >
                    <CheckCircle size={12} /> Saved!
                  </motion.span>
                )}
              </AnimatePresence>
              <button
                onClick={() => isDirty && setShowConfirm(true)}
                disabled={!isDirty}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
                style={
                  isDirty
                    ? {
                        background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                        border: "1px solid rgba(167,139,250,0.25)",
                        boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
                        cursor: "pointer",
                      }
                    : {
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.3)",
                        cursor: "not-allowed",
                      }
                }
              >
                <Save size={14} /> Save Changes
              </button>
            </div>
          </motion.div>

          {/* Pending-only notice */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-5 flex items-center gap-3 p-3.5 rounded-xl text-[12.5px]"
            style={{
              background: "rgba(251,191,36,0.06)",
              border: "1px solid rgba(251,191,36,0.15)",
              color: "#fde68a",
            }}
          >
            <Info size={13} style={{ color: "#fbbf24", flexShrink: 0 }} />
            Only your <strong>project information</strong> can be changed. Once
            the admin reviews your registration, editing will be locked.
          </motion.div>

          {/* 3-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_220px] gap-6">
            {/* ── Left: step nav ── */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05, duration: 0.3 }}
            >
              <div
                className="rounded-2xl p-3 sticky top-6"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-3 px-1"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                >
                  Progress
                </p>
                <StepNav
                  currentStep={step}
                  completedSteps={done}
                  onGoTo={goToStep}
                />
              </div>
            </motion.div>

            {/* ── Center: form ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.3 }}
            >
              <div
                className="rounded-2xl p-6 min-h-[460px] flex flex-col"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {/* Step header */}
                <div
                  className="flex items-center gap-3 mb-6 pb-5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "rgba(124,58,237,0.2)",
                      border: "1px solid rgba(124,58,237,0.3)",
                    }}
                  >
                    {(() => {
                      const Icon = STEPS[step].icon;
                      return <Icon size={16} style={{ color: "#c4b5fd" }} />;
                    })()}
                  </div>
                  <div>
                    <h2
                      className="text-white font-bold text-[16px]"
                      style={{ fontFamily: "'Syne',sans-serif" }}
                    >
                      {STEPS[step].label}
                    </h2>
                    <p
                      className="text-[12px]"
                      style={{ color: "rgba(255,255,255,0.32)" }}
                    >
                      {STEPS[step].desc}
                    </p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    {...fadeUp}
                    className="flex-1 flex flex-col gap-5"
                  >
                    {/* STEP 0: Project Info */}
                    {step === 0 && (
                      <>
                        <Field
                          label="Project Title"
                          required
                          error={errors.projectTitle}
                          hint={`${form.projectTitle.length}/200`}
                        >
                          <StyledInput
                            icon={Briefcase}
                            type="text"
                            placeholder="e.g. EcoTrack Dashboard"
                            value={form.projectTitle}
                            maxLength={200}
                            onChange={(e) =>
                              setField("projectTitle", e.target.value)
                            }
                          />
                        </Field>
                        <Field
                          label="Project Description"
                          required
                          error={errors.projectDescription}
                          hint={`${form.projectDescription.length}/1000`}
                        >
                          <StyledTextarea
                            placeholder="Describe your project…"
                            value={form.projectDescription}
                            rows={5}
                            maxLength={1000}
                            onChange={(e) =>
                              setField("projectDescription", e.target.value)
                            }
                          />
                        </Field>
                        <Field
                          label="Category"
                          required
                          error={errors.category}
                        >
                          <div className="grid grid-cols-3 gap-2">
                            {CATEGORIES.map((cat) => {
                              const color = CATEGORY_COLORS[cat];
                              const selected = form.category === cat;
                              return (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => setField("category", cat)}
                                  className="py-2.5 px-3 rounded-xl text-[12px] font-medium capitalize transition-all"
                                  style={
                                    selected
                                      ? {
                                          background: `${color}20`,
                                          color,
                                          border: `1px solid ${color}45`,
                                        }
                                      : {
                                          background: "rgba(255,255,255,0.03)",
                                          color: "rgba(255,255,255,0.45)",
                                          border:
                                            "1px solid rgba(255,255,255,0.08)",
                                        }
                                  }
                                >
                                  {cat}
                                </button>
                              );
                            })}
                          </div>
                        </Field>
                      </>
                    )}

                    {/* STEP 1: Team */}
                    {step === 1 && (
                      <>
                        <Field
                          label="Add Team Member"
                          hint={`${form.teamMembers.length}/10`}
                        >
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Users
                                size={13}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                style={{ color: "rgba(255,255,255,0.25)" }}
                              />
                              <input
                                type="text"
                                placeholder="Member name"
                                value={memberInput.name}
                                onChange={(e) => {
                                  setMemberInput((m) => ({
                                    ...m,
                                    name: e.target.value,
                                  }));
                                  setMemberError("");
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addMember();
                                  }
                                }}
                                style={{ ...inputBase, paddingLeft: 38 }}
                                onFocus={(e) =>
                                  (e.target.style.borderColor =
                                    "rgba(167,139,250,0.5)")
                                }
                                onBlur={(e) =>
                                  (e.target.style.borderColor =
                                    "rgba(255,255,255,0.1)")
                                }
                              />
                            </div>
                            <div className="relative w-32 flex-shrink-0">
                              <select
                                value={memberInput.role}
                                onChange={(e) =>
                                  setMemberInput((m) => ({
                                    ...m,
                                    role: e.target.value,
                                  }))
                                }
                                style={{
                                  ...inputBase,
                                  paddingRight: 28,
                                  appearance: "none",
                                  cursor: "pointer",
                                }}
                              >
                                {ROLES.map((r) => (
                                  <option key={r} value={r}>
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                  </option>
                                ))}
                              </select>
                              <ChevronRight
                                size={12}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none rotate-90"
                                style={{ color: "rgba(255,255,255,0.25)" }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={addMember}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-semibold flex-shrink-0 transition-all"
                              style={{
                                background: "rgba(124,58,237,0.2)",
                                color: "#c4b5fd",
                                border: "1px solid rgba(124,58,237,0.3)",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(124,58,237,0.32)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(124,58,237,0.2)")
                              }
                            >
                              <Plus size={13} /> Add
                            </button>
                          </div>
                          {memberError && (
                            <p
                              className="text-[11.5px] mt-1"
                              style={{ color: "#f87171" }}
                            >
                              {memberError}
                            </p>
                          )}
                        </Field>

                        {form.teamMembers.length === 0 ? (
                          <div
                            className="flex flex-col items-center justify-center py-10 gap-2 rounded-xl"
                            style={{
                              background: "rgba(255,255,255,0.02)",
                              border: "2px dashed rgba(255,255,255,0.07)",
                            }}
                          >
                            <Users
                              size={24}
                              style={{ color: "rgba(255,255,255,0.1)" }}
                            />
                            <p
                              className="text-[12.5px]"
                              style={{ color: "rgba(255,255,255,0.25)" }}
                            >
                              No team members added
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {form.teamMembers.map((m, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-3 p-3 rounded-xl"
                                style={{
                                  background: "rgba(124,58,237,0.08)",
                                  border: "1px solid rgba(124,58,237,0.18)",
                                }}
                              >
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
                                  style={{
                                    background:
                                      "linear-gradient(135deg,#7c3aed,#2563eb)",
                                  }}
                                >
                                  {m.name?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                                <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
                                  <input
                                    value={m.name}
                                    placeholder="Name"
                                    onChange={(e) =>
                                      updateMember(i, "name", e.target.value)
                                    }
                                    style={{
                                      ...inputBase,
                                      padding: "7px 12px",
                                      fontSize: 12.5,
                                    }}
                                    onFocus={(e) =>
                                      (e.target.style.borderColor =
                                        "rgba(167,139,250,0.5)")
                                    }
                                    onBlur={(e) =>
                                      (e.target.style.borderColor =
                                        "rgba(255,255,255,0.1)")
                                    }
                                  />
                                  <div className="relative">
                                    <select
                                      value={m.role}
                                      onChange={(e) =>
                                        updateMember(i, "role", e.target.value)
                                      }
                                      style={{
                                        ...inputBase,
                                        padding: "7px 28px 7px 12px",
                                        fontSize: 12.5,
                                        appearance: "none",
                                        cursor: "pointer",
                                      }}
                                    >
                                      {ROLES.map((r) => (
                                        <option key={r} value={r}>
                                          {r.charAt(0).toUpperCase() +
                                            r.slice(1)}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronRight
                                      size={12}
                                      className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none rotate-90"
                                      style={{
                                        color: "rgba(255,255,255,0.25)",
                                      }}
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeMember(i)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                                  style={{ color: "rgba(248,113,113,0.5)" }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background =
                                      "rgba(248,113,113,0.12)";
                                    e.currentTarget.style.color = "#f87171";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                      "transparent";
                                    e.currentTarget.style.color =
                                      "rgba(248,113,113,0.5)";
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {/* STEP 2: Requirements */}
                    {step === 2 && (
                      <>
                        <Field
                          label="Special Requirements"
                          hint="Optional · max 500 chars"
                          error={errors.requirements}
                        >
                          <StyledTextarea
                            placeholder="Update any special stall requirements — power, equipment, space, setup time…"
                            value={form.requirements}
                            rows={5}
                            maxLength={500}
                            onChange={(e) =>
                              setField("requirements", e.target.value)
                            }
                          />
                        </Field>
                        <div
                          className="p-3.5 rounded-xl text-[12px]"
                          style={{
                            background: "rgba(96,165,250,0.06)",
                            border: "1px solid rgba(96,165,250,0.15)",
                            color: "#93c5fd",
                          }}
                        >
                          <Info size={13} className="inline mr-1.5 mb-0.5" />
                          Leave blank if you have no special requirements.
                        </div>
                      </>
                    )}

                    {/* STEP 3: Review */}
                    {step === 3 && (
                      <>
                        {/* Summary */}
                        <div
                          className="rounded-xl p-4 flex flex-col gap-3"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.07)",
                          }}
                        >
                          <p
                            className="text-[10.5px] font-bold uppercase tracking-widest"
                            style={{ color: "rgba(255,255,255,0.25)" }}
                          >
                            Registration Summary
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              ["Project Title", form.projectTitle || "—"],
                              ["Category", form.category || "—"],
                              [
                                "Team Size",
                                form.teamMembers.length === 0
                                  ? "Solo"
                                  : `${form.teamMembers.length} member(s)`,
                              ],
                              [
                                "Special Needs",
                                form.requirements ? "Yes" : "None",
                              ],
                              ["Event", registration?.event?.name || "—"],
                              ["Status", "Pending"],
                            ].map(([k, v]) => (
                              <div key={k} className="flex flex-col gap-0.5">
                                <span
                                  className="text-[10.5px]"
                                  style={{ color: "rgba(255,255,255,0.28)" }}
                                >
                                  {k}
                                </span>
                                <span
                                  className="text-[13px] font-semibold capitalize truncate"
                                  style={{ color: "rgba(255,255,255,0.8)" }}
                                >
                                  {v}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Diff */}
                        {isDirty ? (
                          <div
                            className="rounded-xl p-4 flex flex-col gap-2"
                            style={{
                              background: "rgba(251,191,36,0.06)",
                              border: "1px solid rgba(251,191,36,0.15)",
                            }}
                          >
                            <p
                              className="text-[10.5px] font-bold uppercase tracking-widest"
                              style={{ color: "rgba(251,191,36,0.6)" }}
                            >
                              Pending Changes ({diff.length})
                            </p>
                            {diff.map(({ field }) => (
                              <p
                                key={field}
                                className="text-[12px] flex items-center gap-2"
                                style={{ color: "#fde68a" }}
                              >
                                <span className="w-1 h-1 rounded-full bg-yellow-400 flex-shrink-0" />{" "}
                                {field} modified
                              </p>
                            ))}
                          </div>
                        ) : (
                          <div
                            className="p-4 rounded-xl"
                            style={{
                              background: "rgba(148,163,184,0.07)",
                              border: "1px solid rgba(148,163,184,0.15)",
                            }}
                          >
                            <p
                              className="text-[12.5px]"
                              style={{ color: "rgba(255,255,255,0.35)" }}
                            >
                              No changes made yet — edit the fields in the
                              previous steps.
                            </p>
                          </div>
                        )}

                        <div
                          className="p-3.5 rounded-xl text-[12px]"
                          style={{
                            background: "rgba(251,191,36,0.06)",
                            border: "1px solid rgba(251,191,36,0.15)",
                            color: "#fde68a",
                          }}
                        >
                          <Info size={13} className="inline mr-1.5 mb-0.5" />
                          Only <strong>pending</strong> registrations can be
                          updated. Once the admin reviews, editing is locked.
                        </div>

                        <button
                          type="button"
                          onClick={() => isDirty && setShowConfirm(true)}
                          disabled={!isDirty}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-bold text-white transition-all"
                          style={
                            isDirty
                              ? {
                                  background:
                                    "linear-gradient(135deg,#7c3aed,#6d28d9)",
                                  border: "1px solid rgba(167,139,250,0.25)",
                                  boxShadow: "0 6px 24px rgba(124,58,237,0.35)",
                                  cursor: "pointer",
                                }
                              : {
                                  background: "rgba(255,255,255,0.04)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  color: "rgba(255,255,255,0.25)",
                                  cursor: "not-allowed",
                                }
                          }
                        >
                          <Save size={15} />
                          {isDirty
                            ? "Review & Save Changes"
                            : "No Changes to Save"}
                        </button>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Nav buttons */}
                <div
                  className="flex items-center justify-between mt-6 pt-5"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <button
                    onClick={prevStep}
                    disabled={step === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                    style={
                      step === 0
                        ? {
                            opacity: 0.3,
                            cursor: "not-allowed",
                            color: "rgba(255,255,255,0.4)",
                            border: "1px solid rgba(255,255,255,0.07)",
                          }
                        : {
                            color: "rgba(255,255,255,0.6)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "rgba(255,255,255,0.04)",
                          }
                    }
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  {step < STEPS.length - 1 && (
                    <button
                      onClick={nextStep}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
                      style={{
                        background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                        border: "1px solid rgba(167,139,250,0.25)",
                        boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
                      }}
                    >
                      Continue <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ── Right: live preview ── */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-3"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                Registration Preview
              </p>
              <RegistrationPreview registration={registration} form={form} />
              <p
                className="text-[10.5px] text-center mt-3"
                style={{ color: "rgba(255,255,255,0.18)" }}
              >
                Updates as you edit
              </p>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {showConfirm && (
          <ConfirmModal
            changes={diff}
            onConfirm={handleSave}
            onCancel={() => setShowConfirm(false)}
            loading={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
