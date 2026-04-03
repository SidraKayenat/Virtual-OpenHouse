import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Image,
  Users,
  Send,
  Eye,
  EyeOff,
  X,
  Plus,
  Trash2,
  Upload,
  FileText,
  Info,
  Globe,
  Radio,
  RefreshCw,
  Film,
  File,
  GripVertical,
  Hash,
  Pencil,
  Building,
} from "lucide-react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { stallAPI } from "@/lib/api";

// ─── Steps ────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 0, label: "Overview", icon: FileText, desc: "Title & description" },
  { id: 1, label: "Media", icon: Image, desc: "Images, banner & video" },
  { id: 2, label: "Documents", icon: File, desc: "Brochures & files" },
  { id: 3, label: "Team", icon: Users, desc: "Team members" },
  { id: 4, label: "Publish", icon: Send, desc: "Review & go live" },
];

const ROLES = [
  "lead",
  "developer",
  "designer",
  "manager",
  "researcher",
  "other",
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

function Field({ label, required, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label
          className="text-[12px] font-semibold tracking-wide uppercase"
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
        minHeight: 110,
        borderColor: focused
          ? "rgba(167,139,250,0.5)"
          : "rgba(255,255,255,0.1)",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function StyledSelect({ children, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <select
        {...props}
        style={{
          ...inputBase,
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

// ─── Upload drop zone ─────────────────────────────────────────────────────
function DropZone({
  accept,
  multiple = false,
  onFiles,
  uploading,
  label,
  icon: Icon = Upload,
  hint,
}) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);
  return (
    <div
      className="relative flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer transition-all duration-200"
      style={{
        minHeight: 120,
        padding: 24,
        background: dragging
          ? "rgba(124,58,237,0.12)"
          : "rgba(255,255,255,0.02)",
        border: dragging
          ? "2px dashed rgba(167,139,250,0.6)"
          : "2px dashed rgba(255,255,255,0.1)",
      }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(multiple ? files : [files[0]]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p
            className="text-[12.5px]"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Uploading…
          </p>
        </div>
      ) : (
        <>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(167,139,250,0.12)",
              border: "1px solid rgba(167,139,250,0.2)",
            }}
          >
            <Icon size={18} style={{ color: "#a78bfa" }} />
          </div>
          <p
            className="text-[13px] font-medium text-center"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            {label}
          </p>
          {hint && (
            <p
              className="text-[11px]"
              style={{ color: "rgba(255,255,255,0.22)" }}
            >
              {hint}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ─── Step nav ─────────────────────────────────────────────────────────────
function StepNav({ currentStep, completedSteps, onGoTo, readiness }) {
  return (
    <div className="flex flex-col gap-1">
      {STEPS.map((step) => {
        const done = completedSteps.includes(step.id);
        const active = currentStep === step.id;
        const Icon = step.icon;
        return (
          <button
            key={step.id}
            onClick={() => onGoTo(step.id)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150"
            style={{
              background: active ? "rgba(124,58,237,0.18)" : "transparent",
              border: active
                ? "1px solid rgba(124,58,237,0.3)"
                : "1px solid transparent",
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
      {/* Overall progress */}
      <div className="mt-4 px-1">
        <div
          className="h-1 rounded-full"
          style={{ background: "rgba(255,255,255,0.07)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${readiness}%`,
              background: "linear-gradient(90deg,#7c3aed,#a78bfa)",
            }}
          />
        </div>
        <p
          className="text-[10px] mt-1.5 text-right"
          style={{ color: "rgba(255,255,255,0.22)" }}
        >
          {readiness}% complete
        </p>
      </div>
    </div>
  );
}

// ─── Checklist item ───────────────────────────────────────────────────────
function CheckItem({ label, ok, hint }) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl"
      style={{
        background: ok ? "rgba(52,211,153,0.06)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${ok ? "rgba(52,211,153,0.18)" : "rgba(255,255,255,0.07)"}`,
      }}
    >
      <div className="flex-shrink-0 mt-0.5">
        {ok ? (
          <CheckCircle size={15} style={{ color: "#34d399" }} />
        ) : (
          <AlertCircle size={15} style={{ color: "#fbbf24" }} />
        )}
      </div>
      <div>
        <p
          className="text-[13px] font-medium"
          style={{ color: ok ? "#6ee7b7" : "rgba(255,255,255,0.6)" }}
        >
          {label}
        </p>
        {hint && (
          <p
            className="text-[11px] mt-0.5"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Live Preview ─────────────────────────────────────────────────────────
function LivePreview({ stall }) {
  const banner = stall?.bannerImage?.url;
  const images = stall?.images || [];
  const videos = stall?.videos || []; // Get videos array from stall model
  const firstVideo = videos.length > 0 ? videos[0] : null; // Get first video if exists

  return (
    <div
      className="rounded-2xl overflow-hidden sticky top-6"
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        background: "#141320",
      }}
    >
      {/* Banner */}
      <div
        className="relative h-32 overflow-hidden"
        style={{ background: "linear-gradient(135deg,#1e1b30,#2d1f5e)" }}
      >
        {banner ? (
          <img
            src={banner}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p
              className="text-[11px]"
              style={{ color: "rgba(255,255,255,0.18)" }}
            >
              No banner
            </p>
          </div>
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
            background: stall?.isPublished
              ? "rgba(52,211,153,0.25)"
              : "rgba(251,191,36,0.2)",
            color: stall?.isPublished ? "#34d399" : "#fbbf24",
            backdropFilter: "blur(6px)",
            border: `1px solid ${stall?.isPublished ? "rgba(52,211,153,0.3)" : "rgba(251,191,36,0.25)"}`,
          }}
        >
          {stall?.isPublished ? "Published" : "Draft"}
        </span>
      </div>
      <div className="p-4 flex flex-col gap-2.5">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            Stall #{stall?.stallNumber}
          </p>
          <h3
            className="text-white font-bold text-[14px] leading-snug"
            style={{ fontFamily: "'Syne',sans-serif" }}
          >
            {stall?.projectTitle || (
              <span style={{ color: "rgba(255,255,255,0.2)" }}>
                Project title…
              </span>
            )}
          </h3>
        </div>
        {stall?.projectDescription && (
          <p
            className="text-[11.5px] line-clamp-2 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            {stall.projectDescription}
          </p>
        )}
        {/* Image thumbnails */}
        {images.length > 0 && (
          <div className="flex gap-1.5">
            {images.slice(0, 4).map((img, i) => (
              <div
                key={img.publicId || i}
                className="flex-1 h-12 rounded-lg overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {images.length > 4 && (
              <div
                className="flex-1 h-12 rounded-lg flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                +{images.length - 4}
              </div>
            )}
          </div>
        )}

        {/* Video Preview - FIXED: Check videos array */}
        {firstVideo?.url && (
          <div className="flex flex-col gap-1.5">
            <div
              className="w-full rounded-lg overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <video
                src={firstVideo.url}
                controls
                className="w-full max-h-32 rounded-lg"
                style={{ maxHeight: "120px" }}
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
            {firstVideo.title && (
              <p
                className="text-[10px] text-center truncate"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {firstVideo.title}
              </p>
            )}
            {!firstVideo.title && (
              <p
                className="text-[10px] text-center"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                Demo Video
              </p>
            )}
          </div>
        )}
        {stall?.teamMembers?.length > 0 && (
          <div
            className="flex items-center gap-1.5 text-[11px]"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            <Users size={11} /> {stall.teamMembers.length} team member
            {stall.teamMembers.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────
export default function StallEditor() {
  const { stallId } = useParams();
  const navigate = useNavigate();

  const [stall, setStall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null); // "saved" | "error"
  const [publishing, setPublishing] = useState(false);
  const [errors, setErrors] = useState({});

  // Upload states
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);

  // Caption editing
  const [editingCaption, setEditingCaption] = useState(null); // publicId
  const [captionValue, setCaptionValue] = useState("");

  // Local form state (synced from stall)
  const [form, setForm] = useState({
    projectTitle: "",
    projectDescription: "",
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [newMember, setNewMember] = useState({ name: "", role: "other" });
  const [memberErr, setMemberErr] = useState("");

  const loadStall = useCallback(async () => {
    try {
      setLoading(true);
      const res = await stallAPI.getById(stallId);
      const s = res.data;
      setStall(s);
      setForm({
        projectTitle: s.projectTitle || "",
        projectDescription: s.projectDescription || "",
      });
      setTeamMembers(s.teamMembers || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [stallId]);

  useEffect(() => {
    loadStall();
  }, []);

  // ── Auto-save overview on blur (debounced) ─────────────────────────────
  const saveTimer = useRef(null);
  const triggerSave = (updates) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        setSaving(true);
        const res = await stallAPI.update(stallId, updates);
        setStall(res.data);
        setSaveMsg("saved");
        setTimeout(() => setSaveMsg(null), 2500);
      } catch {
        setSaveMsg("error");
      } finally {
        setSaving(false);
      }
    }, 800);
  };

  const setField = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    triggerSave({ [key]: val });
  };

  // ── Media uploads ──────────────────────────────────────────────────────
  const handleImages = async (files) => {
    try {
      setUploadingImages(true);
      await stallAPI.uploadImages(stallId, files);
      await loadStall();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleBanner = async (files) => {
    try {
      setUploadingBanner(true);
      await stallAPI.uploadBanner(stallId, files[0]);
      await loadStall();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleVideo = async (files) => {
    try {
      setUploadingVideo(true);
      const response = await stallAPI.uploadVideo(stallId, files[0]);
      console.log("Video upload response:", response); // Check what's returned

      // If the response contains the video data, you might need to set it
      // Or just reload the stall to get the updated data
      await loadStall();

      // After reload, log the stall video data
      console.log("Stall after reload:", stall); // This will be stale, but check in next render
    } catch (e) {
      console.error("Upload error:", e);
      setError(e.message);
    } finally {
      setUploadingVideo(false);
    }
  };
  const handleDocuments = async (files) => {
    try {
      setUploadingDocuments(true);
      await stallAPI.uploadDocuments(stallId, files);
      await loadStall();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploadingDocuments(false);
    }
  };

  const handleDeleteImage = async (publicId) => {
    try {
      await stallAPI.deleteImage(stallId, publicId);
      await loadStall();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDeleteDocument = async (publicId) => {
    if (!window.confirm("Are you sure you want to delete this document?"))
      return;

    try {
      await stallAPI.deleteDocument(stallId, publicId);
      await loadStall(); // refresh UI
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSaveCaption = async (publicId) => {
    try {
      await stallAPI.updateImageCaption(stallId, publicId, captionValue);
      setEditingCaption(null);
      await loadStall();
    } catch (e) {
      setError(e.message);
    }
  };

  // ── Team ───────────────────────────────────────────────────────────────
  const addMember = async () => {
    if (!newMember.name.trim()) {
      setMemberErr("Enter a name");
      return;
    }
    const updated = [
      ...teamMembers,
      { name: newMember.name.trim(), role: newMember.role },
    ];
    try {
      const res = await stallAPI.update(stallId, { teamMembers: updated });
      setStall(res.data);
      setTeamMembers(updated);
      setNewMember({ name: "", role: "other" });
      setMemberErr("");
    } catch (e) {
      setError(e.message);
    }
  };

  const removeMember = async (i) => {
    const updated = teamMembers.filter((_, idx) => idx !== i);
    try {
      const res = await stallAPI.update(stallId, { teamMembers: updated });
      setStall(res.data);
      setTeamMembers(updated);
    } catch (e) {
      setError(e.message);
    }
  };

  const updateMemberField = async (i, key, val) => {
    const updated = teamMembers.map((m, idx) =>
      idx === i ? { ...m, [key]: val } : m,
    );
    setTeamMembers(updated);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await stallAPI.update(stallId, { teamMembers: updated });
        setStall(res.data);
      } catch {}
    }, 700);
  };

  // ── Publish ────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    try {
      setPublishing(true);
      const res = await stallAPI.publish(stallId);
      setStall(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      setPublishing(true);
      const res = await stallAPI.unpublish(stallId);
      setStall(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setPublishing(false);
    }
  };

  // ── Readiness ──────────────────────────────────────────────────────────
  const checks = stall
    ? {
        title: !!stall.projectTitle,
        description: !!stall.projectDescription,
        images: (stall.images || []).length > 0,
        banner: !!stall.bannerImage?.url,
      }
    : {};

  const checkCount = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length || 4;
  const readiness = Math.round((checkCount / totalChecks) * 100);
  const isReady = checkCount === totalChecks;

  const goToStep = (n) => setStep(n);
  const nextStep = () => {
    if (!done.includes(step)) setDone((d) => [...d, step]);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const fadeUp = {
    initial: { opacity: 0, y: 14 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
    },
    exit: { opacity: 0, y: -10, transition: { duration: 0.18 } },
  };

  // ── Loading ────────────────────────────────────────────────────────────
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
                Loading stall…
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!stall) {
    return (
      <div className="h-screen flex" style={{ background: "#0c0c0f" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-white font-semibold mb-2">Stall not found</p>
              <p
                className="text-[13px] mb-4"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {error}
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

  const images = stall.images || [];
  const docs = stall.documents || [];

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
        ::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto px-6 md:px-8 py-7">
          {/* Error */}
          {error && (
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
                  className="text-white text-xl font-bold truncate"
                  style={{ fontFamily: "'Syne',sans-serif" }}
                >
                  {stall.projectTitle || "Stall Editor"}
                </h1>
                <p
                  className="text-[12.5px]"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {stall.event?.name} · Step {step + 1} of {STEPS.length}
                </p>
              </div>
            </div>

            {/* Right: save indicator + publish toggle */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Auto-save indicator */}
              <AnimatePresence mode="wait">
                {saving && (
                  <motion.span
                    key="saving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-[11.5px]"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    <RefreshCw size={11} className="animate-spin" /> Saving…
                  </motion.span>
                )}
                {saveMsg === "saved" && !saving && (
                  <motion.span
                    key="saved"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-[11.5px]"
                    style={{ color: "#34d399" }}
                  >
                    <CheckCircle size={11} /> Saved
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Publish / Unpublish */}
              {stall.isPublished ? (
                <div className="flex items-center gap-2">
                  <span
                    className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-full"
                    style={{
                      background: "rgba(52,211,153,0.12)",
                      color: "#34d399",
                      border: "1px solid rgba(52,211,153,0.25)",
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />{" "}
                    Published
                  </span>
                  <button
                    onClick={handleUnpublish}
                    disabled={publishing}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-medium transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      color: "rgba(255,255,255,0.5)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <EyeOff size={13} /> Unpublish
                  </button>
                </div>
              ) : (
                <button
                  onClick={handlePublish}
                  disabled={!isReady || publishing}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
                  style={
                    isReady
                      ? {
                          background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
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
                  {publishing ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />{" "}
                      Publishing…
                    </>
                  ) : (
                    <>
                      <Radio size={13} /> Publish Stall
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>

          {/* ── 3-column layout ── */}
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
                  Sections
                </p>
                <StepNav
                  currentStep={step}
                  completedSteps={done}
                  onGoTo={goToStep}
                  readiness={readiness}
                />
              </div>
            </motion.div>

            {/* ── Center: content ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.3 }}
            >
              <div
                className="rounded-2xl p-6 min-h-[480px] flex flex-col"
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
                    {/* ── STEP 0: Overview ── */}
                    {step === 0 && (
                      <>
                        <Field
                          label="Project Title"
                          required
                          error={errors.title}
                          hint={`${form.projectTitle.length}/200`}
                        >
                          <StyledInput
                            icon={Hash}
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
                          error={errors.desc}
                          hint={`${form.projectDescription.length}/1000`}
                        >
                          <StyledTextarea
                            placeholder="Describe your project — what it does, who it's for, what makes it special…"
                            value={form.projectDescription}
                            rows={6}
                            maxLength={1000}
                            onChange={(e) =>
                              setField("projectDescription", e.target.value)
                            }
                          />
                        </Field>
                        <div
                          className="p-3.5 rounded-xl text-[12px]"
                          style={{
                            background: "rgba(167,139,250,0.06)",
                            border: "1px solid rgba(167,139,250,0.15)",
                            color: "#c4b5fd",
                          }}
                        >
                          <Info size={13} className="inline mr-1.5 mb-0.5" />
                          Changes auto-save as you type. No need to click Save.
                        </div>
                      </>
                    )}

                    {/* ── STEP 1: Media ── */}
                    {step === 1 && (
                      <>
                        {/* Banner */}
                        <div>
                          <p
                            className="text-[12px] font-bold uppercase tracking-widest mb-3"
                            style={{ color: "rgba(255,255,255,0.35)" }}
                          >
                            Banner Image
                          </p>
                          {stall.bannerImage?.url ? (
                            <div className="relative w-full h-40 rounded-2xl overflow-hidden group">
                              <img
                                src={stall.bannerImage.url}
                                alt="Banner"
                                className="w-full h-full object-cover"
                              />
                              <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3"
                                style={{ background: "rgba(0,0,0,0.55)" }}
                              >
                                <label
                                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-semibold cursor-pointer text-white transition-all"
                                  style={{
                                    background: "rgba(124,58,237,0.35)",
                                    border: "1px solid rgba(167,139,250,0.4)",
                                  }}
                                >
                                  <Upload size={13} /> Replace
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files[0])
                                        handleBanner([e.target.files[0]]);
                                    }}
                                  />
                                </label>
                              </div>
                              {uploadingBanner && (
                                <div
                                  className="absolute inset-0 flex items-center justify-center"
                                  style={{ background: "rgba(0,0,0,0.6)" }}
                                >
                                  <div className="w-6 h-6 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <DropZone
                              accept="image/*"
                              onFiles={handleBanner}
                              uploading={uploadingBanner}
                              label="Upload banner image"
                              icon={Image}
                              hint="Recommended: 1200×400px · JPG, PNG, WebP"
                            />
                          )}
                        </div>

                        {/* Gallery */}
                        <div>
                          <p
                            className="text-[12px] font-bold uppercase tracking-widest mb-3"
                            style={{ color: "rgba(255,255,255,0.35)" }}
                          >
                            Gallery Images
                          </p>
                          {images.length > 0 && (
                            <div className="grid grid-cols-3 gap-3 mb-3">
                              {images.map((img) => (
                                <div
                                  key={img.publicId}
                                  className="relative rounded-xl overflow-hidden group"
                                  style={{ aspectRatio: "4/3" }}
                                >
                                  <img
                                    src={img.url}
                                    alt={img.caption || ""}
                                    className="w-full h-full object-cover"
                                  />
                                  {/* Caption overlay */}
                                  <div
                                    className="absolute bottom-0 left-0 right-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: "rgba(0,0,0,0.7)" }}
                                  >
                                    {editingCaption === img.publicId ? (
                                      <div className="flex gap-1">
                                        <input
                                          autoFocus
                                          value={captionValue}
                                          onChange={(e) =>
                                            setCaptionValue(e.target.value)
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter")
                                              handleSaveCaption(img.publicId);
                                            if (e.key === "Escape")
                                              setEditingCaption(null);
                                          }}
                                          className="flex-1 text-[10px] px-2 py-1 rounded outline-none"
                                          style={{
                                            background:
                                              "rgba(255,255,255,0.12)",
                                            color: "white",
                                            border:
                                              "1px solid rgba(255,255,255,0.2)",
                                          }}
                                          placeholder="Add caption…"
                                        />
                                        <button
                                          onClick={() =>
                                            handleSaveCaption(img.publicId)
                                          }
                                          className="px-1.5 rounded text-[9px] font-bold"
                                          style={{
                                            background: "rgba(52,211,153,0.3)",
                                            color: "#34d399",
                                          }}
                                        >
                                          ✓
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setEditingCaption(img.publicId);
                                          setCaptionValue(img.caption || "");
                                        }}
                                        className="flex items-center gap-1 text-[10px] w-full truncate"
                                        style={{
                                          color: "rgba(255,255,255,0.6)",
                                        }}
                                      >
                                        <Pencil size={9} />{" "}
                                        {img.caption || "Add caption…"}
                                      </button>
                                    )}
                                  </div>
                                  {/* Delete button */}
                                  <button
                                    onClick={() =>
                                      handleDeleteImage(img.publicId)
                                    }
                                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{
                                      background: "rgba(239,68,68,0.75)",
                                      color: "white",
                                    }}
                                  >
                                    <X size={11} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <DropZone
                            accept="image/*"
                            multiple
                            onFiles={handleImages}
                            uploading={uploadingImages}
                            label="Upload gallery images"
                            icon={Image}
                            hint="Multiple files allowed · Max 10MB each"
                          />
                        </div>

                        {/* Video */}
                        <div>
                          <p
                            className="text-[12px] font-bold uppercase tracking-widest mb-3"
                            style={{ color: "rgba(255,255,255,0.35)" }}
                          >
                            Demo Video{" "}
                            <span
                              className="normal-case font-normal text-[11px]"
                              style={{ color: "rgba(255,255,255,0.25)" }}
                            >
                              Optional
                            </span>
                          </p>

                          {/* Check if videos array exists and has at least one video */}
                          {stall.videos &&
                          stall.videos.length > 0 &&
                          stall.videos[0]?.url ? (
                            <div className="relative w-full rounded-2xl overflow-hidden group">
                              <video
                                src={stall.videos[0].url}
                                controls
                                className="w-full max-h-48 rounded-2xl"
                              />
                              {/* Delete video button */}
                              <button
                                onClick={async () => {
                                  try {
                                    // You'll need to implement a deleteVideo API call
                                    // For now, just show a confirmation
                                    if (confirm("Delete this video?")) {
                                      await stallAPI.deleteVideo?.(
                                        stallId,
                                        stall.videos[0].publicId,
                                      );
                                      await loadStall();
                                    }
                                  } catch (e) {
                                    setError(e.message);
                                  }
                                }}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{
                                  background: "rgba(239,68,68,0.85)",
                                  color: "white",
                                }}
                              >
                                <X size={14} />
                              </button>
                              {stall.videos[0].title && (
                                <p
                                  className="text-[11px] mt-2 text-center"
                                  style={{ color: "rgba(255,255,255,0.4)" }}
                                >
                                  {stall.videos[0].title}
                                </p>
                              )}
                            </div>
                          ) : (
                            <DropZone
                              accept="video/*"
                              onFiles={handleVideo}
                              uploading={uploadingVideo}
                              label="Upload demo video"
                              icon={Film}
                              hint="MP4, MOV · Max 100MB"
                            />
                          )}
                        </div>
                      </>
                    )}

                    {/* ── STEP 2: Documents ── */}
                    {step === 2 && (
                      <>
                        <div
                          className="p-3.5 rounded-xl text-[12px] mb-1"
                          style={{
                            background: "rgba(96,165,250,0.06)",
                            border: "1px solid rgba(96,165,250,0.15)",
                            color: "#93c5fd",
                          }}
                        >
                          <Info size={13} className="inline mr-1.5 mb-0.5" />
                          Upload brochures, pitch decks, or any relevant PDFs
                          for visitors to download.
                        </div>
                        {docs.length > 0 && (
                          <div className="flex flex-col gap-2 mb-2">
                            {docs.map((doc, i) => (
                              <div
                                key={doc.publicId || i}
                                className="flex items-center gap-3 p-3 rounded-xl"
                                style={{
                                  background: "rgba(255,255,255,0.03)",
                                  border: "1px solid rgba(255,255,255,0.07)",
                                }}
                              >
                                <div
                                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{
                                    background: "rgba(167,139,250,0.12)",
                                  }}
                                >
                                  <File
                                    size={15}
                                    style={{ color: "#a78bfa" }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-[13px] font-medium truncate">
                                    {doc.filename || `Document ${i + 1}`}
                                  </p>
                                  {doc.size && (
                                    <p
                                      className="text-[10.5px]"
                                      style={{ color: "rgba(255,255,255,0.3)" }}
                                    >
                                      {(doc.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {/* Download */}
                                  <a
                                    href={`${doc.url}?fl_attachment=${doc.filename}`}
                                    download={doc.filename}
                                    className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                                    style={{
                                      background: "rgba(167,139,250,0.1)",
                                      color: "#c4b5fd",
                                      border:
                                        "1px solid rgba(167,139,250,0.18)",
                                    }}
                                  >
                                    Download
                                  </a>

                                  {/* Delete */}
                                  <button
                                    onClick={() =>
                                      handleDeleteDocument(
                                        encodeURIComponent(doc.publicId),
                                      )
                                    }
                                    className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                                    style={{
                                      background: "rgba(239,68,68,0.1)",
                                      color: "#fca5a5",
                                      border: "1px solid rgba(239,68,68,0.18)",
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <DropZone
                          accept=".pdf,.doc,.docx,.ppt,.pptx"
                          multiple
                          onFiles={handleDocuments}
                          uploading={uploadingDocuments}
                          label="Upload documents"
                          icon={File}
                          hint="PDF, DOC, PPT · Multiple files allowed"
                        />
                      </>
                    )}

                    {/* ── STEP 3: Team ── */}
                    {step === 3 && (
                      <>
                        {/* Add member */}
                        <Field
                          label="Add Team Member"
                          hint={`${teamMembers.length} members`}
                        >
                          <div className="flex gap-2">
                            <div className="flex-1 relative">
                              <Users
                                size={13}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                style={{ color: "rgba(255,255,255,0.25)" }}
                              />
                              <input
                                type="text"
                                placeholder="Member name"
                                value={newMember.name}
                                onChange={(e) => {
                                  setNewMember((m) => ({
                                    ...m,
                                    name: e.target.value,
                                  }));
                                  setMemberErr("");
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
                            <div className="w-32 flex-shrink-0">
                              <StyledSelect
                                value={newMember.role}
                                onChange={(e) =>
                                  setNewMember((m) => ({
                                    ...m,
                                    role: e.target.value,
                                  }))
                                }
                              >
                                {ROLES.map((r) => (
                                  <option key={r} value={r}>
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                  </option>
                                ))}
                              </StyledSelect>
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
                          {memberErr && (
                            <p
                              className="text-[11.5px] mt-1"
                              style={{ color: "#f87171" }}
                            >
                              {memberErr}
                            </p>
                          )}
                        </Field>

                        {/* Member list */}
                        {teamMembers.length === 0 ? (
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
                              No team members yet
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {teamMembers.map((m, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-3 p-3 rounded-xl"
                                style={{
                                  background: "rgba(124,58,237,0.07)",
                                  border: "1px solid rgba(124,58,237,0.15)",
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
                                    onChange={(e) =>
                                      updateMemberField(
                                        i,
                                        "name",
                                        e.target.value,
                                      )
                                    }
                                    style={{
                                      ...inputBase,
                                      padding: "7px 12px",
                                      fontSize: 13,
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
                                        updateMemberField(
                                          i,
                                          "role",
                                          e.target.value,
                                        )
                                      }
                                      style={{
                                        ...inputBase,
                                        padding: "7px 28px 7px 12px",
                                        fontSize: 13,
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

                    {/* ── STEP 4: Publish ── */}
                    {step === 4 && (
                      <>
                        <div className="flex flex-col gap-3">
                          <p
                            className="text-[11px] font-bold uppercase tracking-widest"
                            style={{ color: "rgba(255,255,255,0.3)" }}
                          >
                            Readiness Checklist
                          </p>
                          <CheckItem
                            label="Project Title"
                            ok={checks.title}
                            hint="Required before publishing"
                          />
                          <CheckItem
                            label="Project Description"
                            ok={checks.description}
                            hint="Required before publishing"
                          />
                          <CheckItem
                            label="Gallery Images"
                            ok={checks.images}
                            hint="At least 1 image required"
                          />
                          <CheckItem
                            label="Banner Image"
                            ok={checks.banner}
                            hint="Required for visual appeal"
                          />
                          <CheckItem
                            label="Team Members"
                            ok={(stall.teamMembers?.length || 0) > 0}
                            hint="Optional but recommended"
                          />
                          <CheckItem
                            label="Demo Video"
                            ok={stall.videos && stall.videos.length > 0}
                            hint="Optional — great for engagement"
                          />
                          <CheckItem
                            label="Documents"
                            ok={docs.length > 0}
                            hint="Optional — brochures, pitch decks"
                          />
                        </div>

                        {/* Score bar */}
                        <div
                          className="p-4 rounded-xl"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.07)",
                          }}
                        >
                          <div className="flex justify-between text-[12px] mb-2">
                            <span style={{ color: "rgba(255,255,255,0.45)" }}>
                              Overall readiness
                            </span>
                            <span
                              className="font-bold"
                              style={{
                                color:
                                  readiness === 100 ? "#34d399" : "#a78bfa",
                              }}
                            >
                              {readiness}%
                            </span>
                          </div>
                          <div
                            className="h-2 rounded-full"
                            style={{ background: "rgba(255,255,255,0.07)" }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${readiness}%`,
                                background:
                                  readiness === 100
                                    ? "linear-gradient(90deg,#34d399,#6ee7b7)"
                                    : "linear-gradient(90deg,#7c3aed,#a78bfa)",
                              }}
                            />
                          </div>
                        </div>

                        {isReady ? (
                          <div
                            className="p-4 rounded-xl"
                            style={{
                              background: "rgba(52,211,153,0.07)",
                              border: "1px solid rgba(52,211,153,0.2)",
                            }}
                          >
                            <p
                              className="text-[13px] font-semibold"
                              style={{ color: "#6ee7b7" }}
                            >
                              ✓ All required fields complete — your stall is
                              ready to publish!
                            </p>
                          </div>
                        ) : (
                          <div
                            className="p-4 rounded-xl"
                            style={{
                              background: "rgba(251,191,36,0.07)",
                              border: "1px solid rgba(251,191,36,0.2)",
                              color: "#fde68a",
                            }}
                          >
                            <p className="text-[12.5px]">
                              <Info
                                size={13}
                                className="inline mr-1.5 mb-0.5"
                              />
                              Complete the required fields above before you can
                              publish. Go back to the relevant sections using
                              the left nav.
                            </p>
                          </div>
                        )}

                        {/* Publish / Unpublish big button */}
                        <button
                          onClick={
                            stall.isPublished ? handleUnpublish : handlePublish
                          }
                          disabled={
                            (!isReady && !stall.isPublished) || publishing
                          }
                          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-bold text-white transition-all"
                          style={
                            stall.isPublished
                              ? {
                                  background: "rgba(148,163,184,0.12)",
                                  border: "1px solid rgba(148,163,184,0.2)",
                                  color: "#94a3b8",
                                }
                              : isReady
                                ? {
                                    background:
                                      "linear-gradient(135deg,#7c3aed,#6d28d9)",
                                    border: "1px solid rgba(167,139,250,0.3)",
                                    boxShadow:
                                      "0 6px 24px rgba(124,58,237,0.35)",
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
                          {publishing ? (
                            <>
                              <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />{" "}
                              Processing…
                            </>
                          ) : stall.isPublished ? (
                            <>
                              <EyeOff size={16} /> Unpublish Stall
                            </>
                          ) : (
                            <>
                              <Radio size={16} /> Publish Stall
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* ── Nav buttons ── */}
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
                Live Preview
              </p>
              <LivePreview
                stall={{
                  ...stall,
                  projectTitle: form.projectTitle,
                  projectDescription: form.projectDescription,
                  teamMembers,
                }}
              />
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
    </div>
  );
}
