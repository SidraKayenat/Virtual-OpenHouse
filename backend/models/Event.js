// import mongoose from "mongoose";

// const { Schema } = mongoose;

// const eventSchema = new Schema(
//   {
//     // Basic Event Info
//     name: {
//       type: String,
//       required: [true, "Event name is required"],
//       trim: true,
//       maxlength: [100, "Event name cannot exceed 100 characters"],
//     },
//     description: {
//       type: String,
//       required: [true, "Event description is required"],
//       maxlength: [1000, "Description cannot exceed 1000 characters"],
//     },

//     // Event Configuration
//     numberOfStalls: {
//       type: Number,
//       required: [true, "Number of stalls is required"],
//       min: [1, "Must have at least 1 stall"],
//       max: [500, "Cannot exceed 500 stalls"],
//     },
//     liveDate: {
//       type: Date,
//       required: [true, "Live date is required"],
//       validate: {
//         validator: function(value) {
//           return value > new Date();
//         },
//         message: "Live date must be in the future"
//       }
//     },

//     // Background customization
//     backgroundType: {
//       type: String,
//       enum: ["default", "custom"],
//       default: "default",
//     },
//     customBackground: {
//       type: String, // URL or base64 or color code
//       default: null,
//     },

//     // Creator Info
//     createdBy: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     // Approval Status
//     status: {
//       type: String,
//       enum: ["pending", "approved", "rejected", "live", "completed", "cancelled"],
//       default: "pending",
//     },

//     // Admin Actions
//     reviewedBy: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },
//     reviewedAt: {
//       type: Date,
//       default: null,
//     },
//     rejectionReason: {
//       type: String,
//       default: null,
//       maxlength: [500, "Rejection reason cannot exceed 500 characters"],
//     },

//     // Registration Management
//     registrations: [{
//       user: {
//         type: Schema.Types.ObjectId,
//         ref: "User",
//       },
//       registeredAt: {
//         type: Date,
//         default: Date.now,
//       },
//       stallNumber: {
//         type: Number,
//         default: null,
//       },
//       status: {
//         type: String,
//         enum: ["registered", "confirmed", "cancelled"],
//         default: "registered",
//       }
//     }],

//     // Capacity tracking
//     availableStalls: {
//       type: Number,
//       default: function() {
//         return this.numberOfStalls;
//       }
//     },

//     // Additional metadata
//     eventType: {
//       type: String,
//       enum: ["conference", "exhibition", "fair", "workshop", "seminar", "other"],
//       default: "other",
//     },
//     tags: [{
//       type: String,
//       trim: true,
//     }],

//     // Event duration
//     startTime: {
//       type: String, // e.g., "09:00 AM"
//       default: null,
//     },
//     endTime: {
//       type: String, // e.g., "05:00 PM"
//       default: null,
//     },

//     // Location (optional)
//     venue: {
//       type: String,
//       default: null,
//     },

//     // Featured/Priority
//     isFeatured: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Index for faster queries
// eventSchema.index({ status: 1, liveDate: 1 });
// eventSchema.index({ createdBy: 1 });
// eventSchema.index({ "registrations.user": 1 });

// // Virtual for registration count
// eventSchema.virtual("registrationCount").get(function() {
//   return this.registrations.filter(r => r.status === "registered" || r.status === "confirmed").length;
// });

// // Method to check if user is registered
// eventSchema.methods.isUserRegistered = function(userId) {
//   return this.registrations.some(
//     r => r.user.toString() === userId.toString() &&
//     (r.status === "registered" || r.status === "confirmed")
//   );
// };

// // Method to check if event is full
// eventSchema.methods.isFull = function() {
//   return this.availableStalls <= 0;
// };

// // Ensure virtuals are included in JSON
// eventSchema.set("toJSON", { virtuals: true });
// eventSchema.set("toObject", { virtuals: true });

// export default mongoose.model("Event", eventSchema);;

import mongoose from "mongoose";

const { Schema } = mongoose;

