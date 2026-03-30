// const mongoose = require('mongoose');
import mongoose from "mongoose";
const groupMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  cmsId: {
    type: String,
    trim: true,
     required: true,
    match: [/^\d{11}$/, 'CMS ID must be exactly 11 digits']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
    resume: {
    filename: String,
    originalName: String,
    url: String,
    cloudinaryPublicId: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
}
});

const projectSchema = new mongoose.Schema({
  openHouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OpenHouse',
    required: true
  },
  stallNumber: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  groupMembers: {
    type: [groupMemberSchema],
    required: true,
    validate: {
      validator: function(members) {
        return members.length > 0 && members.length <= 4;
      },
      message: 'Group must have 1-4 members'
    }
  },
  supervisor: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    // email: {
    //   type: String,
    //   trim: true,
    //   lowercase: true
    // },
    department: {
      type: String,
      trim: true
    }
  },
  category: {
    type: String,
    enum: ['web-development', 'mobile-app', 'ai-ml', 'data-science', 'cybersecurity', 'iot', 'blockchain', 'game-development', 'other'],
    default: 'other'
  },
  technologies: [{
    type: String,
    trim: true
  }],
  websiteUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Website URL must be a valid URL'
    }
  },
  githubUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/(www\.)?github\.com\/.+/.test(v);
      },
      message: 'GitHub URL must be a valid GitHub URL'
    }
  },
  files: {
    thesis: {
      filename: String,
      originalName: String,
      url: String,
      cloudinaryPublicId: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    },
    demoVideo: {
      filename: String,
      originalName: String,
      url: String,
      cloudinaryPublicId: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    },
    poster: {
      filename: String,
      originalName: String,
      url: String,
      cloudinaryPublicId: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    },
    additionalFiles: [{
      filename: String,
      originalName: String,
      url: String,
      cloudinaryPublicId: String,
      fileType: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
//   virtualTour: {
//     isEnabled: {
//       type: Boolean,
//       default: true
//     },
//     position: {
//       x: Number,
//       y: Number,
//       z: Number
//     },
//     rotation: {
//       x: Number,
//       y: Number,
//       z: Number
//     }
//   },
//   statistics: {
//     views: {
//       type: Number,
//       default: 0
//     },
//     likes: {
//       type: Number,
//       default: 0
//     },
//     downloads: {
//       type: Number,
//       default: 0
//     }
//   },
//   status: {
//     type: String,
//     enum: ['draft', 'submitted', 'approved', 'published', 'archived'],
//     default: 'draft'
//   },
//   submittedAt: Date,
//   approvedAt: Date,
//   publishedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
projectSchema.index({ openHouseId: 1, stallNumber: 1 }, { unique: true });
projectSchema.index({ openHouseId: 1, status: 1 });
projectSchema.index({ title: 'text', description: 'text' });
projectSchema.index({ 'groupMembers.name': 1 });
projectSchema.index({ 'supervisor.name': 1 });
projectSchema.index({ category: 1 });

// Update the updatedAt field before saving
projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for full project URL
projectSchema.virtual('fullUrl').get(function() {
  return `/projects/${this._id}`;
});

const Project = mongoose.model("Project", projectSchema);
export default Project;
