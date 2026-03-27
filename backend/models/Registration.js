// import mongoose from "mongoose";

// const { Schema } = mongoose;

// const registrationSchema = new Schema(
//   {
//     // Event being registered for
//     event: {
//       type: Schema.Types.ObjectId,
//       ref: "Event",
//       required: true,
//       index: true,
//     },

//     // User who is registering
//     user: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },

//     // Stall assigned to this user (optional at registration time)
//     stall: {
//       type: Schema.Types.ObjectId,
//       ref: "Stall",
//       default: null,
//     },

//     // Registration lifecycle
//     status: {
//       type: String,
//       enum: ["pending", "approved", "cancelled"],
//       default: "pending",
//     },

//     // Admin who approved the registration
//     approvedBy: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },

//     approvedAt: {
//       type: Date,
//       default: null,
//     },

//     // Cancellation info
//     cancelledAt: {
//       type: Date,
//       default: null,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // ❗ Prevent duplicate registration by same user for same event
// registrationSchema.index({ event: 1, user: 1 }, { unique: true });

// export default mongoose.model("Registration", registrationSchema);

import mongoose from "mongoose";

const { Schema } = mongoose;

const registrationSchema = new Schema(
  {
    // ===== EVENT REFERENCE =====
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event is required"],
      index: true,
    },

    // ===== USER REFERENCE =====
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },

    // ===== REGISTRATION STATUS =====
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },

    // ===== STALL ASSIGNMENT =====
    // This will be assigned when Event Admin approves
    stallNumber: {
      type: Number,
      default: null,
    },

    // Reference to Stall model (if stall is created)
    stall: {
      type: Schema.Types.ObjectId,
      ref: "Stall",
      default: null,
    },

    // ===== APPROVAL INFO =====
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // Event Admin who approved
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    // ===== REJECTION INFO =====
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: null,
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
    },

    // ===== CANCELLATION INFO =====
    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      default: null,
      maxlength: [500, "Cancellation reason cannot exceed 500 characters"],
    },

    // ===== PARTICIPANT DETAILS (Optional) =====
    participantInfo: {
      projectTitle: {
        type: String,
        trim: true,
        maxlength: [200, "Project title cannot exceed 200 characters"],
      },
      projectDescription: {
        type: String,
        maxlength: [1000, "Project description cannot exceed 1000 characters"],
      },
      category: {
        type: String,
        enum: ["technology", "business", "art", "science", "other"],
        default: "other",
      },
      teamMembers: [
        {
          name: String,
          role: String,
        },
      ],
      requirements: {
        type: String,
        maxlength: [500, "Requirements cannot exceed 500 characters"],
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ===== INDEXES =====
// Prevent duplicate registration: one user can register only once per event
registrationSchema.index({ event: 1, user: 1 }, { unique: true });
registrationSchema.index({ status: 1 });
registrationSchema.index({ event: 1, status: 1 });

// ===== VIRTUALS =====
// Check if registration is active
registrationSchema.virtual("isActive").get(function () {
  return this.status === "approved";
});

// ===== INSTANCE METHODS =====

// Check if user can cancel this registration
registrationSchema.methods.canBeCancelled = function () {
  return ["pending", "approved"].includes(this.status);
};

// Check if this registration can be approved
registrationSchema.methods.canBeApproved = function () {
  return this.status === "pending";
};

// ===== STATIC METHODS =====

// Get all registrations for an event
registrationSchema.statics.getByEvent = function (eventId, status = null) {
  const query = { event: eventId };
  if (status) query.status = status;

  return this.find(query)
    .populate("user", "name email organization")
    .populate("event", "name liveDate")
    .sort({ createdAt: -1 });
};

// Get all registrations by a user
registrationSchema.statics.getByUser = function (userId, status = null) {
  const query = { user: userId };
  if (status) query.status = status;

  return this.find(query)
    .populate("event", "name description liveDate status")
    .sort({ createdAt: -1 });
};

// Get pending registrations for an event
registrationSchema.statics.getPendingForEvent = function (eventId) {
  return this.find({ event: eventId, status: "pending" })
    .populate("user", "name email organization phoneNumber")
    .sort({ createdAt: 1 }); // Oldest first (FIFO)
};

// Count approved registrations for event
registrationSchema.statics.countApproved = function (eventId) {
  return this.countDocuments({ event: eventId, status: "approved" });
};

// ===== PRE-SAVE HOOKS =====
registrationSchema.pre("save", async function (next) {
  // If registration is being approved, set approval timestamp
  if (
    this.isModified("status") &&
    this.status === "approved" &&
    !this.approvedAt
  ) {
    this.approvedAt = new Date();
  }

  // If being rejected, set rejection timestamp
  if (
    this.isModified("status") &&
    this.status === "rejected" &&
    !this.rejectedAt
  ) {
    this.rejectedAt = new Date();
  }

  // If being cancelled, set cancellation timestamp
  if (
    this.isModified("status") &&
    this.status === "cancelled" &&
    !this.cancelledAt
  ) {
    this.cancelledAt = new Date();
  }

  next();
});

// ===== POST-SAVE HOOKS =====
registrationSchema.post("save", async function (doc, next) {
  // Update event's available stalls count when registration is approved/rejected/cancelled
  if (doc.wasNew || doc.isModified("status")) {
    try {
      const Event = mongoose.model("Event");
      const event = await Event.findById(doc.event);

      if (event) {
        await event.updateAvailableStalls();
      }
    } catch (error) {
      console.error("Error updating event stalls:", error);
    }
  }
  next();
});

export default mongoose.model("Registration", registrationSchema);
