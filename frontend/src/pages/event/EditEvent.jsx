import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { eventAPI } from "@/lib/api";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { motion } from "framer-motion";

import {
  Calendar,
  Clock,
  Palette,
  Image,
  Send,
  Box,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Save,
  Upload,
  X,
  Hash,
  Users,
  Info,
  Building,
  Lock,
  ShieldAlert,
} from "lucide-react";

function ChoiceCard({
  selected,
  label,
  desc,
  icon,
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
        <icon
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

// ─── Constants ────────────────────────────────────────────────────────────
const EVENT_TYPES = [
  "conference",
  "exhibition",
  "fair",
  "workshop",
  "seminar",
  "other",
];

const SKYBOX_PRESETS = [
  { value: "/Environments/AlgerLakessunset.webp", label: "Alger Lakes" },
  { value: "/Environments/Mountainmeadow.webp", label: "Mountain Meadow" },
  { value: "/Environments/RetroSpaceSkybox.webp", label: "Retro Space" },
  { value: "/Environments/RoyalPalaceasi.webp", label: "Royal Palace" },
  { value: "/Environments/WaimeaCanyon.webp", label: "Waimea Canyon" },
];

const ENV_TYPES = [
  { value: "indoor", label: "Indoor", icon: Building, desc: "Inside venue" },
  { value: "outdoor", label: "Outdoor", icon: Building, desc: "Open air" },
  { value: "hybrid", label: "Hybrid", icon: Building, desc: "Mixed setup" },
];

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

// ─── Skybox Picker ────────────────────────────────────────────────────────
function SkyboxPicker({
  value,
  backgroundType,
  onChange,
  onUpload,
  uploading,
}) {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) onUpload(file);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        {SKYBOX_PRESETS.map(({ value: presetValue, label }) => {
          const isSelected =
            value === presetValue && backgroundType !== "upload";
          return (
            <button
              key={presetValue}
              type="button"
              onClick={() =>
                onChange({
                  backgroundType: "custom",
                  customBackground: presetValue,
                  customBackgroundPublicId: "",
                })
              }
              className="flex flex-col rounded-xl overflow-hidden text-left transition-all"
              style={{
                border: isSelected
                  ? "2px solid rgba(52,211,153,0.7)"
                  : "2px solid rgba(255,255,255,0.07)",
                boxShadow: isSelected
                  ? "0 0 16px rgba(52,211,153,0.15)"
                  : "none",
              }}
            >
              <div className="relative w-full" style={{ height: 72 }}>
                <img
                  src={presetValue}
                  alt={label}
                  className="w-full h-full object-cover"
                />
                {isSelected && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "rgba(52,211,153,0.18)" }}
                  >
                    <CheckCircle size={20} style={{ color: "#34d399" }} />
                  </div>
                )}
              </div>
              <div
                className="px-2 py-1.5"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <p
                  className="text-[11px] font-medium truncate"
                  style={{
                    color: isSelected ? "#6ee7b7" : "rgba(255,255,255,0.45)",
                  }}
                >
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
            onChange({
              backgroundType: "upload",
              customBackground: value?.startsWith("http") ? value : "",
              customBackgroundPublicId: "",
            });
            setTimeout(() => fileInputRef.current?.click(), 50);
          }}
          className="flex flex-col items-center justify-center gap-2 rounded-xl transition-all"
          style={{
            height: 105,
            border:
              backgroundType === "upload"
                ? "2px solid rgba(96,165,250,0.7)"
                : "2px dashed rgba(255,255,255,0.12)",
            background:
              backgroundType === "upload"
                ? "rgba(96,165,250,0.08)"
                : "rgba(255,255,255,0.02)",
          }}
        >
          {uploading ? (
            <div className="w-6 h-6 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
          ) : (
            <Upload
              size={18}
              style={{
                color:
                  backgroundType === "upload"
                    ? "#60a5fa"
                    : "rgba(255,255,255,0.3)",
              }}
            />
          )}
          <span
            className="text-[11px] font-medium"
            style={{
              color:
                backgroundType === "upload"
                  ? "#93c5fd"
                  : "rgba(255,255,255,0.3)",
            }}
          >
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
        <div
          className="relative rounded-xl overflow-hidden"
          style={{ height: 100 }}
        >
          <img
            src={value}
            alt="Custom skybox"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 flex items-end p-2"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
            }}
          >
            <span className="text-[11px] text-white font-medium">
              Custom background uploaded ✓
            </span>
          </div>
        </div>
      )}

      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.22)" }}>
        Select a preset skybox or upload your own equirectangular (360°) image ·
        Max 20MB
      </p>
    </div>
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

