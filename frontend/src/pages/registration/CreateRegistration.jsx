import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Briefcase,
  Users,
  Wrench,
  Send,
  X,
  Plus,
  Hash,
  FileText,
  Tag,
  Info,
  Calendar,
  MapPin,
  Building,
  UserPlus,
  Trash2,
  Shield,
} from "lucide-react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { eventAPI, registrationAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ─── Constants ────────────────────────────────────────────────────────────
const CATEGORIES = ["technology", "business", "art", "science", "other"];
const ROLES = ["lead", "developer", "designer", "manager", "other"];

const STEPS = [
  {
    id: 0,
    label: "Project Info",
    icon: Briefcase,
    desc: "Title, description & category",
  },
  { id: 1, label: "Team Members", icon: Users, desc: "Add your team" },
  { id: 2, label: "Requirements", icon: Wrench, desc: "Special stall needs" },
  { id: 3, label: "Review", icon: Shield, desc: "Confirm & submit" },
];

const CATEGORY_COLORS = {
  technology: "#60a5fa",
  business: "#34d399",
  art: "#f472b6",
  science: "#a78bfa",
  other: "#fb923c",
};

// ─── Styled input system ──────────────────────────────────────────────────
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
          className="text-[12px] font-semibold tracking-wide"
          style={{
            color: "rgba(255,255,255,0.5)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          {label}
          {required && <span style={{ color: "#f87171" }}> *</span>}
        </label>
        {hint && (
          <span
            className="text-[11px]"
            style={{ color: "rgba(255,255,255,0.25)" }}
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

function StyledSelect({ icon: Icon, children, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      {Icon && (
        <Icon
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: focused ? "#a78bfa" : "rgba(255,255,255,0.25)" }}
        />
      )}
      <select
        {...props}
        style={{
          ...inputBase,
          paddingLeft: Icon ? 38 : 14,
          paddingRight: 36,
          appearance: "none",
          cursor: "pointer",
          borderColor: focused
            ? "rgba(167,139,250,0.5)"
            : "rgba(255,255,255,0.1)",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        {children}
      </select>
      <ChevronRight
        size={13}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none rotate-90"
        style={{ color: "rgba(255,255,255,0.25)" }}
      />
    </div>
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

      {/* Progress bar */}
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

// ─── Event summary card (right panel) ────────────────────────────────────
function EventSummaryCard({ event, formData }) {
  const catColor = CATEGORY_COLORS[formData.category] || "#a78bfa";
  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";
  const fillPct = event
    ? Math.round(
        ((event.numberOfStalls - event.availableStalls) /
          (event.numberOfStalls || 1)) *
          100,
      )
    : 0;

  return (
    <div
      className="rounded-2xl overflow-hidden sticky top-6"
      style={{
        background: "#141320",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Event thumb */}
      <div
        className="relative h-32 overflow-hidden"
        style={{ background: "linear-gradient(135deg,#1e1b30,#2d1f5e)" }}
      >
        {event?.thumbnailUrl && (
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
          className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{
            background: "rgba(10,10,20,0.6)",
            color: "#93c5fd",
            border: "1px solid rgba(96,165,250,0.2)",
            backdropFilter: "blur(8px)",
          }}
        >
          {event?.status || "Event"}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Event info */}
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-1"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            Registering for
          </p>
          <h3
            className="text-white font-bold text-[13.5px] line-clamp-2 leading-snug"
            style={{ fontFamily: "'Syne',sans-serif" }}
          >
            {event?.name || "—"}
          </h3>
        </div>

        <div className="flex flex-col gap-1.5">
          {event?.liveDate && (
            <p
              className="flex items-center gap-1.5 text-[11px]"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              <Calendar size={11} /> {fmt(event.liveDate)}
            </p>
          )}
          {event?.venue && (
            <p
              className="flex items-center gap-1.5 text-[11px]"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              <MapPin size={11} /> {event.venue}
            </p>
          )}
        </div>

        {/* Stall availability */}
        {event && (
          <div>
            <div
              className="flex justify-between text-[10.5px] mb-1"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              <span className="flex items-center gap-1">
                <Building size={10} /> Stall availability
              </span>
              <span
                style={{
                  color: event.availableStalls === 0 ? "#f87171" : "#34d399",
                }}
              >
                {event.availableStalls} left
              </span>
            </div>
            <div
              className="h-1.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.07)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${fillPct}%`,
                  background:
                    fillPct >= 90
                      ? "linear-gradient(90deg,#ef4444,#dc2626)"
                      : fillPct >= 60
                        ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
                        : "linear-gradient(90deg,#7c3aed,#a78bfa)",
                }}
              />
            </div>
            <p
              className="text-[10px] mt-1"
              style={{ color: "rgba(255,255,255,0.22)" }}
            >
              {event.numberOfStalls - event.availableStalls} /{" "}
              {event.numberOfStalls} stalls filled
            </p>
          </div>
        )}

        {/* Registration preview */}
        <div
          className="pt-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            Your Registration
          </p>
          <div className="flex flex-col gap-1.5">
            {formData.projectTitle ? (
              <p className="text-white text-[12.5px] font-semibold line-clamp-1">
                {formData.projectTitle}
              </p>
            ) : (
              <p
                className="text-[12px]"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                No project title yet…
              </p>
            )}
            {formData.category && (
              <span
                className="self-start text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                style={{
                  background: `${catColor}18`,
                  color: catColor,
                  border: `1px solid ${catColor}30`,
                }}
              >
                {formData.category}
              </span>
            )}
            {formData.teamMembers.length > 0 && (
              <p
                className="flex items-center gap-1 text-[11px]"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                <Users size={10} /> {formData.teamMembers.length} team member
                {formData.teamMembers.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────
function validateStep(step, formData) {
  const errs = {};
  if (step === 0) {
    if (!formData.projectTitle.trim())
      errs.projectTitle = "Project title is required";
    if (formData.projectTitle.length > 200)
      errs.projectTitle = "Max 200 characters";
    if (!formData.projectDescription.trim())
      errs.projectDescription = "Description is required";
    if (formData.projectDescription.length > 1000)
      errs.projectDescription = "Max 1000 characters";
    if (!formData.category) errs.category = "Select a category";
  }
  if (step === 2) {
    if (formData.requirements.length > 500)
      errs.requirements = "Max 500 characters";
  }
  return errs;
}

// ─── Main component ───────────────────────────────────────────────────────
export default function CreateRegistration() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    projectTitle: "",
    projectDescription: "",
    category: "",
    teamMembers: [],
    requirements: "",
  });

  const [memberInput, setMemberInput] = useState({ name: "", role: "other" });
  const [memberError, setMemberError] = useState("");

  // Load event
  useEffect(() => {
    (async () => {
      try {
        setEventLoading(true);
        const res = await eventAPI.getById(eventId);
        setEvent(res.data);
      } catch (err) {
        setSubmitError(err.message);
      } finally {
        setEventLoading(false);
      }
    })();
  }, [eventId]);

  const setField = (field, value) =>
    setFormData((f) => ({ ...f, [field]: value }));

  // Team member actions
  const addMember = () => {
    if (!memberInput.name.trim()) {
      setMemberError("Enter a member name");
      return;
    }
    if (formData.teamMembers.length >= 10) {
      setMemberError("Max 10 team members");
      return;
    }
    setFormData((f) => ({
      ...f,
      teamMembers: [
        ...f.teamMembers,
        { name: memberInput.name.trim(), role: memberInput.role },
      ],
    }));
    setMemberInput({ name: "", role: "other" });
    setMemberError("");
  };

  const removeMember = (i) =>
    setFormData((f) => ({
      ...f,
      teamMembers: f.teamMembers.filter((_, idx) => idx !== i),
    }));

  // Step navigation
  const goToStep = (n) => {
    setStep(n);
    setErrors({});
  };

  const nextStep = () => {
    const errs = validateStep(step, formData);
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

  // Submit
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await registrationAPI.create(eventId, {
        projectTitle: formData.projectTitle,
        projectDescription: formData.projectDescription,
        category: formData.category,
        teamMembers: formData.teamMembers,
        requirements: formData.requirements,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || "Failed to submit registration");
    } finally {
      setSubmitting(false);
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

  // ── Success screen ────────────────────────────────────────────────
  if (submitted) {
    return (
      <div
        className="h-screen flex"
        style={{
          background: "#0c0c0f",
          fontFamily: "'DM Sans','Segoe UI',sans-serif",
        }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Syne:wght@700;800&display=swap');`}</style>
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-md w-full text-center flex flex-col items-center gap-5 p-8 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(52,211,153,0.15)",
                  border: "2px solid rgba(52,211,153,0.35)",
                }}
              >
                <CheckCircle size={30} style={{ color: "#34d399" }} />
              </div>
              <div>
                <h2
                  className="text-white text-xl font-bold"
                  style={{ fontFamily: "'Syne',sans-serif" }}
                >
                  Registration Submitted!
                </h2>
                <p
                  className="text-[13px] mt-2"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  Your registration for{" "}
                  <strong style={{ color: "white" }}>{event?.name}</strong> is
                  pending review by the event admin.
                </p>
              </div>
              <div
                className="w-full p-4 rounded-xl text-left"
                style={{
                  background: "rgba(52,211,153,0.06)",
                  border: "1px solid rgba(52,211,153,0.15)",
                }}
              >
                <p
                  className="text-[11.5px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: "rgba(52,211,153,0.6)" }}
                >
                  What happens next
                </p>
                {[
                  "The event admin reviews your registration",
                  "You'll be notified when approved",
                  "A stall number will be assigned to you",
                ].map((t, i) => (
                  <p
                    key={i}
                    className="flex items-center gap-2 text-[12.5px] mb-1.5"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                      style={{
                        background: "rgba(52,211,153,0.2)",
                        color: "#34d399",
                      }}
                    >
                      {i + 1}
                    </span>
                    {t}
                  </p>
                ))}
              </div>
              <div className="flex gap-3 w-full">
                <Link
                  to="/user/registrations"
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-center transition-all"
                  style={{
                    background: "rgba(124,58,237,0.18)",
                    color: "#c4b5fd",
                    border: "1px solid rgba(124,58,237,0.28)",
                  }}
                >
                  My Registrations
                </Link>
                <Link
                  to="/browseevents"
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-center transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(255,255,255,0.09)",
                  }}
                >
                  Browse More
                </Link>
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────
  if (eventLoading) {
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
                Loading event…
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex" style={{ background: "#0c0c0f" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-white font-semibold mb-2">Event not found</p>
              <Link
                to="/browseevents"
                className="text-violet-400 underline text-sm"
              >
                Browse Events
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ── Event full guard ──────────────────────────────────────────────
  if (event.availableStalls === 0) {
    return (
      <div
        className="min-h-screen flex"
        style={{
          background: "#0c0c0f",
          fontFamily: "'DM Sans','Segoe UI',sans-serif",
        }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Syne:wght@700;800&display=swap');`}</style>
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 flex items-center justify-center px-6">
            <div
              className="max-w-sm w-full text-center flex flex-col items-center gap-4 p-8 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(248,113,113,0.12)",
                  border: "2px solid rgba(248,113,113,0.3)",
                }}
              >
                <Building size={24} style={{ color: "#f87171" }} />
              </div>
              <h2
                className="text-white font-bold"
                style={{ fontFamily: "'Syne',sans-serif" }}
              >
                Event is Full
              </h2>
              <p
                className="text-[13px]"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                All stalls for{" "}
                <strong style={{ color: "white" }}>{event.name}</strong> have
                been filled.
              </p>
              <Link
                to="/browseevents"
                className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white text-center"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                  border: "1px solid rgba(167,139,250,0.25)",
                }}
              >
                Browse Other Events
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────
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
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4 mb-7"
          >
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
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
            <div>
              <h1
                className="text-white text-xl font-bold"
                style={{ fontFamily: "'Syne',sans-serif" }}
              >
                Register for Event
              </h1>
              <p
                className="text-[12.5px]"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Step {step + 1} of {STEPS.length} · {STEPS[step].label}
              </p>
            </div>
          </motion.div>

          {/* 3-col layout */}
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

                {/* Submit error */}
                {submitError && (
                  <div
                    className="mb-5 p-3 rounded-xl text-[12.5px]"
                    style={{
                      background: "rgba(248,113,113,0.1)",
                      border: "1px solid rgba(248,113,113,0.2)",
                      color: "#fca5a5",
                    }}
                  >
                    <AlertCircle size={13} className="inline mr-1.5" />{" "}
                    {submitError}
                  </div>
                )}

                {/* Step panels */}
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
                          hint={`${formData.projectTitle.length}/200`}
                        >
                          <StyledInput
                            icon={Briefcase}
                            type="text"
                            placeholder="e.g. EcoTrack — Sustainability Dashboard"
                            value={formData.projectTitle}
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
                          hint={`${formData.projectDescription.length}/1000`}
                        >
                          <StyledTextarea
                            placeholder="Describe your project in detail — what it does, who it's for, and what makes it stand out…"
                            value={formData.projectDescription}
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
                              const selected = formData.category === cat;
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

                    {/* STEP 1: Team Members */}
                    {step === 1 && (
                      <>
                        {/* Add member row */}
                        <Field
                          label="Add Team Member"
                          hint={`${formData.teamMembers.length}/10`}
                        >
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <UserPlus
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
                            <div className="relative w-36 flex-shrink-0">
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
                                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none rotate-90"
                                style={{ color: "rgba(255,255,255,0.25)" }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={addMember}
                              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-semibold transition-all"
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
                              className="text-[11.5px] flex items-center gap-1 mt-1"
                              style={{ color: "#f87171" }}
                            >
                              <AlertCircle size={11} /> {memberError}
                            </p>
                          )}
                        </Field>

                        {/* Member list */}
                        {formData.teamMembers.length === 0 ? (
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
                              No team members added yet
                            </p>
                            <p
                              className="text-[11px]"
                              style={{ color: "rgba(255,255,255,0.18)" }}
                            >
                              You can register solo or add teammates above
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <p
                              className="text-[10.5px] font-bold uppercase tracking-widest"
                              style={{ color: "rgba(255,255,255,0.25)" }}
                            >
                              Team ({formData.teamMembers.length})
                            </p>
                            {formData.teamMembers.map((m, i) => (
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
                                  {m.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-[13px] font-semibold truncate">
                                    {m.name}
                                  </p>
                                  <p
                                    className="text-[10.5px] capitalize"
                                    style={{ color: "rgba(255,255,255,0.38)" }}
                                  >
                                    {m.role}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeMember(i)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
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
                            placeholder="Describe any special stall requirements — power outlets, equipment, space needs, setup time, accessibility needs…"
                            value={formData.requirements}
                            rows={5}
                            maxLength={500}
                            onChange={(e) =>
                              setField("requirements", e.target.value)
                            }
                          />
                        </Field>

                        <div
                          className="p-4 rounded-xl"
                          style={{
                            background: "rgba(96,165,250,0.06)",
                            border: "1px solid rgba(96,165,250,0.15)",
                          }}
                        >
                          <p
                            className="flex items-center gap-2 text-[12.5px] font-semibold mb-2"
                            style={{ color: "#93c5fd" }}
                          >
                            <Info size={13} /> Tips for requirements
                          </p>
                          <ul className="flex flex-col gap-1">
                            {[
                              "Mention power/electrical needs (# of outlets)",
                              "Specify if you need a table, chairs, or display stand",
                              "Note any large equipment that needs extra space",
                              "Request early setup if your installation takes time",
                            ].map((tip) => (
                              <li
                                key={tip}
                                className="text-[12px] flex items-start gap-2"
                                style={{ color: "rgba(255,255,255,0.45)" }}
                              >
                                <span
                                  className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0"
                                  style={{ background: "rgba(96,165,250,0.5)" }}
                                />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}

                    {/* STEP 3: Review & Submit */}
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
                              ["Project Title", formData.projectTitle || "—"],
                              ["Category", formData.category || "—"],
                              [
                                "Team Size",
                                formData.teamMembers.length === 0
                                  ? "Solo"
                                  : `${formData.teamMembers.length} member${formData.teamMembers.length !== 1 ? "s" : ""}`,
                              ],
                              [
                                "Special Needs",
                                formData.requirements ? "Yes" : "None",
                              ],
                              ["Event", event?.name || "—"],
                              [
                                "Stalls Available",
                                event?.availableStalls ?? "—",
                              ],
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

                        {/* Description preview */}
                        {formData.projectDescription && (
                          <div
                            className="rounded-xl p-4"
                            style={{
                              background: "rgba(255,255,255,0.02)",
                              border: "1px solid rgba(255,255,255,0.07)",
                            }}
                          >
                            <p
                              className="text-[10.5px] font-bold uppercase tracking-widest mb-2"
                              style={{ color: "rgba(255,255,255,0.25)" }}
                            >
                              Description
                            </p>
                            <p
                              className="text-[12.5px] leading-relaxed"
                              style={{ color: "rgba(255,255,255,0.55)" }}
                            >
                              {formData.projectDescription}
                            </p>
                          </div>
                        )}

                        {/* Team preview */}
                        {formData.teamMembers.length > 0 && (
                          <div
                            className="rounded-xl p-4"
                            style={{
                              background: "rgba(255,255,255,0.02)",
                              border: "1px solid rgba(255,255,255,0.07)",
                            }}
                          >
                            <p
                              className="text-[10.5px] font-bold uppercase tracking-widest mb-2"
                              style={{ color: "rgba(255,255,255,0.25)" }}
                            >
                              Team
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {formData.teamMembers.map((m, i) => (
                                <span
                                  key={i}
                                  className="flex items-center gap-1.5 text-[11.5px] px-2.5 py-1 rounded-full"
                                  style={{
                                    background: "rgba(124,58,237,0.12)",
                                    color: "#c4b5fd",
                                    border: "1px solid rgba(124,58,237,0.2)",
                                  }}
                                >
                                  {m.name} ·{" "}
                                  <span className="capitalize opacity-60">
                                    {m.role}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Warning */}
                        <div
                          className="p-3.5 rounded-xl"
                          style={{
                            background: "rgba(251,191,36,0.07)",
                            border: "1px solid rgba(251,191,36,0.18)",
                            color: "#fde68a",
                          }}
                        >
                          <p className="text-[12px] flex items-start gap-2">
                            <Info size={13} className="mt-0.5 flex-shrink-0" />
                            After submitting, your registration will be reviewed
                            by the event admin. You'll receive a stall number
                            upon approval.
                          </p>
                        </div>
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
                    type="button"
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

                  {step < STEPS.length - 1 ? (
                    <button
                      type="button"
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
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
                      style={{
                        background: submitting
                          ? "rgba(124,58,237,0.4)"
                          : "linear-gradient(135deg,#7c3aed,#6d28d9)",
                        border: "1px solid rgba(167,139,250,0.25)",
                        boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
                        cursor: submitting ? "not-allowed" : "pointer",
                      }}
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />{" "}
                          Submitting…
                        </>
                      ) : (
                        <>
                          <Send size={14} /> Submit Registration
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ── Right: event summary ── */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-3"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                Event Details
              </p>
              <EventSummaryCard event={event} formData={formData} />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
