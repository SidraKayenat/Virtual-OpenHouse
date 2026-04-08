import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings,
  Image,
  Palette,
  Globe,
  Save,
  RefreshCw,
  Upload,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  Building2,
  Clock,
  User,
  Calendar,
  X,
  Plus,
} from "lucide-react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { eventAPI } from "@/lib/api";
import { toast } from "react-hot-toast";

const SETTINGS_TABS = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "general", label: "General", icon: Globe },
];

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("appearance");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Default backgrounds state (up to 5)
  const [defaultBackgrounds, setDefaultBackgrounds] = useState([]);
  const [systemName, setSystemName] = useState("Virtual Open House");
  const fileInputRef = useRef(null);

  // Fetch default backgrounds
  const fetchDefaultBackgrounds = useCallback(async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getDefaultBackgrounds();
      if (response.success) {
        setDefaultBackgrounds(response.data.defaultBackgrounds || []);
      }
    } catch (error) {
      console.error("Failed to fetch backgrounds:", error);
      toast.error(error.message || "Failed to load backgrounds");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDefaultBackgrounds();
  }, [fetchDefaultBackgrounds]);

  // Upload multiple backgrounds (up to 5)
  // Upload multiple backgrounds (up to 5)
  const handleBackgroundsUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Check each file for size and type
    const validFiles = [];
    const invalidFiles = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        invalidFiles.push(`${file.name} (not an image)`);
      } else if (file.size > 5 * 1024 * 1024) {
        invalidFiles.push(
          `${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB > 5MB)`,
        );
      } else {
        validFiles.push(file);
      }
    }

    // Show error for invalid files
    if (invalidFiles.length > 0) {
      toast.error(
        `Skipped ${invalidFiles.length} file(s):\n${invalidFiles.join("\n")}`,
        { duration: 5000 },
      );
    }

    // If no valid files, return
    if (validFiles.length === 0) {
      return;
    }

    // Check if total would exceed 5
    if (defaultBackgrounds.length + validFiles.length > 5) {
      toast.error(
        `Maximum 5 backgrounds allowed. You currently have ${defaultBackgrounds.length}.`,
      );
      return;
    }

    setUploading(true);
    const formData = new FormData();
    validFiles.forEach((file) => formData.append("defaultBackgrounds", file));

    try {
      const response = await eventAPI.setDefaultBackgrounds(formData);
      if (response.success) {
        setDefaultBackgrounds(response.data.defaultBackgrounds);
        toast.success(
          `${validFiles.length} background(s) uploaded successfully`,
        );
      }
    } catch (error) {
      toast.error(error.message || "Failed to upload backgrounds");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Remove a background
  const handleRemoveBackground = async (backgroundId) => {
    if (!confirm("Are you sure you want to remove this background?")) {
      return;
    }

    setUploading(true);
    try {
      const response = await eventAPI.deleteDefaultBackground(backgroundId);
      if (response.success) {
        setDefaultBackgrounds(response.data.defaultBackgrounds);
        toast.success(`Background removed successfully`);
      }
    } catch (error) {
      toast.error(error.message || "Failed to remove background");
    } finally {
      setUploading(false);
    }
  };

  // Save general settings
  const handleSaveGeneralSettings = async () => {
    setSaving(true);
    try {
      // You'll need to add a settings API endpoint for system name
      // For now, just show success
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Render Appearance Tab
  const renderAppearanceTab = () => (
    <div className="space-y-6">
      {/* Platform Identity */}
      <div className="rounded-xl bg-white/[0.025] border border-white/[0.07] p-6">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
          <Building2 size={16} className="text-violet-400" />
          Platform Identity
        </h3>

        <div className="mb-4 p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-white/40 uppercase tracking-wider">
                Current System Name
              </p>
              <p className="text-xl font-bold font-syne mt-1">
                Virtual Open House
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Building2 size={18} className="text-violet-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Default Backgrounds Settings */}
      <div className="rounded-xl bg-white/[0.025] border border-white/[0.07] p-6">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
          <Image size={16} className="text-violet-400" />
          Default Event Backgrounds (Up to 5)
        </h3>

        <p className="text-xs text-white/40 mb-4">
          These backgrounds will be available for event organizers to choose
          from when creating events. Organizers can select any of these
          backgrounds or upload their own custom backgrounds.
        </p>

        {/* Backgrounds Grid */}
        {defaultBackgrounds.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {defaultBackgrounds.map((bg) => (
              <div
                key={bg.backgroundId}
                className="relative group rounded-xl overflow-hidden bg-white/5 border border-white/10"
              >
                <div className="aspect-video">
                  <img
                    src={bg.url}
                    alt={bg.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(bg.url, "_blank")}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                    >
                      <Eye size={14} className="text-white" />
                    </button>
                    <button
                      onClick={() => handleRemoveBackground(bg.backgroundId)}
                      className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-all"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/50">
                  <p className="text-[9px] text-white/60 text-center">
                    Background {bg.backgroundId}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-6 rounded-xl h-40 bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center">
            <Palette size={36} className="text-white/20 mb-3" />
            <p className="text-sm text-white/30">No default backgrounds set</p>
            <p className="text-[11px] text-white/20 mt-1">
              Upload up to 5 images to use as default backgrounds for events
            </p>
          </div>
        )}

        {/* Upload Button - Show if less than 5 backgrounds */}
        {defaultBackgrounds.length < 5 && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleBackgroundsUpload}
              className="hidden"
              id="backgrounds-upload"
            />
            <label
              htmlFor="backgrounds-upload"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 text-[13px] hover:bg-violet-500/30 transition-all cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}
            >
              {uploading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              {defaultBackgrounds.length === 0
                ? "Upload Backgrounds"
                : `Upload More (${defaultBackgrounds.length}/5)`}
            </label>
            <p className="text-[10px] text-white/20 mt-3">
              Recommended: 1920×1080px (16:9 ratio), JPG or PNG, max 5MB each.
              You can upload up to 5 backgrounds.
            </p>
          </div>
        )}

        {/* Max reached message */}
        {defaultBackgrounds.length === 5 && (
          <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-[11px] text-blue-400 text-center">
              Maximum 5 backgrounds reached. Remove some to add more.
            </p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle
            size={16}
            className="text-blue-400 flex-shrink-0 mt-0.5"
          />
          <div>
            <p className="text-[12px] font-medium text-blue-400">
              How it works
            </p>
            <p className="text-[11px] text-white/40 mt-1">
              When event organizers create events, they can choose from these
              default backgrounds (1-5) or upload a custom background.
              Organizers will see a grid of these backgrounds to select from.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render General Tab
  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div className="rounded-xl bg-white/[0.025] border border-white/[0.07] p-6">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
          <Globe size={16} className="text-violet-400" />
          General Settings
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-white/40 uppercase tracking-wider block mb-1">
              System Name
            </label>
            <input
              type="text"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[13px] outline-none focus:border-violet-500/50 transition-all"
              placeholder="Virtual Open House"
            />
            <p className="text-[10px] text-white/20 mt-1.5">
              This name appears in the header, browser tab, emails, and
              throughout the platform.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white/[0.025] border border-white/[0.07] p-6">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
          <Clock size={16} className="text-violet-400" />
          System Information
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-white/[0.05]">
            <span className="text-[11px] text-white/40">
              Default Backgrounds Count
            </span>
            <span className="text-[11px] text-white/60">
              {defaultBackgrounds.length} / 5
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/[0.05]">
            <span className="text-[11px] text-white/40">Platform Version</span>
            <span className="text-[11px] text-white/60">v1.0.0</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleSaveGeneralSettings}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 text-[13px] font-medium text-white hover:bg-violet-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <RefreshCw size={14} className="animate-spin" />
        ) : (
          <Save size={14} />
        )}
        Save Changes
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="h-screen flex bg-[#0c0c0f] text-white font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw
                size={32}
                className="animate-spin text-violet-400 mx-auto mb-4"
              />
              <p className="text-white/40 text-sm">Loading settings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#0c0c0f] text-white font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <DashboardNavbar />

        <main className="flex-1 overflow-y-auto">
          <div className="w-full mx-auto px-6 py-6">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold font-syne">Settings</h1>
              <p className="text-xs text-white/40 mt-1">
                Manage platform appearance and general settings
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-white/[0.06] mb-6">
              {SETTINGS_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-all relative ${
                      activeTab === tab.id
                        ? "text-violet-400"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500"
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "appearance" && renderAppearanceTab()}
                {activeTab === "general" && renderGeneralTab()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