// ─── Image Uploader ───────────────────────────────────────────────────────
function ImageUploader({ value, onUpload, uploading, onClear, label }) {
  // const [preview, setPreview] = useState(value || "");
  const fileInputRef = useRef(null);

  // Sync preview when the real URL arrives from the parent (after upload completes)
  // useEffect(() => {
  //   if (value) setPreview(value);
  // }, [value]);

  // Clear preview when parent clears the value
  // useEffect(() => {
  //   if (!value && !uploading) setPreview("");
  // }, [value, uploading]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    onUpload(file); // parent handles preview via setThumbnailPreview
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative w-full rounded-2xl overflow-hidden cursor-pointer group"
        style={{
          height: 180,
          background: value ? "transparent" : "rgba(255,255,255,0.03)",
          border: value ? "none" : "2px dashed rgba(255,255,255,0.1)",
        }}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading}
        />

        {/* Always show image if we have a preview — even during upload */}
        {value && (
          <>
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover"
            />
            {/* Hover overlay to remove — only when not uploading */}
            {!uploading && (
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.55)" }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-semibold text-white"
                  style={{
                    background: "rgba(239,68,68,0.4)",
                    border: "1px solid rgba(239,68,68,0.5)",
                  }}
                >
                  <X size={13} /> Remove
                </button>
              </div>
            )}
          </>
        )}

        {/* Upload spinner overlay — shown ON TOP of image, not instead of it */}
        {uploading && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(2px)",
            }}
          >
            <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            <p
              className="text-[11px]"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Uploading...
            </p>
          </div>
        )}

        {/* Empty state — only when no preview and not uploading */}
        {!value && !uploading && (
          <div className="flex flex-col items-center justify-center gap-2 text-center h-full">
            <Upload size={24} style={{ color: "rgba(255,255,255,0.4)" }} />
            <p
              className="text-[12px]"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Click to upload {label}
            </p>
            <p
              className="text-[10px]"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              JPG, PNG, WebP · Max 5MB
            </p>
          </div>
        )}
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
          These changes will be applied to your event immediately.
        </p>

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
  // const LOCKED = ["name", "liveDate", "numberOfStalls", "backgroundType"];
  const LOCKED = ["name", "liveDate", "numberOfStalls", "backgroundType"];
  const LABELS = {
    description: "Description",
    numberOfStalls: "Number of Stalls",
    startTime: "Start Time",
    endTime: "End Time",
    backgroundType: "Background Type",
    customBackground: "Skybox",
    eventType: "Event Type",
    tags: "Tags",
    thumbnailUrl: "Thumbnail",
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
function LivePreview({ form, thumbnailPreview }) {
  const tags = form.tags
    ? form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const skyboxLabel =
    SKYBOX_PRESETS.find((p) => p.value === form.customBackground)?.label ||
    "Custom";

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
        {(thumbnailPreview || form.thumbnailUrl) && (
          <img
            key={thumbnailPreview || form.thumbnailUrl}
            src={thumbnailPreview || form.thumbnailUrl} // ← use preview first
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
          {form.numberOfStalls && (
            <span className="flex items-center gap-1.5">
              <Users size={10} /> {form.numberOfStalls} stalls
            </span>
          )}
          {form.customBackground && <span>🌐 {skyboxLabel}</span>}
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
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);

  const [publishing, setPublishing] = useState(false);
  const [event, setEvent] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");

  const loadData = useCallback(async (id) => {
    try {
      setLoading(true);
      const res = await eventAPI.getById(id);
      setEvent(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // useEffect(() => {
  //   if (eventId) loadData(eventId);
  // }, [eventId, loadData]);

  const handlePublish = async () => {
    try {
      setPublishing(true);

      // Optional: save changes first if dirty
      if (isDirty) {
        // Instead of calling handleSaveClick directly (which shows a modal),
        // you might want to auto-save or show a message
        const shouldSave = window.confirm(
          "You have unsaved changes. Save before publishing?",
        );
        if (shouldSave) {
          await handleConfirm(); // Call this directly to save without modal
        }
      }

      // Use eventId from params, not event._id
      await eventAPI.publish(eventId);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      setEvent((prev) => ({
        ...prev,
        status: "published", // or whatever your backend returns
      }));

      // Optionally refresh the event data to get updated status
      const refreshedEvent = await eventAPI.getById(eventId);
      setEvent(refreshedEvent.data);
    } catch (err) {
      alert(err.message || "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const res = await eventAPI.getById(eventId);
        const e = res.data;

        if (!e) {
          setError("Event not found");
          setForm(null);
          return;
        }

        // 👇 THIS IS THE CRITICAL FIX - set the event state
        setEvent(e); // Add this line

        const mapped = {
          name: e.name || "",
          description: e.description || "",
          numberOfStalls: e.numberOfStalls || 1,
          liveDate: e.liveDate ? e.liveDate.slice(0, 16) : "",
          startTime: e.startTime || "",
          endTime: e.endTime || "",
          backgroundType: e.backgroundType || "default",
          customBackground: e.customBackground || "",
          customBackgroundPublicId: e.customBackgroundPublicId || "",
          environmentType: e.environmentType || "indoor",
          eventType: e.eventType || "exhibition",
          tags: e.tags ? e.tags.join(", ") : "",
          thumbnailUrl: e.thumbnailUrl || "",
          thumbnailPublicId: e.thumbnailPublicId || "",
        };

        setForm(mapped);
        setThumbnailPreview(mapped.thumbnailUrl || "");
        setOriginal(mapped);
        setError(null);
      } catch (err) {
        setError(err.message || "Failed to fetch event");
        setForm(null);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) fetchEvent();
  }, [eventId]);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));
  const handle = (e) => {
    const { name, value } = e.target;
    set(name, value);
  };

  const handleSkyboxChange = ({
    backgroundType,
    customBackground,
    customBackgroundPublicId,
  }) => {
    setForm((f) => ({
      ...f,
      backgroundType,
      customBackground,
      customBackgroundPublicId,
    }));
  };

  const diff = original && form ? getDiff(original, form) : [];
  const isDirty = diff.length > 0;

  const handleSaveClick = () => {
    if (!form.thumbnailUrl) {
      setError("Thumbnail is required");
      return;
    }
    if (form.backgroundType === "upload" && !form.customBackground) {
      setError("Please upload a custom background or select a preset");
      return;
    }
    if (!isDirty) return;
    setShowConfirm(true);
  };

  const handleThumbnailUpload = async (file) => {
    if (!file) return;
    // Set blob preview instantly — shared with LivePreview
    const blobUrl = URL.createObjectURL(file);
    setThumbnailPreview(blobUrl);

    const formData = new FormData();
    formData.append("thumbnail", file);
    try {
      setUploadingThumbnail(true);
      const response = await eventAPI.uploadThumbnail(eventId, formData);
      if (response.success) {
        setForm((prev) => ({
          ...prev,
          thumbnailUrl: response.data.url,
          thumbnailPublicId: response.data.publicId,
        }));
        setThumbnailPreview(response.data.url); // swap blob → real URL
        window.location.reload();
      }
    } catch (err) {
      setError("Failed to upload thumbnail");
      setThumbnailPreview(form.thumbnailUrl || ""); // revert on error
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleBackgroundUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("background", file);
    try {
      setUploadingBackground(true);
      const response = await eventAPI.uploadBackground(eventId, formData);
      if (response.success) {
        setForm((f) => ({
          ...f,
          backgroundType: "upload",
          customBackground: response.data.customBackground,
          customBackgroundPublicId: response.data.publicId || "",
        }));
      }
    } catch (err) {
      setError("Failed to upload background");
    } finally {
      setUploadingBackground(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setSaving(true);
      const payload = {
        description: form.description,
        numberOfStalls: parseInt(form.numberOfStalls),
        startTime: form.startTime,
        endTime: form.endTime,
        backgroundType:
          form.backgroundType === "upload" ? "custom" : form.backgroundType,
        customBackground: form.customBackground,
        customBackgroundPublicId: form.customBackgroundPublicId,
        eventType: form.eventType,
        tags: form.tags
          ? form.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        thumbnailUrl: form.thumbnailUrl,
        thumbnailPublicId: form.thumbnailPublicId,
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

  // ── Loading / error states ─────────────────────────────────────────
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
      <div className="h-screen flex" style={{ background: "#0c0c0f" }}>
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
      className="h-screen flex"
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

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto px-6 md:px-8 py-7">
          {/* Header */}
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
              <button
                onClick={handlePublish}
                disabled={publishing || event?.status !== "approved"}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
                style={
                  event?.status === "approved"
                    ? {
                        background: "linear-gradient(135deg,#60a5fa,#3b82f6)",
                        border: "1px solid rgba(96,165,250,0.25)",
                        boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
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
                <Send size={14} />
                {publishing ? "Publishing..." : "Publish"}
              </button>
            </div>
          </motion.div>

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

          {/* <motion.div
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
              be changed after creation.
            </span>
          </motion.div> */}

          {/* 2-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">
            <div className="flex flex-col gap-5">
              {/* Basic Info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.3 }}
              >
                <Section title="Basic Information" icon={Info} accent="#a78bfa">
                  <Field label="Event Name" locked>
                    <StyledInput locked value={form.name} readOnly />
                  </Field>
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
                  <Field label="Number of Stalls" hint="1 – 500" locked>
                    <div className="flex items-center gap-3">
                      <button
                        disabled
                        type="button"
                        className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-lg"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.6)",
                          cursor: "not-allowed",
                          opacity: 0.5,
                        }}
                      >
                        −
                      </button>
                      <StyledInput
                        icon={Users}
                        type="number"
                        value={form.numberOfStalls}
                        disabled
                        style={lockedBase}
                      />
                      <button
                        disabled
                        type="button"
                        className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-lg"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.6)",
                          cursor: "not-allowed",
                          opacity: 0.5,
                        }}
                      >
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
                </Section>
              </motion.div>

              {/* Media */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <Section title="Media" icon={Image} accent="#fb923c">
                  <Field label="Event Thumbnail" hint="Upload an image">
                    <ImageUploader
                      value={thumbnailPreview}
                      onUpload={handleThumbnailUpload}
                      onClear={() => {
                        set("thumbnailUrl", "");
                        set("thumbnailPublicId", "");
                        setThumbnailPreview("");
                      }}
                      uploading={uploadingThumbnail}
                      label="thumbnail"
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

            {/* Right: live preview */}
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
              <LivePreview form={form} thumbnailPreview={thumbnailPreview} />
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
