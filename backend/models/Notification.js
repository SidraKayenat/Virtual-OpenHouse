import mongoose from "mongoose";

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    // Receiver of the notification
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Notification title (short)
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },

    // Detailed message
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },

    // Type helps frontend routing
    type: {
      type: String,
      enum: [
        "event_request",
        "event_approved",
        "event_rejected",
        "event_live",
        "registration_approved",
        "registration_cancelled",
      ],
      required: true,
    },

    // Reference to related entity
    referenceId: {
      type: Schema.Types.ObjectId,
      default: null,
    },

    referenceModel: {
      type: String,
      enum: ["Event", "Registration"],
      default: null,
    },

    // Read status
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast unread count
notificationSchema.index({ user: 1, isRead: 1 });

export default mongoose.model("Notification", notificationSchema);
