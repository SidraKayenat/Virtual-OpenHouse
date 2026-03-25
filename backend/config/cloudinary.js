import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";


dotenv.config();
// ===== CLOUDINARY CONFIGURATION =====
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ===== STORAGE CONFIGURATIONS FOR DIFFERENT FILE TYPES =====

// Image Storage (JPEG, PNG, WEBP)
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "virtual-openhouse/stalls/images",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [
      { width: 1920, height: 1080, crop: "limit" }, // Max size
      { quality: "auto" }, // Auto quality optimization
      { fetch_format: "auto" }, // Auto format (WebP if supported)
    ],
  },
});

// Video Storage (MP4, MOV, AVI)
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "virtual-openhouse/stalls/videos",
    resource_type: "video",
    allowed_formats: ["mp4", "mov", "avi", "mkv"],
    transformation: [
      { width: 1920, height: 1080, crop: "limit" },
      { quality: "auto" },
    ],
  },
});

// Document Storage (PDF, DOCX, PPTX)
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "virtual-openhouse/stalls/documents",
    resource_type: "raw", // For non-image/video files
    allowed_formats: ["pdf", "doc", "docx", "ppt", "pptx", "txt"],
  },
});

// Banner/Profile Images
const bannerStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "virtual-openhouse/stalls/banners",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 1920, height: 600, crop: "fill" }, // Banner size
      { quality: "auto" },
    ],
  },
});

// Team Member Images
const teamImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "virtual-openhouse/teams",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 500, height: 500, crop: "fill", gravity: "face" },
      { quality: "auto" },
      { radius: "max" }, // Make it circular
    ],
  },
});

// Event Thumbnail Images
const eventThumbnailStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "virtual-openhouse/events/thumbnails",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 800, height: 450, crop: "fill" }, // Thumbnail size (16:9 aspect ratio)
      { quality: "auto" },
      { fetch_format: "auto" },
    ],
  },
});

// Event Background Images (Custom backgrounds)
const eventBackgroundStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "virtual-openhouse/events/backgrounds",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 2560, height: 1280, crop: "limit" }, // 2:1 ultrawide, preserves aspect ratio
      { quality: "auto" },
      { fetch_format: "auto" },
    ],
  },
});

// Event Default Background (Admin-managed default background)
const eventDefaultBackgroundStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "virtual-openhouse/events/default-background",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 8704, height: 4352, crop: "limit" }, // 2:1 ultrawide, preserves aspect ratio
      { quality: "auto" },
      { fetch_format: "auto" },
    ],
  },
});

// ===== MULTER UPLOAD MIDDLEWARE =====

// Single image upload
export const uploadImage = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Multiple images upload
export const uploadImages = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10, // Max 10 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Video upload
export const uploadVideo = multer({
  storage: videoStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed!"), false);
    }
  },
});

// Document upload
export const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Only PDF, DOC, DOCX, PPT, PPTX, TXT files are allowed!"),
        false,
      );
    }
  },
});

// Banner upload
export const uploadBanner = multer({
  storage: bannerStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Team image upload
export const uploadTeamImage = multer({
  storage: teamImageStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Event Thumbnail upload
export const uploadEventThumbnail = multer({
  storage: eventThumbnailStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Event Background upload (custom backgrounds)
export const uploadEventBackground = multer({
  storage: eventBackgroundStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Event Default Background upload (admin only)
export const uploadEventDefaultBackground = multer({
  storage: eventDefaultBackgroundStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// ===== CLOUDINARY HELPER FUNCTIONS =====

// Delete file from Cloudinary
export const deleteFromCloudinary = async (
  publicId,
  resourceType = "image",
) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    throw error;
  }
};

// Delete multiple files
export const deleteMultipleFromCloudinary = async (
  publicIds,
  resourceType = "image",
) => {
  try {
    const promises = publicIds.map((id) =>
      cloudinary.uploader.destroy(id, { resource_type: resourceType }),
    );
    return await Promise.all(promises);
  } catch (error) {
    console.error("Cloudinary bulk deletion error:", error);
    throw error;
  }
};

// Get file details
export const getCloudinaryFileDetails = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    console.error("Error fetching Cloudinary file details:", error);
    throw error;
  }
};

// Upload base64 image (for direct uploads)
export const uploadBase64Image = async (
  base64String,
  folder = "virtual-openhouse/misc",
) => {
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder,
      transformation: [
        { width: 1920, height: 1080, crop: "limit" },
        { quality: "auto" },
      ],
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Base64 upload error:", error);
    throw error;
  }
};

export default cloudinary;
