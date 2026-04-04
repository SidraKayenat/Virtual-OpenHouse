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
} from "lucide-react";
import DashboardNavbar from "@/components/navbar/DashboardNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { settingsAPI, eventAPI } from "@/lib/api";
import { toast } from "sonner";

const SETTINGS_TABS = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "general", label: "General", icon: Globe },
];

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("appearance");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    defaultBackgroundUrl: null,
    defaultBackgroundPublicId: null,
    systemName: "Virtual Open House",
    lastUpdatedBy: null,
    lastUpdatedAt: null,
  });

  const [systemName, setSystemName] = useState("");
  const [previewBackground, setPreviewBackground] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSettings();
      if (response.success) {
        setSettings(response.data);
        setSystemName(response.data.systemName || "Virtual Open House");
        setPreviewBackground(response.data.defaultBackgroundUrl);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error(error.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Save general settings
  const handleSaveGeneralSettings = async () => {
    setSaving(true);
    try {
      const response = await settingsAPI.updateSystemSettings({ systemName });
      if (response.success) {
        setSettings((prev) => ({ ...prev, systemName }));
        toast.success("Settings saved successfully");
      }
    } catch (error) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Upload default background
  const handleBackgroundUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("defaultBackground", file);

    try {
      const response = await settingsAPI.uploadDefaultBackground(formData);
      if (response.success) {
        setSettings((prev) => ({
          ...prev,
          defaultBackgroundUrl: response.data.defaultBackgroundUrl,
          lastUpdatedAt: new Date().toISOString(),
        }));
        setPreviewBackground(response.data.defaultBackgroundUrl);
        toast.success(response.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to upload background");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Remove default background
  const handleRemoveBackground = async () => {
    if (
      !confirm(
        "Are you sure you want to remove the default background? Events using the default background will show no background image.",
      )
    ) {
      return;
    }

    setUploading(true);
    try {
      const response = await settingsAPI.removeDefaultBackground();
      if (response.success) {
        setSettings((prev) => ({
          ...prev,
          defaultBackgroundUrl: null,
          defaultBackgroundPublicId: null,
        }));
        setPreviewBackground(null);
        toast.success("Default background removed");
      }
    } catch (error) {
      toast.error(error.message || "Failed to remove background");
    } finally {
      setUploading(false);
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render Appearance Tab
  const renderAppearanceTab = () => (
    <div className="space-y-6">
      {/* System Name Display */}
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
                {settings.systemName}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Building2 size={18} className="text-violet-400" />
            </div>
          </div>
        </div>

        <p className="text-xs text-white/40">
          The system name appears in the header, emails, and throughout the
          platform. To change it, go to the{" "}
          <button
            onClick={() => setActiveTab("general")}
            className="text-violet-400 hover:underline"
          >
            General
          </button>{" "}
          tab.
        </p>
      </div>

      {/* Default Background Settings */}
      <div className="rounded-xl bg-white/[0.025] border border-white/[0.07] p-6">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
          <Image size={16} className="text-violet-400" />
          Default Event Background
        </h3>

        <p className="text-xs text-white/40 mb-4">
          This background will be used for all events that use the "default"
          background type. Event organizers can choose to upload custom
          backgrounds for their events.
        </p>

        {/* Current Background Preview */}
        {previewBackground ? (
          <div className="mb-6">
            <div className="relative rounded-xl overflow-hidden h-52 bg-gradient-to-br from-violet-500/20 to-purple-500/20 group">
              <img
                src={previewBackground}
                alt="Default Background Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-3">
                  <button
                    onClick={() => window.open(previewBackground, "_blank")}
                    className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white text-xs hover:bg-white/20 transition-all"
                  >
                    <Eye size={12} className="inline mr-1" />
                    View Full
                  </button>
                  <button
                    onClick={handleRemoveBackground}
                    disabled={uploading}
                    className="px-3 py-1.5 rounded-lg bg-red-500/20 backdrop-blur-sm text-red-400 text-xs hover:bg-red-500/30 transition-all disabled:opacity-50"
                  >
                    <Trash2 size={12} className="inline mr-1" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
            {settings.lastUpdatedBy && (
              <div className="mt-3 flex items-center gap-4 text-[10px] text-white/30">
                <span className="flex items-center gap-1">
                  <User size={10} />
                  Updated by:{" "}
                  {settings.lastUpdatedBy.name || settings.lastUpdatedBy.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={10} />
                  {formatDate(settings.lastUpdatedAt)}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 rounded-xl h-52 bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center">
            <Palette size={36} className="text-white/20 mb-3" />
            <p className="text-sm text-white/30">No default background set</p>
            <p className="text-[11px] text-white/20 mt-1">
              Upload an image to use as default background for events
            </p>
          </div>
        )}

        {/* Upload Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleBackgroundUpload}
            className="hidden"
            id="background-upload"
          />
          <label
            htmlFor="background-upload"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 text-[13px] hover:bg-violet-500/30 transition-all cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          >
            {uploading ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            {previewBackground ? "Change Background" : "Upload Background"}
          </label>
          <p className="text-[10px] text-white/20 mt-3">
            Recommended: 1920×1080px (16:9 ratio), JPG or PNG, max 5MB
          </p>
        </div>
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
              When event organizers create events, they can choose between
              "Default Background" (this image) or upload a custom background.
              If you change this default background, all existing events using
              the default will automatically update to use the new image.
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
              Current System Name
            </span>
            <span className="text-[11px] text-white/60 font-mono">
              {settings.systemName}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/[0.05]">
            <span className="text-[11px] text-white/40">
              Default Background Status
            </span>
            <span className="text-[11px] text-white/60">
              {settings.defaultBackgroundUrl ? (
                <span className="flex items-center gap-1 text-green-400">
                  <CheckCircle size={10} />
                  Set
                </span>
              ) : (
                <span className="flex items-center gap-1 text-yellow-400">
                  <AlertCircle size={10} />
                  Not Set
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/[0.05]">
            <span className="text-[11px] text-white/40">
              Last Settings Update
            </span>
            <span className="text-[11px] text-white/60">
              {formatDate(settings.lastUpdatedAt)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-[11px] text-white/40">Platform Version</span>
            <span className="text-[11px] text-white/60">v1.0.0</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleSaveGeneralSettings}
        disabled={saving || systemName === settings.systemName}
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
