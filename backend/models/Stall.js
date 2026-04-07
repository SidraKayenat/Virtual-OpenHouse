import mongoose from "mongoose";

const { Schema } = mongoose;

const stallSchema = new Schema(
  {
    // ===== LINKS TO REGISTRATION & EVENT =====
    registration: {
      type: Schema.Types.ObjectId,
      ref: "Registration",
      required: true,
      unique: true, // One stall per registration
      index: true,
    },

    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ===== STALL IDENTIFICATION =====
    stallNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    // ===== PROJECT INFORMATION =====
    // Copied from registration.participantInfo but can be edited
    projectTitle: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      maxlength: [200, "Project title cannot exceed 200 characters"],
    },

    projectDescription: {
      type: String,
      required: [true, "Project description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    category: {
      type: String,
      enum: ["technology", "business", "art", "science", "other"],
      default: "other",
    },

    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Tag cannot exceed 50 characters"],
      },
    ],

    // Team information
    teamMembers: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        role: {
          type: String,
          trim: true,
        },
        image: {
          type: String, // Cloudinary URL
          default: null,
        },

        // ===== CONTACT INFO PER MEMBER =====
        contactInfo: {
          email: {
            type: String,
            trim: true,
            lowercase: true,
          },
          phone: {
            type: String,
            trim: true,
          },
          website: {
            type: String,
            trim: true,
          },
          socialLinks: {
            linkedin: { type: String, default: null },
            twitter: { type: String, default: null },
            facebook: { type: String, default: null },
            instagram: { type: String, default: null },
            github: { type: String, default: null },
          },
        },
      },
    ],

    // ===== MEDIA FILES (Cloudinary URLs) =====
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String, // Cloudinary public_id for deletion
          required: true,
        },
        caption: {
          type: String,
          maxlength: [200, "Caption cannot exceed 200 characters"],
        },
        order: {
          type: Number,
          default: 0,
        },
      },
    ],

    videos: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
        title: {
          type: String,
          maxlength: [200, "Title cannot exceed 200 characters"],
        },
        duration: {
          type: Number, // in seconds
        },
      },
    ],

    documents: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
        filename: {
          type: String,
          required: true,
        },
        fileType: {
          type: String, // pdf, docx, pptx, etc.
          required: true,
        },
        fileSize: {
          type: Number, // in bytes
        },
      },
    ],

     // ===== CHATBOT INGEST STATE =====
    chatbotDocFingerprint: {
      type: String,
      default: null,
    },
    chatbotLastIngestedAt: {
      type: Date,
      default: null,
    },

    // Banner/Thumbnail image (main display image)
    bannerImage: {
      url: {
        type: String,
        default: null,
      },
      publicId: {
        type: String,
        default: null,
      },
    },

    // ===== 3D ENVIRONMENT CONFIGURATION =====
    // Position in 3D space
    // position: {
    //   x: {
    //     type: Number,
    //     default: 0,
    //   },
    //   y: {
    //     type: Number,
    //     default: 0,
    //   },
    //   z: {
    //     type: Number,
    //     default: 0,
    //   },
    // },

    // // Rotation in 3D space
    // rotation: {
    //   x: {
    //     type: Number,
    //     default: 0,
    //   },
    //   y: {
    //     type: Number,
    //     default: 0,
    //   },
    //   z: {
    //     type: Number,
    //     default: 0,
    //   },
    // },

    // // Scale/Size
    // scale: {
    //   type: Number,
    //   default: 1,
    //   min: 0.5,
    //   max: 3,
    // },

    // // 3D Model customization (optional)
    // customModel: {
    //   url: {
    //     type: String,
    //     default: null,
    //   },
    //   publicId: {
    //     type: String,
    //     default: null,
    //   },
    // },

    // ===== CONTACT & SOCIAL LINKS =====
    // contactInfo: {
    //   email: {
    //     type: String,
    //     trim: true,
    //     lowercase: true,
    //   },
    //   phone: {
    //     type: String,
    //     trim: true,
    //   },
    //   website: {
    //     type: String,
    //     trim: true,
    //   },
    //   socialLinks: {
    //     linkedin: String,
    //     twitter: String,
    //     facebook: String,
    //     instagram: String,
    //     github: String,
    //   },
    // },

    // ===== STATUS & VISIBILITY =====
    isActive: {
      type: Boolean,
      default: true,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    // ===== STATISTICS =====
    viewCount: {
      type: Number,
      default: 0,
    },

    likeCount: {
      type: Number,
      default: 0,
    },

    // ===== ADDITIONAL METADATA =====
    featuredContent: {
      type: String,
      maxlength: [500, "Featured content cannot exceed 500 characters"],
    },

    achievements: [
      {
        title: String,
        description: String,
        date: Date,
      },
    ],

    // Admin notes (only visible to event admin)
    adminNotes: {
      type: String,
      maxlength: [1000, "Admin notes cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ===== INDEXES FOR PERFORMANCE =====
stallSchema.index({ event: 1, stallNumber: 1 }, { unique: true });
stallSchema.index({ owner: 1 });
stallSchema.index({ event: 1, isPublished: 1 });
stallSchema.index({ category: 1 });
stallSchema.index({ tags: 1 });

// ===== VIRTUALS =====

// Get total media count
stallSchema.virtual("mediaCount").get(function () {
  return this.images.length + this.videos.length + this.documents.length;
});

// Check if stall has content
stallSchema.virtual("hasContent").get(function () {
  return this.mediaCount > 0 || this.projectDescription.length > 100;
});

// Check if stall is ready to publish
stallSchema.virtual("isReadyToPublish").get(function () {
  return (
    this.projectTitle &&
    this.projectDescription &&
    this.images.length > 0 &&
    this.bannerImage.url
  );
});

// ===== INSTANCE METHODS =====

// Increment view count
stallSchema.methods.incrementViews = async function () {
  this.viewCount += 1;
  return this.save();
};

// Increment like count
stallSchema.methods.incrementLikes = async function () {
  this.likeCount += 1;
  return this.save();
};

// Check if user owns this stall
stallSchema.methods.isOwnedBy = function (userId) {
  return this.owner.toString() === userId.toString();
};

// Publish stall
stallSchema.methods.publish = async function () {
  if (!this.isReadyToPublish) {
    throw new Error(
      "Stall is not ready to publish. Add title, description, images, and banner.",
    );
  }
  this.isPublished = true;
  this.publishedAt = new Date();
  return this.save();
};

// Unpublish stall
stallSchema.methods.unpublish = async function () {
  this.isPublished = false;
  return this.save();
};

// Add image
stallSchema.methods.addImage = function (url, publicId, caption = null) {
  this.images.push({
    url,
    publicId,
    caption,
    order: this.images.length,
  });
  return this.save();
};

// Remove image
stallSchema.methods.removeImage = function (publicId) {
  this.images = this.images.filter((img) => img.publicId !== publicId);
  return this.save();
};

// ===== STATIC METHODS =====

// Get all stalls for an event
stallSchema.statics.getByEvent = function (
  eventId,
  includeUnpublished = false,
) {
  const query = { event: eventId };
  if (!includeUnpublished) {
    query.isPublished = true;
  }

  return this.find(query)
    .populate("owner", "name email organization")
    .populate("event", "name liveDate")
    .sort({ stallNumber: 1 });
};

// Get stalls by owner
stallSchema.statics.getByOwner = function (userId) {
  return this.find({ owner: userId })
    .populate("event", "name liveDate status")
    .sort({ createdAt: -1 });
};

// Get published stalls for an event
stallSchema.statics.getPublishedByEvent = function (eventId) {
  return this.find({ event: eventId, isPublished: true, isActive: true })
    .populate("owner", "name organization")
    .sort({ stallNumber: 1 });
};

// Search stalls
stallSchema.statics.search = function (eventId, searchTerm) {
  return this.find({
    event: eventId,
    isPublished: true,
    $or: [
      { projectTitle: { $regex: searchTerm, $options: "i" } },
      { projectDescription: { $regex: searchTerm, $options: "i" } },
      { tags: { $in: [new RegExp(searchTerm, "i")] } },
    ],
  }).populate("owner", "name organization");
};

// Get featured stalls
stallSchema.statics.getFeatured = function (eventId, limit = 10) {
  return this.find({
    event: eventId,
    isPublished: true,
    featuredContent: { $exists: true, $ne: null },
  })
    .sort({ viewCount: -1, likeCount: -1 })
    .limit(limit)
    .populate("owner", "name organization");
};

// ===== PRE-SAVE HOOKS =====
stallSchema.pre("save", function (next) {
  // Auto-set banner image if not set but images exist
  if (!this.bannerImage.url && this.images.length > 0) {
    this.bannerImage = {
      url: this.images[0].url,
      publicId: this.images[0].publicId,
    };
  }
  next();
});

// ===== PRE-DELETE HOOKS =====
// Clean up Cloudinary files when stall is deleted
stallSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    // Note: Actual Cloudinary deletion will be done in controller
    next();
  },
);

export default mongoose.model("Stall", stallSchema);
