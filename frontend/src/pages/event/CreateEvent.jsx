import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  Calendar,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Hash,
  Users,
  ArrowLeft,
  Send,
  X,
  Info,
  Building,
} from "lucide-react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { eventAPI } from "@/lib/api";

// ─── Step definitions ─────────────────────────────────────────────────────
const STEPS = [
  { id: 0, label: "Basic Info", icon: Info, desc: "Name, description & type" },
  { id: 1, label: "Schedule", icon: Calendar, desc: "Date, time & venue" },
  { id: 2, label: "Stalls & Env", icon: Building, desc: "Capacity & environment" },
  { id: 3, label: "Tags", icon: Hash, desc: "Discoverability" },
];

const EVENT_TYPES = ["conference", "exhibition", "fair", "workshop", "seminar", "other"];

const SKYBOX_PRESETS = [
  { value: "/Environments/AlgerLakessunset.webp", label: "Alger Lakes" },
  { value: "/Environments/Mountainmeadow.webp", label: "Mountain Meadow" },
  { value: "/Environments/RetroSpaceSkybox.webp", label: "Retro Space" },
  { value: "/Environments/RoyalPalaceasi.webp", label: "Royal Palace" },
  { value: "/Environments/WaimeaCanyon.webp", label: "Waimea Canyon" },
];

// ─── Styled form primitives ───────────────────────────────────────────────
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
          style={{ color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.07em" }}
        >
          {label}
          {required && <span style={{ color: "#f87171" }}> *</span>}
        </label>
        {hint && <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>{hint}</span>}
      </div>
      {children}
      {error && (
        <p className="text-[11.5px] flex items-center gap-1" style={{ color: "#f87171" }}>
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
          style={{ color: focused ? "#a78bfa" : "rgba(255,255,255,0.25)", transition: "color 0.18s" }}
        />
      )}
      <input
        {...props}
        style={{
          ...inputBase,
          paddingLeft: Icon ? 38 : 14,
          borderColor: focused ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.1)",
        }}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
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
        borderColor: focused ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.1)",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

// ─── Step progress sidebar ────────────────────────────────────────────────
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
              border: active ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent",
              cursor: done || step.id <= currentStep ? "pointer" : "not-allowed",
              opacity: step.id > currentStep && !done ? 0.4 : 1,
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold transition-all"
              style={
                done
                  ? { background: "rgba(52,211,153,0.2)", border: "1px solid rgba(52,211,153,0.4)", color: "#34d399" }
                  : active
                  ? { background: "rgba(124,58,237,0.35)", border: "1px solid rgba(167,139,250,0.5)", color: "#c4b5fd" }
                  : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" }
              }
            >
              {done ? <CheckCircle size={13} /> : <Icon size={13} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold leading-tight"
                style={{ color: active ? "#c4b5fd" : done ? "#6ee7b7" : "rgba(255,255,255,0.45)" }}>
                {step.label}
              </p>
              <p className="text-[10.5px] truncate" style={{ color: "rgba(255,255,255,0.22)" }}>{step.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Skybox Picker ────────────────────────────────────────────────────────
function SkyboxPicker({ value, backgroundType, onChange, onUpload, uploading }) {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) onUpload(file);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        {SKYBOX_PRESETS.map(({ value: presetValue, label }) => {
          const isSelected = value === presetValue && backgroundType !== "upload";
          return (
            <button
              key={presetValue}
              type="button"
              onClick={() => onChange({ backgroundType: "custom", customBackground: presetValue, customBackgroundPublicId: "" })}
              className="flex flex-col rounded-xl overflow-hidden text-left transition-all"
              style={{
                border: isSelected ? "2px solid rgba(52,211,153,0.7)" : "2px solid rgba(255,255,255,0.07)",
                boxShadow: isSelected ? "0 0 16px rgba(52,211,153,0.15)" : "none",
              }}
            >
              <div className="relative w-full" style={{ height: 72 }}>
                <img src={presetValue} alt={label} className="w-full h-full object-cover" />
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "rgba(52,211,153,0.18)" }}>
                    <CheckCircle size={20} style={{ color: "#34d399" }} />
                  </div>
                )}
              </div>
              <div className="px-2 py-1.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                <p className="text-[11px] font-medium truncate"
                  style={{ color: isSelected ? "#6ee7b7" : "rgba(255,255,255,0.45)" }}>
                  {label}
                </p>
              </div>
            </button>
          );
        })}

        {/* Custom upload tile */}
        <button
          type="button"
          onClick={() => {
            onChange({ backgroundType: "upload", customBackground: "", customBackgroundPublicId: "" });
            setTimeout(() => fileInputRef.current?.click(), 50);
          }}
          className="flex flex-col items-center justify-center gap-2 rounded-xl transition-all"
          style={{
            height: 105,
            border: backgroundType === "upload" ? "2px solid rgba(96,165,250,0.7)" : "2px dashed rgba(255,255,255,0.12)",
            background: backgroundType === "upload" ? "rgba(96,165,250,0.08)" : "rgba(255,255,255,0.02)",
          }}
        >
          {uploading ? (
            <div className="w-6 h-6 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
          ) : (
            <Upload size={18} style={{ color: backgroundType === "upload" ? "#60a5fa" : "rgba(255,255,255,0.3)" }} />
          )}
          <span className="text-[11px] font-medium"
            style={{ color: backgroundType === "upload" ? "#93c5fd" : "rgba(255,255,255,0.3)" }}>
            {uploading ? "Uploading…" : "Custom Upload"}
          </span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Show uploaded preview */}
      {backgroundType === "upload" && value?.startsWith("http") && (
        <div className="relative rounded-xl overflow-hidden" style={{ height: 100 }}>
          <img src={value} alt="Custom skybox" className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-end p-2" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}>
            <span className="text-[11px] text-white font-medium">Custom background uploaded ✓</span>
          </div>
        </div>
      )}

      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.22)" }}>
        Select a preset skybox or upload your own equirectangular (360°) image · Max 20MB
      </p>
    </div>
  );
}

