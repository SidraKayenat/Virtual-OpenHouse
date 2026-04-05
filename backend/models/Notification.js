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
        // Event Admin notifications
        "event_submitted",
        "event_approved",
        "event_rejected",
        "event_published",
        "registration_received",
        "event_reminder",
        "event_starting_soon",
        // Reminders
        "event_reminder_24h",
        "event_reminder_1h",
        "event_ended",
        // System Admin notifications
        "event_pending_approval",
        // Participant/User notifications - Registration
        "registration_submitted",
        "registration_approved",
        "registration_rejected",
        "registration_cancelled",
        // Participant/User notifications - Stall
        "stall_created",
        "stall_published",
        // System notifications
        "welcome",
        "account_created",
        "new_user",
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
  },
);

// Index for fast unread count
notificationSchema.index(
  { user: 1, referenceId: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "event_ended" },
  },
);

export default mongoose.model("Notification", notificationSchema);
