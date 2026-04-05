import mongoose from "mongoose";

const { Schema } = mongoose;

const settingsSchema = new Schema(
  {
    // Default background for events
    defaultBackgroundUrl: {
      type: String,
      default: null,
    },

    defaultBackgroundPublicId: {
      type: String,
      default: null,
    },

    // Can add more settings in the future (email templates, system configs, etc.)
    systemName: {
      type: String,
      default: "Virtual Open House",
    },

    // Track when settings were last updated
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    lastUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Settings", settingsSchema);
