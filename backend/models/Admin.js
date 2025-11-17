// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const adminSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true,
//     lowercase: true,
//     match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
//   },
//   password: {
//     type: String,
//     required: true,
//     minlength: 6
//   },
// //   role: {
// //     type: String,
// //     enum: ['super-admin', 'admin', 'moderator'],
// //     default: 'admin'
// //   },
//   department: {
//     type: String,
//     trim: true
//   },
// //   permissions: {
// //     canCreateOpenHouse: {
// //       type: Boolean,
// //       default: true
// //     },
// //     canManageProjects: {
// //       type: Boolean,
// //       default: true
// //     },
// //     canManageUsers: {
// //       type: Boolean,
// //       default: false
// //     },
// //     canViewAnalytics: {
// //       type: Boolean,
// //       default: true
// //     }
// //   },
// //   isActive: {
// //     type: Boolean,
// //     default: true
// //   },
//   lastLogin: Date,
// //   loginCount: {
// //     type: Number,
// //     default: 0
// //   },
//   resetPasswordToken: String,
//   resetPasswordExpires: Date,
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // Hash password before saving
// adminSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
  
//   try {
//     const salt = await bcrypt.genSalt(12);
//     this.password = await bcrypt.hash(this.password, salt);
//     this.updatedAt = Date.now();
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Compare password method
// adminSchema.methods.comparePassword = async function(candidatePassword) {
//   return bcrypt.compare(candidatePassword, this.password);
// };

// // Update login statistics
// adminSchema.methods.updateLoginStats = function() {
//   this.lastLogin = new Date();
//   this.loginCount += 1;
//   return this.save();
// };

// const Admin =module.exports = mongoose.model('Admin', adminSchema);
// export default Admin;