// ─── Tag input ────────────────────────────────────────────────────────────
function TagInput({ value, onChange }) {
  const [input, setInput] = useState("");
  const tags = value ? value.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const addTag = (raw) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag || tags.includes(tag)) { setInput(""); return; }
    onChange([...tags, tag].join(", "));
    setInput("");
  };

  const removeTag = (t) => onChange(tags.filter((x) => x !== t).join(", "));

  return (
    <div className="flex flex-col gap-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-[11.5px] font-medium px-3 py-1 rounded-full"
              style={{ background: "rgba(167,139,250,0.14)", color: "#c4b5fd", border: "1px solid rgba(167,139,250,0.22)" }}>
              #{t}
              <button type="button" onClick={() => removeTag(t)} className="hover:text-white transition-colors">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Hash size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "rgba(255,255,255,0.25)" }} />
        <input
          type="text"
          placeholder="Type a tag and press Enter or comma…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); addTag(input); }
            if (e.key === ",") { e.preventDefault(); addTag(input); }
          }}
          onBlur={() => { if (input) addTag(input); }}
          style={{ ...inputBase, paddingLeft: 36 }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(167,139,250,0.5)")}
        />
      </div>
      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.22)" }}>
        Press Enter or comma to add · {tags.length}/10 tags
      </p>
    </div>
  );
}

