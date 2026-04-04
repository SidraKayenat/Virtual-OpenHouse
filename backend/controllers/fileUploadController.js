import Stall from "../models/Stall.js";
import { deleteFromCloudinary } from "../config/cloudinary.js";

// ===== UPLOAD IMAGES TO STALL =====
export const uploadStallImages = async (req, res) => {
  try {
    const { stallId } = req.params;

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded",
      });
    }

    // Find stall
    const stall = await Stall.findById(stallId);
    if (!stall) {
      return res.status(404).json({
        success: false,
        message: "Stall not found",
      });
    }

    // Check ownership
    if (!stall.isOwnedBy(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You can only upload images to your own stalls",
      });
    }

    // Process uploaded images
    const uploadedImages = req.files.map((file, index) => ({
      url: file.path, // Cloudinary URL
      publicId: file.filename, // Cloudinary public_id
      caption: req.body.captions ? req.body.captions[index] : null,
      order: stall.images.length + index,
    }));

    // Add images to stall
    stall.images.push(...uploadedImages);
    await stall.save();

    res.status(200).json({
      success: true,
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      data: {
        images: uploadedImages,
        totalImages: stall.images.length,
      },
    });
  } catch (error) {
    console.error("Upload Images Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload images",
    });
  }
};

// ===== UPLOAD VIDEO TO STALL =====
export const uploadStallVideo = async (req, res) => {
  try {
    const { stallId } = req.params;
    const { title } = req.body;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No video uploaded",
      });
    }

    // Find stall
    const stall = await Stall.findById(stallId);
    if (!stall) {
      return res.status(404).json({
        success: false,
        message: "Stall not found",
      });
    }

    // Check ownership
    if (!stall.isOwnedBy(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You can only upload videos to your own stalls",
      });
    }

    // Check video limit (max 5 videos per stall)
    if (stall.videos.length >= 5) {
      return res.status(400).json({
        success: false,
        message: "Maximum 5 videos allowed per stall",
      });
    }

    // Add video to stall
    const videoData = {
      url: req.file.path,
      publicId: req.file.filename,
      title: title || "Untitled Video",
      duration: req.file.duration || null,
    };

    stall.videos.push(videoData);
    await stall.save();

    res.status(200).json({
      success: true,
      message: "Video uploaded successfully",
      data: {
        video: videoData,
        totalVideos: stall.videos.length,
      },
    });
  } catch (error) {
    console.error("Upload Video Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload video",
    });
  }
};

// ===== UPLOAD DOCUMENTS TO STALL =====
export const uploadStallDocuments = async (req, res) => {
  try {
    const { stallId } = req.params;

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No documents uploaded",
      });
    }

    // Find stall
    const stall = await Stall.findById(stallId);
    if (!stall) {
      return res.status(404).json({
        success: false,
        message: "Stall not found",
      });
    }

    // Check ownership
    if (!stall.isOwnedBy(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You can only upload documents to your own stalls",
      });
    }

    // Process uploaded documents
    const uploadedDocs = req.files.map((file) => {
      const ext = file.originalname.split(".").pop();

      return {
        url: `file.path`, // ✅ append extension manually
        publicId: file.filename,
        filename: file.originalname,
        fileType: ext,
        fileSize: file.size,
      };
    });

    // Add documents to stall
    stall.documents.push(...uploadedDocs);
    await stall.save();

    res.status(200).json({
      success: true,
      message: `${uploadedDocs.length} document(s) uploaded successfully`,
      data: {
        documents: uploadedDocs,
        totalDocuments: stall.documents.length,
      },
    });
  } catch (error) {
    console.error("Upload Documents Error:", error.stack || error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload documents",
    });
  }
};

// ===== UPLOAD BANNER IMAGE =====
export const uploadStallBanner = async (req, res) => {
  try {
    const { stallId } = req.params;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No banner image uploaded",
      });
    }

    // Find stall
    const stall = await Stall.findById(stallId);
    if (!stall) {
      return res.status(404).json({
        success: false,
        message: "Stall not found",
      });
    }

    // Check ownership
    if (!stall.isOwnedBy(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You can only upload banner to your own stalls",
      });
    }

    // Delete old banner from Cloudinary if exists
    if (stall.bannerImage.publicId) {
      try {
        await deleteFromCloudinary(stall.bannerImage.publicId, "image");
      } catch (error) {
        console.error("Error deleting old banner:", error);
      }
    }

    // Update banner
    stall.bannerImage = {
      url: req.file.path,
      publicId: req.file.filename,
    };

    await stall.save();

    res.status(200).json({
      success: true,
      message: "Banner uploaded successfully",
      data: {
        banner: stall.bannerImage,
      },
    });
  } catch (error) {
    console.error("Upload Banner Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload banner",
    });
  }
};

