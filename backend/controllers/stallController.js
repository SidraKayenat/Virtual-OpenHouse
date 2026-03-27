import Stall from "../models/Stall.js";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import mongoose from "mongoose";

// ===== CREATE STALL (Auto-created after registration approval or manual) =====
export const createStall = async (req, res) => {
  try {
    const { registrationId } = req.body;

    // Find registration
    const registration = await Registration.findById(registrationId)
      .populate("event")
      .populate("user");

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // Check if user owns this registration
    if (registration.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only create stalls for your own registrations",
      });
    }

    // Check if registration is approved
    if (registration.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Registration must be approved before creating a stall",
      });
    }

    // Check if stall already exists for this registration
    const existingStall = await Stall.findOne({ registration: registrationId });
    if (existingStall) {
      return res.status(400).json({
        success: false,
        message: "Stall already exists for this registration",
        data: existingStall,
      });
    }

    // Create stall with data from registration
    const stall = await Stall.create({
      registration: registrationId,
      event: registration.event._id,
      owner: req.user._id,
      stallNumber: registration.stallNumber,
      projectTitle: registration.participantInfo.projectTitle,
      projectDescription: registration.participantInfo.projectDescription,
      category: registration.participantInfo.category,
      teamMembers: registration.participantInfo.teamMembers || [],
    });

    // Update registration with stall reference
    registration.stall = stall._id;
    await registration.save();

    await stall.populate([
      { path: "owner", select: "name email organization" },
      { path: "event", select: "name liveDate" },
    ]);

    res.status(201).json({
      success: true,
      message: "Stall created successfully",
      data: stall,
    });
  } catch (error) {
    console.error("Create Stall Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create stall",
    });
  }
};

// ===== GET MY STALLS (User's own stalls) =====
export const getMyStalls = async (req, res) => {
  try {
    const stalls = await Stall.find({ owner: req.user._id })
      .populate("event", "name description liveDate status")
      .populate("registration", "stallNumber status")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: stalls,
      count: stalls.length,
    });
  } catch (error) {
    console.error("Get My Stalls Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your stalls",
    });
  }
};

// ===== GET SINGLE STALL BY ID =====
export const getStallById = async (req, res) => {
  try {
    const { stallId } = req.params;

    const stall = await Stall.findById(stallId)
      .populate("owner", "name email organization")
      .populate("event", "name description liveDate status")
      .populate("registration", "stallNumber status");

    if (!stall) {
      return res.status(404).json({
        success: false,
        message: "Stall not found",
      });
    }

    // Increment view count (only if not owner)
    if (stall.owner._id.toString() !== req.user._id.toString()) {
      await stall.incrementViews();
    }

    res.status(200).json({
      success: true,
      data: stall,
    });
  } catch (error) {
    console.error("Get Stall Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stall",
    });
  }
};

// ===== GET ALL STALLS FOR AN EVENT =====
export const getEventStalls = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { published, category, search, page = 1, limit = 10 } = req.query;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Build query
    let query = { event: eventId };

    // Filter by published status
    if (published === "true") {
      query.isPublished = true;
      query.isActive = true;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Search in title and description
    if (search) {
      query.$or = [
        { projectTitle: { $regex: search, $options: "i" } },
        { projectDescription: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const stalls = await Stall.find(query)
      .populate("owner", "name organization")
      .sort({ stallNumber: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Stall.countDocuments(query);

    res.status(200).json({
      success: true,
      data: stalls,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get Event Stalls Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stalls",
    });
  }
};

// ===== UPDATE STALL DETAILS =====
export const updateStall = async (req, res) => {
  try {
    const { stallId } = req.params;
    const updates = req.body;

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
        message: "You can only update your own stalls",
      });
    }

    // Prevent updating certain fields
    delete updates.registration;
    delete updates.event;
    delete updates.owner;
    delete updates.stallNumber;
    delete updates.viewCount;
    delete updates.likeCount;
    delete updates.isPublished;
    delete updates.publishedAt;

    // Apply updates
    Object.assign(stall, updates);
    await stall.save();

    res.status(200).json({
      success: true,
      message: "Stall updated successfully",
      data: stall,
    });
  } catch (error) {
    console.error("Update Stall Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update stall",
    });
  }
};

// ===== PUBLISH STALL =====
export const publishStall = async (req, res) => {
  try {
    const { stallId } = req.params;

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
        message: "You can only publish your own stalls",
      });
    }

    // Check if already published
    if (stall.isPublished) {
      return res.status(400).json({
        success: false,
        message: "Stall is already published",
      });
    }

    // Validate before publishing
    if (!stall.isReadyToPublish) {
      return res.status(400).json({
        success: false,
        message: "Stall is not ready to publish. Ensure you have added title, description, images, and banner.",
        requirements: {
          projectTitle: !!stall.projectTitle,
          projectDescription: !!stall.projectDescription,
          hasImages: stall.images.length > 0,
          hasBanner: !!stall.bannerImage.url,
        },
      });
    }

    // Publish stall
    await stall.publish();

    res.status(200).json({
      success: true,
      message: "Stall published successfully",
      data: stall,
    });
  } catch (error) {
    console.error("Publish Stall Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to publish stall",
    });
  }
};