// ─── Live preview card ────────────────────────────────────────────────────
function LivePreview({ form }) {
  const tags = form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const skyboxLabel = SKYBOX_PRESETS.find((p) => p.value === form.customBackground)?.label || "Custom";

  return (
    <div className="rounded-2xl overflow-hidden sticky top-6"
      style={{ border: "1px solid rgba(255,255,255,0.08)", background: "#141320" }}>
      <div className="relative h-36 overflow-hidden"
        style={{ background: "linear-gradient(135deg,#1e1b30,#2d1f5e)" }}>
        {form.customBackground && (
          <img src={form.customBackground} alt="" className="w-full h-full object-cover" onError={() => {}} />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top,#141320,transparent 60%)" }} />
        <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ background: "rgba(10,10,20,0.6)", color: "#93c5fd", border: "1px solid rgba(96,165,250,0.2)", backdropFilter: "blur(8px)" }}>
          Upcoming
        </span>
        {!form.customBackground && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>No skybox selected</p>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2.5">
        <h3 className="text-white font-bold text-[14px] leading-snug line-clamp-2"
          style={{ fontFamily: "'Syne',sans-serif", minHeight: 20 }}>
          {form.name || <span style={{ color: "rgba(255,255,255,0.2)" }}>Event name…</span>}
        </h3>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((t) => (
              <span key={t} className="text-[9.5px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(167,139,250,0.14)", color: "#c4b5fd", border: "1px solid rgba(167,139,250,0.2)" }}>
                #{t}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-1 mt-1">
          {form.liveDate && (
            <p className="text-[11px] flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.38)" }}>
              <Calendar size={11} />
              {new Date(form.liveDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
          {form.numberOfStalls && (
            <p className="text-[11px] flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.38)" }}>
              <Users size={11} /> {form.numberOfStalls} stalls available
            </p>
          )}
          {form.customBackground && (
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.28)" }}>
              🌐 {skyboxLabel}
            </p>
          )}
        </div>
        <div className="mt-1 py-2 rounded-xl text-center text-[12px] font-semibold"
          style={{ background: "rgba(124,58,237,0.2)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,0.28)" }}>
          View & Register
        </div>
      </div>
    </div>
  );
}

// ─── Validation per step ──────────────────────────────────────────────────
function validateStep(step, form) {
  const errs = {};
  if (step === 0) {
    if (!form.name.trim()) errs.name = "Event name is required";
    if (form.name.length > 100) errs.name = "Max 100 characters";
    if (!form.description.trim()) errs.description = "Description is required";
    if (form.description.length > 1000) errs.description = "Max 1000 characters";
    if (!form.eventType) errs.eventType = "Select an event type";
  }
  if (step === 1) {
    if (!form.liveDate) errs.liveDate = "Live date is required";
    else if (new Date(form.liveDate) <= new Date()) errs.liveDate = "Must be in the future";
    if (form.startTime && form.endTime && form.startTime >= form.endTime)
      errs.endTime = "End time must be after start time";
  }
  if (step === 2) {
    if (!form.numberOfStalls || form.numberOfStalls < 1) errs.numberOfStalls = "At least 1 stall";
    if (form.numberOfStalls > 500) errs.numberOfStalls = "Max 500 stalls";
  }
  return errs;
}