// ===== DELETE IMAGE FROM STALL =====
export const deleteStallImage = async (req, res) => {
  try {
    const { stallId, publicId } = req.params;

    // Find stall
    const stall = await Stall.findById(stallId);
    if (!stall) {
      return res.status(404).json({
        success: false,
        message: "Stall not found",
      });
    }

    // Check ownership
    if (!stall.isOwnedBy(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You can only delete images from your own stalls",
      });
    }

    // Find image
    const imageIndex = stall.images.findIndex(
      (img) => img.publicId === publicId,
    );
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    // Delete from Cloudinary
    try {
      await deleteFromCloudinary(publicId, "image");
    } catch (error) {
      console.error("Cloudinary deletion error:", error);
    }

    // Remove from stall
    stall.images.splice(imageIndex, 1);
    await stall.save();

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      data: {
        remainingImages: stall.images.length,
      },
    });
  } catch (error) {
    console.error("Delete Image Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete image",
    });
  }
};

// ===== DELETE VIDEO FROM STALL =====
export const deleteStallVideo = async (req, res) => {
  try {
    const { stallId, publicId } = req.params;

    // Find stall
    const stall = await Stall.findById(stallId);
    if (!stall) {
      return res.status(404).json({
        success: false,
        message: "Stall not found",
      });
    }

    // Check ownership
    if (!stall.isOwnedBy(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You can only delete videos from your own stalls",
      });
    }

    // Find video
    const videoIndex = stall.videos.findIndex(
      (vid) => vid.publicId === publicId,
    );
    if (videoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Delete from Cloudinary
    try {
      await deleteFromCloudinary(publicId, "video");
    } catch (error) {
      console.error("Cloudinary deletion error:", error);
    }

    // Remove from stall
    stall.videos.splice(videoIndex, 1);
    await stall.save();

    res.status(200).json({
      success: true,
      message: "Video deleted successfully",
      data: {
        remainingVideos: stall.videos.length,
      },
    });
  } catch (error) {
    console.error("Delete Video Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete video",
    });
  }
};

// ===== DELETE DOCUMENT FROM STALL =====
export const deleteStallDocument = async (req, res) => {
  try {
    const stallId = req.params.stallId;
    const publicId = decodeURIComponent(req.params.publicId); // ✅ FIX HERE

    // Find stall
    const stall = await Stall.findById(stallId);
    if (!stall) {
      return res.status(404).json({
        success: false,
        message: "Stall not found",
      });
    }

    // Check ownership
    if (!stall.isOwnedBy(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You can only delete documents from your own stalls",
      });
    }

    // Find document
    const docIndex = stall.documents.findIndex(
      (doc) => doc.publicId === publicId,
    );
    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Delete from Cloudinary
    try {
      await deleteFromCloudinary(publicId, "raw");
    } catch (error) {
      console.error("Cloudinary deletion error:", error);
    }

    // Remove from stall
    stall.documents.splice(docIndex, 1);
    await stall.save();

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
      data: {
        remainingDocuments: stall.documents.length,
      },
    });
  } catch (error) {
    console.error("Delete Document Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete document",
    });
  }
};

// ===== UPDATE IMAGE CAPTION =====
export const updateImageCaption = async (req, res) => {
  try {
    const { stallId, publicId } = req.params;
    const { caption } = req.body;

    // Find stall
    const stall = await Stall.findById(stallId);
    if (!stall) {
      return res.status(404).json({
        success: false,
        message: "Stall not found",
      });
    }

    // Check ownership
    if (!stall.isOwnedBy(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You can only update captions for your own stalls",
      });
    }

    // Find and update image
    const image = stall.images.find((img) => img.publicId === publicId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    image.caption = caption;
    await stall.save();

    res.status(200).json({
      success: true,
      message: "Caption updated successfully",
      data: {
        image,
      },
    });
  } catch (error) {
    console.error("Update Caption Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update caption",
    });
  }
};

// ===== REORDER IMAGES =====
export const reorderImages = async (req, res) => {
  try {
    const { stallId } = req.params;
    const { imageOrder } = req.body; // Array of publicIds in desired order

    if (!Array.isArray(imageOrder)) {
      return res.status(400).json({
        success: false,
        message: "imageOrder must be an array of publicIds",
      });
    }

    // Find stall
    const stall = await Stall.findById(stallId);
    if (!stall) {
      return res.status(404).json({
        success: false,
        message: "Stall not found",
      });
    }

    // Check ownership
    if (!stall.isOwnedBy(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You can only reorder images for your own stalls",
      });
    }

    // Reorder images based on provided order
    const reorderedImages = [];
    imageOrder.forEach((publicId, index) => {
      const image = stall.images.find((img) => img.publicId === publicId);
      if (image) {
        image.order = index;
        reorderedImages.push(image);
      }
    });

    // Add any images not in the order array at the end
    stall.images.forEach((img) => {
      if (!imageOrder.includes(img.publicId)) {
        img.order = reorderedImages.length;
        reorderedImages.push(img);
      }
    });

    stall.images = reorderedImages;
    await stall.save();

    res.status(200).json({
      success: true,
      message: "Images reordered successfully",
      data: {
        images: stall.images,
      },
    });
  } catch (error) {
    console.error("Reorder Images Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reorder images",
    });
  }
};