// ===== UNPUBLISH STALL =====
export const unpublishStall = async (req, res) => {
  try {
    const { stallId } = req.params;

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
        message: "You can only unpublish your own stalls",
      });
    }

    if (!stall.isPublished) {
      return res.status(400).json({
        success: false,
        message: "Stall is not published",
      });
    }

    await stall.unpublish();

    res.status(200).json({
      success: true,
      message: "Stall unpublished successfully",
      data: stall,
    });
  } catch (error) {
    console.error("Unpublish Stall Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unpublish stall",
    });
  }
};

// ===== DELETE STALL =====
export const deleteStall = async (req, res) => {
  try {
    const { stallId } = req.params;

    const stall = await Stall.findById(stallId);

    if (!stall) {
      return res.status(404).json({
        success: false,
        message: "Stall not found",
      });
    }

    // Check ownership (or admin)
    const isOwner = stall.isOwnedBy(req.user._id);
    const isAdmin = req.user.role === "system_admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this stall",
      });
    }

    // TODO: Delete all Cloudinary files before deleting stall
    // This will be implemented in Phase 2 (Cloudinary integration)

    await Stall.findByIdAndDelete(stallId);

    // Update registration to remove stall reference
    await Registration.findByIdAndUpdate(stall.registration, {
      stall: null,
    });

    res.status(200).json({
      success: true,
      message: "Stall deleted successfully",
    });
  } catch (error) {
    console.error("Delete Stall Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete stall",
    });
  }
};

// ===== TOGGLE STALL ACTIVE STATUS =====
export const toggleStallActive = async (req, res) => {
  try {
    const { stallId } = req.params;

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
        message: "You can only modify your own stalls",
      });
    }

    stall.isActive = !stall.isActive;
    await stall.save();

    res.status(200).json({
      success: true,
      message: `Stall ${stall.isActive ? "activated" : "deactivated"} successfully`,
      data: stall,
    });
  } catch (error) {
    console.error("Toggle Stall Active Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update stall status",
    });
  }
};

// ===== INCREMENT LIKE COUNT =====
export const likeStall = async (req, res) => {
  try {
    const { stallId } = req.params;

    const stall = await Stall.findById(stallId);

    if (!stall) {
      return res.status(404).json({
        success: false,
        message: "Stall not found",
      });
    }

    await stall.incrementLikes();

    res.status(200).json({
      success: true,
      message: "Stall liked",
      data: {
        likeCount: stall.likeCount,
      },
    });
  } catch (error) {
    console.error("Like Stall Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to like stall",
    });
  }
};

// ===== SEARCH STALLS =====
export const searchStalls = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { q, category, page = 1, limit = 10 } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    let query = {
      event: eventId,
      isPublished: true,
      isActive: true,
      $or: [
        { projectTitle: { $regex: q, $options: "i" } },
        { projectDescription: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
      ],
    };

    if (category) {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const stalls = await Stall.find(query)
      .populate("owner", "name organization")
      .sort({ viewCount: -1, likeCount: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Stall.countDocuments(query);

    res.status(200).json({
      success: true,
      data: stalls,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Search Stalls Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search stalls",
    });
  }
};

// ===== GET FEATURED STALLS =====
export const getFeaturedStalls = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { limit = 10 } = req.query;

    const stalls = await Stall.getFeatured(eventId, parseInt(limit));

    res.status(200).json({
      success: true,
      data: stalls,
      count: stalls.length,
    });
  } catch (error) {
    console.error("Get Featured Stalls Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch featured stalls",
    });
  }
};

// ===== GET STALL STATISTICS (for dashboard) =====
export const getStallStatistics = async (req, res) => {
  try {
    const userId = req.user._id;

    const totalStalls = await Stall.countDocuments({ owner: userId });
    const publishedStalls = await Stall.countDocuments({
      owner: userId,
      isPublished: true,
    });
    const unpublishedStalls = await Stall.countDocuments({
      owner: userId,
      isPublished: false,
    });

    // Get total views and likes
    const stats = await Stall.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$viewCount" },
          totalLikes: { $sum: "$likeCount" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalStalls,
        publishedStalls,
        unpublishedStalls,
        totalViews: stats[0]?.totalViews || 0,
        totalLikes: stats[0]?.totalLikes || 0,
      },
    });
  } catch (error) {
    console.error("Get Stall Statistics Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
};

// ===== UPDATE STALL POSITION (3D Coordinates) =====
export const updateStallPosition = async (req, res) => {
  try {
    const { stallId } = req.params;
    const { position, rotation, scale } = req.body;

    const stall = await Stall.findById(stallId);

    if (!stall) {
      return res.status(404).json({
        success: false,
        message: "Stall not found",
      });
    }

    // Check ownership or event admin
    const event = await Event.findById(stall.event);
    const isOwner = stall.isOwnedBy(req.user._id);
    const isEventAdmin = event.createdBy.toString() === req.user._id.toString();

    if (!isOwner && !isEventAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update stall position",
      });
    }

    // Update position, rotation, scale
    if (position) stall.position = position;
    if (rotation) stall.rotation = rotation;
    if (scale) stall.scale = scale;

    await stall.save();

    res.status(200).json({
      success: true,
      message: "Stall position updated successfully",
      data: {
        position: stall.position,
        rotation: stall.rotation,
        scale: stall.scale,
      },
    });
  } catch (error) {
    console.error("Update Stall Position Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update stall position",
    });
  }
};