// ─── Main component ───────────────────────────────────────────────────────
export default function CreateEvent() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [uploadingBackground, setUploadingBackground] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    numberOfStalls: 10,
    liveDate: "",
    startTime: "",
    endTime: "",
    backgroundType: "custom",
    customBackground: "/Environments/RetroSpaceSkybox.webp",
    customBackgroundPublicId: "",
    eventType: "exhibition",
    tags: "",
  });

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    set(name, type === "checkbox" ? checked : value);
  };

  const handleSkyboxChange = ({ backgroundType, customBackground, customBackgroundPublicId }) => {
    setForm((f) => ({ ...f, backgroundType, customBackground, customBackgroundPublicId }));
  };

  const handleBackgroundUpload = async (file) => {
    if (!file) return;
    // NOTE: background upload requires an eventId — only possible after event creation
    // So for CreateEvent we just store the file locally and upload after creation
    // For now show a preview using FileReader
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((f) => ({ ...f, backgroundType: "upload", customBackground: reader.result, customBackgroundPublicId: "" }));
    };
    reader.readAsDataURL(file);
    // Store file ref for post-creation upload
    setForm((f) => ({ ...f, _pendingBgFile: file }));
  };

  const goToStep = (n) => { setStep(n); setErrors({}); };

  const nextStep = () => {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (!done.includes(step)) setDone((d) => [...d, step]);
    setErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => { setErrors({}); setStep((s) => Math.max(s - 1, 0)); };

  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError(null);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        numberOfStalls: parseInt(form.numberOfStalls),
        liveDate: form.liveDate,
        startTime: form.startTime,
        endTime: form.endTime,
        backgroundType: form.backgroundType === "upload" ? "custom" : form.backgroundType,
        customBackground: form.customBackground?.startsWith("data:") ? "" : form.customBackground,
        eventType: form.eventType,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };

      const res = await eventAPI.create(payload);
      if (res.success) {
        // If there's a pending bg file upload (custom upload), do it now
        if (form._pendingBgFile && res.data?._id) {
          try {
            const formData = new FormData();
            formData.append("background", form._pendingBgFile);
            await eventAPI.uploadBackground(res.data._id, formData);
          } catch (bgErr) {
            console.warn("Background upload failed, can retry in edit:", bgErr);
          }
        }
        navigate("/user/events");
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fadeUp = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.18 } },
  };

  return (
    <div className="h-screen flex" style={{ background: "#0c0c0f", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Syne:wght@700;800&display=swap');
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        select option { background: #1a1728; color: white; }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
        ::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto px-6 md:px-8 py-7">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="flex items-center gap-4 mb-7">
            <Link to="/user/events"
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>
              <ArrowLeft size={15} />
            </Link>
            <div>
              <h1 className="text-white text-xl font-bold" style={{ fontFamily: "'Syne',sans-serif" }}>Create Event</h1>
              <p className="text-[12.5px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                Step {step + 1} of {STEPS.length} · {STEPS[step].label}
              </p>
            </div>
          </motion.div>

          {/* 3-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_220px] gap-6">
            {/* ── Left: step nav ── */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05, duration: 0.3 }}>
              <div className="rounded-2xl p-3 sticky top-6"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3 px-1"
                  style={{ color: "rgba(255,255,255,0.25)" }}>Progress</p>
                <StepNav currentStep={step} completedSteps={done} onGoTo={goToStep} />
                <div className="mt-4 px-1">
                  <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(done.length / STEPS.length) * 100}%`, background: "linear-gradient(90deg,#7c3aed,#a78bfa)" }} />
                  </div>
                  <p className="text-[10px] mt-1.5 text-right" style={{ color: "rgba(255,255,255,0.22)" }}>
                    {Math.round((done.length / STEPS.length) * 100)}% complete
                  </p>
                </div>
              </div>
            </motion.div>

            {/* ── Center: step content ── */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08, duration: 0.3 }}>
              <div className="rounded-2xl p-6 min-h-[460px] flex flex-col"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {/* Step header */}
                <div className="flex items-center gap-3 mb-6 pb-5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}>
                    {(() => { const Icon = STEPS[step].icon; return <Icon size={16} style={{ color: "#c4b5fd" }} />; })()}
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-[16px]" style={{ fontFamily: "'Syne',sans-serif" }}>
                      {STEPS[step].label}
                    </h2>
                    <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.32)" }}>{STEPS[step].desc}</p>
                  </div>
                </div>

                {submitError && (
                  <div className="mb-5 p-3 rounded-xl text-[12.5px]"
                    style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#fca5a5" }}>
                    <AlertCircle size={13} className="inline mr-1.5" /> {submitError}
                  </div>
                )}

                <AnimatePresence mode="wait">
                  <motion.div key={step} {...fadeUp} className="flex-1 flex flex-col gap-5">

                    {/* STEP 0: Basic Info */}
                    {step === 0 && (
                      <>
                        <Field label="Event Name" required error={errors.name} hint={`${form.name.length}/100`}>
                          <StyledInput name="name" placeholder="e.g. Tech Expo 2025" value={form.name} onChange={handle} maxLength={100} />
                        </Field>
                        <Field label="Description" required error={errors.description} hint={`${form.description.length}/1000`}>
                          <StyledTextarea name="description" placeholder="Describe your event…" value={form.description} onChange={handle} rows={5} maxLength={1000} />
                        </Field>
                        <Field label="Event Type" required error={errors.eventType}>
                          <div className="grid grid-cols-3 gap-2">
                            {EVENT_TYPES.map((t) => (
                              <button key={t} type="button" onClick={() => set("eventType", t)}
                                className="py-2.5 px-3 rounded-xl text-[12px] font-medium capitalize transition-all"
                                style={form.eventType === t
                                  ? { background: "rgba(124,58,237,0.22)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,0.4)" }
                                  : { background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                {t}
                              </button>
                            ))}
                          </div>
                        </Field>
                      </>
                    )}

                    {/* STEP 1: Schedule */}
                    {step === 1 && (
                      <>
                        <Field label="Live Date & Time" required error={errors.liveDate}>
                          <StyledInput icon={Calendar} type="datetime-local" name="liveDate" value={form.liveDate} onChange={handle} />
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Start Time" error={errors.startTime}>
                            <StyledInput icon={Clock} type="time" name="startTime" value={form.startTime} onChange={handle} />
                          </Field>
                          <Field label="End Time" error={errors.endTime}>
                            <StyledInput icon={Clock} type="time" name="endTime" value={form.endTime} onChange={handle} />
                          </Field>
                        </div>
                      </>
                    )}

                    {/* STEP 2: Stalls & Environment */}
                    {step === 2 && (
                      <>
                        <Field label="Number of Stalls" required error={errors.numberOfStalls} hint="1 – 500">
                          <div className="flex items-center gap-3">
                            <button type="button"
                              onClick={() => set("numberOfStalls", Math.max(1, form.numberOfStalls - 1))}
                              className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-lg"
                              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                              −
                            </button>
                            <StyledInput icon={Users} type="number" name="numberOfStalls" value={form.numberOfStalls}
                              onChange={handle} min={1} max={500} />
                            <button type="button"
                              onClick={() => set("numberOfStalls", Math.min(500, form.numberOfStalls + 1))}
                              className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-lg"
                              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                              +
                            </button>
                          </div>
                        </Field>

                        <Field label="Skybox / Environment">
                          <SkyboxPicker
                            value={form.customBackground}
                            backgroundType={form.backgroundType}
                            onChange={handleSkyboxChange}
                            onUpload={handleBackgroundUpload}
                            uploading={uploadingBackground}
                          />
                        </Field>
                      </>
                    )}

                    {/* STEP 3: Tags + Review */}
                    {step === 3 && (
                      <>
                        <Field label="Tags" hint="Up to 10">
                          <TagInput value={form.tags} onChange={(v) => set("tags", v)} />
                        </Field>

                        <div className="mt-2 rounded-xl p-4 flex flex-col gap-3"
                          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                            Review Summary
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-[12px]">
                            {[
                              ["Name", form.name || "—"],
                              ["Type", form.eventType || "—"],
                              ["Live Date", form.liveDate ? new Date(form.liveDate).toLocaleDateString() : "—"],
                              ["Time", form.startTime ? `${form.startTime} – ${form.endTime || "?"}` : "—"],
                              ["Stalls", form.numberOfStalls],
                              ["Skybox", SKYBOX_PRESETS.find((p) => p.value === form.customBackground)?.label || (form.backgroundType === "upload" ? "Custom Upload" : "—")],
                            ].map(([k, v]) => (
                              <div key={k} className="flex flex-col gap-0.5">
                                <span style={{ color: "rgba(255,255,255,0.28)" }}>{k}</span>
                                <span className="font-medium capitalize truncate" style={{ color: "rgba(255,255,255,0.75)" }}>{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl p-3 text-[12px]"
                          style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.18)", color: "#fde68a" }}>
                          <Info size={13} className="inline mr-1.5 mb-0.5" />
                          After submitting, your event will be reviewed by an admin before going live.
                        </div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Nav buttons */}
                <div className="flex items-center justify-between mt-6 pt-5"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <button type="button" onClick={prevStep} disabled={step === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                    style={step === 0
                      ? { opacity: 0.3, cursor: "not-allowed", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }
                      : { color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}>
                    <ArrowLeft size={14} /> Back
                  </button>

                  {step < STEPS.length - 1 ? (
                    <button type="button" onClick={nextStep}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "1px solid rgba(167,139,250,0.25)", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}>
                      Continue <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button type="button" onClick={handleSubmit} disabled={loading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
                      style={{
                        background: loading ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg,#7c3aed,#6d28d9)",
                        border: "1px solid rgba(167,139,250,0.25)",
                        boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
                        cursor: loading ? "not-allowed" : "pointer",
                      }}>
                      {loading ? (
                        <><div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Submitting…</>
                      ) : (
                        <><Send size={14} /> Submit for Approval</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ── Right: live preview ── */}
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.3 }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>
                Live Preview
              </p>
              <LivePreview form={form} />
              <p className="text-[10.5px] text-center mt-3" style={{ color: "rgba(255,255,255,0.18)" }}>
                Updates as you fill in details
              </p>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}