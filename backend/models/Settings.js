import mongoose from "mongoose";

const { Schema } = mongoose;

const settingsSchema = new Schema(
  {
    // Multiple default backgrounds for events (up to 5)
    defaultBackgrounds: [
      {
        backgroundId: {
          type: Number, // 1-5
          required: true,
        },
        url: {
          type: String,
          default: null,
        },
        publicId: {
          type: String,
          default: null,
        },
        name: {
          type: String,
          default: null, // e.g., "Background 1", "Background 2", etc.
        },
      },
    ],

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
  }
);

export default mongoose.model("Settings", settingsSchema);
