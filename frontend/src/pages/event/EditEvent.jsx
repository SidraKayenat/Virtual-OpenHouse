import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  Image,
  Box,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Save,
  X,
  Hash,
  Users,
  Palette,
  Info,
  Globe,
  Building,
  TreePine,
  Layers,
  Lock,
  ShieldAlert,
} from "lucide-react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
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
const ENV_TYPES = [
  { value: "indoor", label: "Indoor", icon: Building, desc: "Enclosed venue" },
  {
    value: "outdoor",
    label: "Outdoor",
    icon: TreePine,
    desc: "Open-air space",
  },
  { value: "hybrid", label: "Hybrid", icon: Layers, desc: "Mixed environment" },
];

// ─── Styled primitives (same system as CreateEvent) ───────────────────────
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
  color: "rgba(255,255,255,0.3)",
  cursor: "not-allowed",
  border: "1px solid rgba(255,255,255,0.06)",
};

function Field({ label, required, hint, error, locked, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label
          className="flex items-center gap-1.5 text-[12px] font-semibold tracking-wide"
          style={{
            color: locked ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.5)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          {label}
          {required && !locked && <span style={{ color: "#f87171" }}>*</span>}
          {locked && (
            <span
              className="flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full normal-case tracking-normal"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.25)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Lock size={9} /> Locked
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

function StyledInput({ icon: Icon, locked, ...props }) {
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
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
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
          style={{
            color: focused ? "#a78bfa" : "rgba(255,255,255,0.25)",
            transition: "color 0.18s",
          }}
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

function ChoiceCard({
  selected,
  label,
  desc,
  icon: Icon,
  color = "#a78bfa",
  onClick,
  locked,
}) {
  return (
    <button
      type="button"
      onClick={!locked ? onClick : undefined}
      className="flex flex-col gap-2 p-4 rounded-xl text-left transition-all duration-150"
      style={{
        background: selected ? `${color}12` : "rgba(255,255,255,0.03)",
        border: selected
          ? `1px solid ${color}45`
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: selected ? `0 0 18px ${color}12` : "none",
        cursor: locked ? "not-allowed" : "pointer",
        opacity: locked ? 0.5 : 1,
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{
          background: selected ? `${color}20` : "rgba(255,255,255,0.06)",
        }}
      >
        <Icon
          size={15}
          style={{ color: selected ? color : "rgba(255,255,255,0.35)" }}
        />
      </div>
      <div>
        <p
          className="text-[13px] font-semibold"
          style={{ color: selected ? "white" : "rgba(255,255,255,0.55)" }}
        >
          {label}
        </p>
        {desc && (
          <p
            className="text-[11px] mt-0.5"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
            {desc}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Tag input ────────────────────────────────────────────────────────────
function TagInput({ value, onChange }) {
  const [input, setInput] = useState("");
  const tags = value
    ? value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const addTag = (raw) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag || tags.includes(tag)) {
      setInput("");
      return;
    }
    onChange([...tags, tag].join(", "));
    setInput("");
  };
  const removeTag = (t) => onChange(tags.filter((x) => x !== t).join(", "));
  return (
    <div className="flex flex-col gap-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1.5 text-[11.5px] font-medium px-3 py-1 rounded-full"
              style={{
                background: "rgba(167,139,250,0.14)",
                color: "#c4b5fd",
                border: "1px solid rgba(167,139,250,0.22)",
              }}
            >
              #{t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                className="hover:text-white transition-colors"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Hash
          size={13}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "rgba(255,255,255,0.25)" }}
        />
        <input
          type="text"
          placeholder="Type a tag and press Enter or comma…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(input);
            }
            if (e.key === ",") {
              e.preventDefault();
              addTag(input);
            }
          }}
          onBlur={() => {
            if (input) addTag(input);
          }}
          style={{ ...inputBase, paddingLeft: 36 }}
          onFocus={(e) =>
            (e.target.style.borderColor = "rgba(167,139,250,0.5)")
          }
        />
      </div>
    </div>
  );
}

// ─── Thumbnail picker ─────────────────────────────────────────────────────
function ThumbnailPicker({ value, onChange }) {
  const [preview, setPreview] = useState(value || "");
  const [urlInput, setUrlInput] = useState(value || "");
  const apply = () => {
    setPreview(urlInput);
    onChange(urlInput);
  };
  const clear = () => {
    setPreview("");
    setUrlInput("");
    onChange("");
  };
  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative w-full rounded-2xl overflow-hidden flex items-center justify-center"
        style={{
          height: 160,
          background: preview ? "transparent" : "rgba(255,255,255,0.03)",
          border: preview ? "none" : "2px dashed rgba(255,255,255,0.1)",
        }}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Thumbnail"
              className="w-full h-full object-cover"
              onError={() => setPreview("")}
            />
            <div
              className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.55)" }}
            >
              <button
                onClick={clear}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-semibold text-white"
                style={{
                  background: "rgba(239,68,68,0.4)",
                  border: "1px solid rgba(239,68,68,0.5)",
                }}
              >
                <X size={13} /> Remove
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(167,139,250,0.1)",
                border: "1px solid rgba(167,139,250,0.2)",
              }}
            >
              <Image size={18} style={{ color: "#a78bfa" }} />
            </div>
            <p
              className="text-[12px]"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              No thumbnail set
            </p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Globe
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "rgba(255,255,255,0.25)" }}
          />
          <input
            type="url"
            placeholder="Paste image URL…"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            style={{ ...inputBase, paddingLeft: 34, fontSize: 12.5 }}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(167,139,250,0.5)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "rgba(255,255,255,0.1)")
            }
          />
        </div>
        <button
          type="button"
          onClick={apply}
          disabled={!urlInput}
          className="flex-shrink-0 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all"
          style={{
            background: urlInput
              ? "rgba(124,58,237,0.25)"
              : "rgba(255,255,255,0.04)",
            color: urlInput ? "#c4b5fd" : "rgba(255,255,255,0.25)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────
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
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
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
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: "#1a1728",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
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
              Review the fields you've edited
            </p>
          </div>
        </div>

        {/* Changed fields list */}
        {changes.length > 0 && (
          <div
            className="rounded-xl p-4 flex flex-col gap-2.5"
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
                  className="text-[12px] font-semibold capitalize"
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
                    {String(from) || "—"}
                  </span>
                  <ChevronRight
                    size={11}
                    style={{ color: "rgba(255,255,255,0.2)" }}
                  />
                  <span
                    className="text-[11px] px-2 py-0.5 rounded truncate max-w-[130px]"
                    style={{
                      background: "rgba(52,211,153,0.1)",
                      color: "#34d399",
                    }}
                  >
                    {String(to) || "—"}
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
          These changes will be applied to your event immediately. The event may
          require re-review depending on your current status.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all"
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
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
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
                <Save size={13} /> Confirm Save
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Diff calculator ──────────────────────────────────────────────────────
function getDiff(original, current) {
  const LOCKED = ["name", "liveDate"];
  const LABELS = {
    description: "Description",
    numberOfStalls: "Number of Stalls",
    startTime: "Start Time",
    endTime: "End Time",
    backgroundType: "Background Type",
    customBackground: "Custom Background",
    environmentType: "Environment Type",
    eventType: "Event Type",
    tags: "Tags",
    venue: "Venue",
    thumbnailUrl: "Thumbnail",
    modelUrl: "3D Model URL",
  };
  return Object.keys(current)
    .filter(
      (k) =>
        !LOCKED.includes(k) && String(current[k]) !== String(original[k] ?? ""),
    )
    .map((k) => ({
      field: LABELS[k] || k,
      from: original[k] ?? "",
      to: current[k],
    }));
}

// ─── Live preview ─────────────────────────────────────────────────────────
function LivePreview({ form }) {
  const tags = form.tags
    ? form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  return (
    <div
      className="rounded-2xl overflow-hidden sticky top-6"
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        background: "#141320",
      }}
    >
      <div
        className="relative h-36 overflow-hidden"
        style={{ background: "linear-gradient(135deg,#1e1b30,#2d1f5e)" }}
      >
        {form.thumbnailUrl && (
          <img
            src={form.thumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={() => {}}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top,#141320,transparent 60%)",
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
          Upcoming
        </span>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <h3
          className="text-white font-bold text-[14px] leading-snug line-clamp-1"
          style={{ fontFamily: "'Syne',sans-serif" }}
        >
          {form.name || (
            <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>
          )}
        </h3>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-[9.5px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(167,139,250,0.14)",
                  color: "#c4b5fd",
                  border: "1px solid rgba(167,139,250,0.2)",
                }}
              >
                #{t}
              </span>
            ))}
          </div>
        )}
        <div
          className="flex flex-col gap-1 text-[11px]"
          style={{ color: "rgba(255,255,255,0.38)" }}
        >
          {form.liveDate && (
            <span className="flex items-center gap-1.5">
              <Calendar size={10} />
              {new Date(form.liveDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              {form.startTime && ` · ${form.startTime}`}
            </span>
          )}
          {form.venue && (
            <span className="flex items-center gap-1.5">
              <MapPin size={10} /> {form.venue}
            </span>
          )}
          {form.numberOfStalls && (
            <span className="flex items-center gap-1.5">
              <Users size={10} /> {form.numberOfStalls} stalls
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────
export default function EditEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [original, setOriginal] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load event
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await eventAPI.getById(eventId);
        const e = res.data;
        if (!e) {
          setError("Event not found");
          return;
        }

        const mapped = {
          name: e.name || "",
          description: e.description || "",
          numberOfStalls: e.numberOfStalls || 1,
          liveDate: e.liveDate ? e.liveDate.slice(0, 16) : "",
          startTime: e.startTime || "",
          endTime: e.endTime || "",
          backgroundType: e.backgroundType || "default",
          customBackground: e.customBackground || "",
          environmentType: e.environmentType || "indoor",
          eventType: e.eventType || "exhibition",
          tags: e.tags ? e.tags.join(", ") : "",
          venue: e.venue || "",
          thumbnailUrl: e.thumbnailUrl || "",
          modelUrl: e.modelUrl || "",
        };
        setForm(mapped);
        setOriginal(mapped);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));
  const handle = (e) => {
    const { name, value } = e.target;
    set(name, value);
  };

  const diff = original && form ? getDiff(original, form) : [];
  const isDirty = diff.length > 0;

  const handleSaveClick = () => {
    if (!isDirty) return;
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    try {
      setSaving(true);
      const payload = {
        description: form.description,
        numberOfStalls: parseInt(form.numberOfStalls),
        startTime: form.startTime,
        endTime: form.endTime,
        backgroundType: form.backgroundType,
        customBackground: form.customBackground,
        environmentType: form.environmentType,
        eventType: form.eventType,
        tags: form.tags
          ? form.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        venue: form.venue,
        thumbnailUrl: form.thumbnailUrl,
        modelUrl: form.modelUrl,
      };
      await eventAPI.update(eventId, payload);
      setOriginal({ ...form });
      setShowConfirm(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to save changes");
      setShowConfirm(false);
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────
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
                Loading event…
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex" style={{ background: "#0c0c0f" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-white font-semibold mb-2">Event not found</p>
              <p
                className="text-[13px] mb-4"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                {error}
              </p>
              <Link
                to="/user/events"
                className="text-violet-400 underline text-sm"
              >
                Back to My Events
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
        input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
        ::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto px-6 md:px-8 py-7">
          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between mb-7"
          >
            <div className="flex items-center gap-4">
              <Link
                to="/user/events"
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
              </Link>
              <div>
                <h1
                  className="text-white text-xl font-bold"
                  style={{ fontFamily: "'Syne',sans-serif" }}
                >
                  Edit Event
                </h1>
                <p
                  className="text-[12.5px] mt-0.5 truncate max-w-sm"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {form.name}
                </p>
              </div>
            </div>

            {/* Save button + dirty indicator */}
            <div className="flex items-center gap-3">
              {isDirty && (
                <motion.span
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
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
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
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
              <button
                onClick={handleSaveClick}
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

          {/* Error */}
          {error && (
            <div
              className="mb-5 p-3 rounded-xl text-[12.5px]"
              style={{
                background: "rgba(248,113,113,0.1)",
                border: "1px solid rgba(248,113,113,0.2)",
                color: "#fca5a5",
              }}
            >
              <AlertCircle size={13} className="inline mr-1.5" /> {error}
            </div>
          )}

          {/* ── Locked fields notice ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.3 }}
            className="mb-5 flex items-center gap-3 p-3.5 rounded-xl text-[12.5px]"
            style={{
              background: "rgba(251,191,36,0.06)",
              border: "1px solid rgba(251,191,36,0.15)",
              color: "#fde68a",
            }}
          >
            <Lock size={13} style={{ color: "#fbbf24", flexShrink: 0 }} />
            <span>
              <strong>Event Name</strong> and <strong>Live Date</strong> cannot
              be changed after creation. All other fields are editable.
            </span>
          </motion.div>

          {/* ── 2-column layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">
            {/* ── Left: all editable sections ── */}
            <div className="flex flex-col gap-5">
              {/* Basic Info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.3 }}
              >
                <Section title="Basic Information" icon={Info} accent="#a78bfa">
                  {/* Locked: name */}
                  <Field label="Event Name" locked>
                    <StyledInput locked value={form.name} readOnly />
                  </Field>
                  {/* Editable: description */}
                  <Field
                    label="Description"
                    required
                    hint={`${form.description.length}/1000`}
                  >
                    <StyledTextarea
                      name="description"
                      value={form.description}
                      onChange={handle}
                      rows={4}
                      maxLength={1000}
                    />
                  </Field>
                  {/* Editable: event type */}
                  <Field label="Event Type">
                    <div className="grid grid-cols-3 gap-2">
                      {EVENT_TYPES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => set("eventType", t)}
                          className="py-2.5 px-3 rounded-xl text-[12px] font-medium capitalize transition-all"
                          style={
                            form.eventType === t
                              ? {
                                  background: "rgba(124,58,237,0.22)",
                                  color: "#c4b5fd",
                                  border: "1px solid rgba(124,58,237,0.4)",
                                }
                              : {
                                  background: "rgba(255,255,255,0.03)",
                                  color: "rgba(255,255,255,0.45)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                }
                          }
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </Field>
                </Section>
              </motion.div>

              {/* Schedule */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.3 }}
              >
                <Section title="Schedule" icon={Calendar} accent="#60a5fa">
                  {/* Locked: live date */}
                  <Field label="Live Date & Time" locked>
                    <StyledInput
                      icon={Calendar}
                      locked
                      value={form.liveDate}
                      readOnly
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Start Time">
                      <StyledInput
                        icon={Clock}
                        type="time"
                        name="startTime"
                        value={form.startTime}
                        onChange={handle}
                      />
                    </Field>
                    <Field label="End Time">
                      <StyledInput
                        icon={Clock}
                        type="time"
                        name="endTime"
                        value={form.endTime}
                        onChange={handle}
                      />
                    </Field>
                  </div>
                  <Field label="Venue" hint="Physical or virtual location">
                    <StyledInput
                      icon={MapPin}
                      name="venue"
                      placeholder="e.g. Jakarta Convention Center"
                      value={form.venue}
                      onChange={handle}
                    />
                  </Field>
                </Section>
              </motion.div>

              {/* Stalls & Environment */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.3 }}
              >
                <Section
                  title="Stalls & Environment"
                  icon={Building}
                  accent="#34d399"
                >
                  <Field label="Number of Stalls" hint="1 – 500">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          set(
                            "numberOfStalls",
                            Math.max(1, form.numberOfStalls - 1),
                          )
                        }
                        className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-lg transition-colors"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.6)",
                        }}
                      >
                        −
                      </button>
                      <StyledInput
                        icon={Users}
                        type="number"
                        name="numberOfStalls"
                        value={form.numberOfStalls}
                        onChange={handle}
                        min={1}
                        max={500}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          set(
                            "numberOfStalls",
                            Math.min(
                              500,
                              parseInt(form.numberOfStalls || 0) + 1,
                            ),
                          )
                        }
                        className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-lg transition-colors"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.6)",
                        }}
                      >
                        +
                      </button>
                    </div>
                  </Field>
                  <Field label="Environment Type">
                    <div className="grid grid-cols-3 gap-3">
                      {ENV_TYPES.map(({ value, label, icon, desc }) => (
                        <ChoiceCard
                          key={value}
                          selected={form.environmentType === value}
                          label={label}
                          desc={desc}
                          icon={icon}
                          color="#34d399"
                          onClick={() => set("environmentType", value)}
                        />
                      ))}
                    </div>
                  </Field>
                  <Field label="Background">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          value: "default",
                          label: "Default",
                          desc: "Platform background",
                          icon: Palette,
                        },
                        {
                          value: "custom",
                          label: "Custom",
                          desc: "Your own background",
                          icon: Globe,
                        },
                      ].map(({ value, label, desc, icon }) => (
                        <ChoiceCard
                          key={value}
                          selected={form.backgroundType === value}
                          label={label}
                          desc={desc}
                          icon={icon}
                          color="#60a5fa"
                          onClick={() => set("backgroundType", value)}
                        />
                      ))}
                    </div>
                  </Field>
                  {form.backgroundType === "custom" && (
                    <Field label="Custom Background URL">
                      <StyledInput
                        icon={Globe}
                        name="customBackground"
                        placeholder="https://…"
                        value={form.customBackground}
                        onChange={handle}
                      />
                    </Field>
                  )}
                </Section>
              </motion.div>

              {/* Media */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <Section title="Media & 3D" icon={Image} accent="#fb923c">
                  <Field label="Event Thumbnail" hint="Paste an image URL">
                    <ThumbnailPicker
                      value={form.thumbnailUrl}
                      onChange={(v) => set("thumbnailUrl", v)}
                    />
                  </Field>
                  <Field label="3D Model URL" hint="Optional">
                    <StyledInput
                      icon={Box}
                      name="modelUrl"
                      placeholder="https://model.glb or .obj"
                      value={form.modelUrl}
                      onChange={handle}
                    />
                  </Field>
                </Section>
              </motion.div>

              {/* Tags */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24, duration: 0.3 }}
              >
                <Section title="Tags" icon={Hash} accent="#f472b6">
                  <Field label="Event Tags" hint="Up to 10">
                    <TagInput
                      value={form.tags}
                      onChange={(v) => set("tags", v)}
                    />
                  </Field>
                </Section>
              </motion.div>

              {/* Bottom save bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28, duration: 0.3 }}
                className="flex items-center justify-between p-4 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div>
                  {isDirty ? (
                    <p className="text-[12.5px]" style={{ color: "#fbbf24" }}>
                      {diff.length} field{diff.length !== 1 ? "s" : ""} modified
                      — review before saving
                    </p>
                  ) : (
                    <p
                      className="text-[12.5px]"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      No changes made yet
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/user/events")}
                    className="px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveClick}
                    disabled={!isDirty}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
                    style={
                      isDirty
                        ? {
                            background:
                              "linear-gradient(135deg,#7c3aed,#6d28d9)",
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
            </div>

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
                Live Preview
              </p>
              <LivePreview form={form} />
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

      {/* ── Confirm modal ── */}
      <AnimatePresence>
        {showConfirm && (
          <ConfirmModal
            changes={diff}
            onConfirm={handleConfirm}
            onCancel={() => setShowConfirm(false)}
            loading={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