const eventSchema = new Schema(
  {
    // ===== BASIC EVENT INFO =====
    name: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
      maxlength: [100, "Event name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    // ===== EVENT CONFIGURATION =====
    numberOfStalls: {
      type: Number,
      required: [true, "Number of stalls is required"],
      min: [1, "Must have at least 1 stall"],
      max: [500, "Cannot exceed 500 stalls"],
    },

    availableStalls: {
      type: Number,
      default: function () {
        return this.numberOfStalls;
      },
    },

    // ===== SCHEDULING =====
    liveDate: {
      type: Date,
      required: [true, "Live date is required"],
      validate: {
        validator: function (value) {
          // Skip validation if event is being updated and already approved
          if (!this.isNew && this.status !== "pending") return true;
          return value > new Date();
        },
        message: "Live date must be in the future",
      },
    },

    startTime: {
      type: String,
      default: null,
    },

    endTime: {
      type: String,
      default: null,
    },

    // ===== 3D ENVIRONMENT & CUSTOMIZATION =====
    backgroundType: {
      type: String,
      enum: ["default", "custom"],
      default: "default",
    },

    // Background URL (either selected from default backgrounds or custom uploaded)
    backgroundUrl: {
      type: String,
      default: null,
    },

    // If backgroundType is "default": which of the 5 backgrounds was selected (1-5)
    // If backgroundType is "custom": null
    selectedBackgroundId: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    // Cloudinary public ID (only for custom backgrounds for deletion purposes)
    backgroundPublicId: {
      type: String,
      default: null,
    },

    // environmentType: {
    //   type: String,
    //   enum: ["indoor", "outdoor", "hybrid"],
    //   default: "indoor",
    // },

    modelUrl: {
      type: String,
      default: null,
    },

    thumbnailUrl: {
      type: String,
      default: null,
    },

    thumbnailPublicId: {
      type: String,
      default: null,
    },

    // ===== CHATBOT INTEGRATION (Per your SDD) =====
    chatbotStatus: {
      type: String,
      enum: ["not_trained", "training", "trained", "error"],
      default: "not_trained",
    },

    chatbotVectorPath: {
      type: String,
      default: null,
    },

    // ===== CREATOR INFO =====
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ===== APPROVAL WORKFLOW =====
    status: {
      type: String,
      enum: [
        "pending", // Initial state - awaiting System Admin review
        "approved", // System Admin approved
        "rejected", // System Admin rejected
        "published", // Event Admin published (visible to attendees)
        "live", // Event is currently running
        "completed", // Event has ended
        "cancelled", // Event was cancelled
      ],
      default: "pending",
    },

    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: null,
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
    },

    // ===== PUBLISHING INFO =====
    publishedAt: {
      type: Date,
      default: null,
    },

    publishedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ===== EVENT METADATA =====
    eventType: {
      type: String,
      enum: [
        "conference",
        "exhibition",
        "fair",
        "workshop",
        "seminar",
        "other",
      ],
      default: "exhibition",
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    venue: {
      type: String,
      default: null,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    // ===== ARCHIVE STATUS =====
    archive: {
      type: Boolean,
      default: false,
      //    description: "Whether to archive this event after completion"
    },

    // ===== REMINDERS =====
    reminders: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        setAt: {
          type: Date,
          default: Date.now,
        },
        reminderSent: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // ===== NOTIFICATION TRACKING (Prevent duplicates) =====
    eventEndedNotificationSent: {
      type: Boolean,
      default: false,
    },

    eventStartingSoonNotificationSent: {
      type: Boolean,
      default: false,
    },

    reminder24hNotificationSent: {
      type: Boolean,
      default: false,
    },

    reminder1hNotificationSent: {
      type: Boolean,
      default: false,
    },

    // ===== STATISTICS (Computed fields - don't store directly) =====
    // These will be calculated via virtuals or aggregations
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ===== INDEXES FOR PERFORMANCE =====
eventSchema.index({ status: 1, liveDate: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ status: 1, publishedAt: -1 });
eventSchema.index({ tags: 1 });

// ===== VIRTUALS =====
// Get registration count (requires population)
eventSchema.virtual("registrationCount", {
  ref: "Registration",
  localField: "_id",
  foreignField: "event",
  count: true,
});

// Get approved registrations count
eventSchema.virtual("approvedRegistrationsCount", {
  ref: "Registration",
  localField: "_id",
  foreignField: "event",
  count: true,
  match: { status: "approved" },
});

// ===== INSTANCE METHODS =====

// Check if event is full
eventSchema.methods.isFull = function () {
  return this.availableStalls <= 0;
};

// Check if event can accept registrations
eventSchema.methods.canAcceptRegistrations = function () {
  return (
    (this.status === "published" || this.status === "live") && !this.isFull()
  );
};

// Check if event is active
eventSchema.methods.isActive = function () {
  return ["published", "live"].includes(this.status);
};

// Check if user can edit this event
eventSchema.methods.canBeEditedBy = function (userId) {
  return (
    this.createdBy.toString() === userId.toString() &&
    ["pending", "approved"].includes(this.status)
  );
};

// Update available stalls count
eventSchema.methods.updateAvailableStalls = async function () {
  const Registration = mongoose.model("Registration");
  const approvedCount = await Registration.countDocuments({
    event: this._id,
    status: "approved",
  });
  this.availableStalls = this.numberOfStalls - approvedCount;
  return this.save();
};

// ===== STATIC METHODS =====

// Get events by status
eventSchema.statics.getByStatus = function (status) {
  return this.find({ status })
    .populate("createdBy", "name email organization")
    .sort({ createdAt: -1 });
};

// Get upcoming published events
eventSchema.statics.getUpcoming = function () {
  return this.find({
    status: { $in: ["published", "live"] },
    liveDate: { $gte: new Date() },
  })
    .populate("createdBy", "name email organization")
    .sort({ liveDate: 1 });
};

// Get events created by user
eventSchema.statics.getByCreator = function (userId) {
  return this.find({ createdBy: userId }).sort({ createdAt: -1 });
};

// ===== PRE-SAVE HOOKS =====
eventSchema.pre("save", function (next) {
  // Auto-update status to live if liveDate has passed
  if (this.status === "published" && new Date() >= this.liveDate) {
    this.status = "live";
  }
  next();
});

export default mongoose.model("Event", eventSchema);
