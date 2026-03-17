// const mongoose = require('mongoose');
import mongoose from "mongoose";
const openHouseSchema = new mongoose.Schema({
  year: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^\d{4}-\d{4}$/ // Format: 2024-2025
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
//   startDate: {
//     type: Date
//   },
//   endDate: {
//     type: Date
//   },
  totalProjects: {
    type: Number,
    required: true,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
//   status: {
//     type: String,
//     enum: ['planning', 'active', 'completed', 'archived'],
//     default: 'planning'
//   },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
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

// Update the updatedAt field before saving
openHouseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const OpenHouse = module.exports = mongoose.model('OpenHouse', openHouseSchema);
export default OpenHouse;