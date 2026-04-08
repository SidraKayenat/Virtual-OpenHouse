import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import Settings from "../models/Settings.js";
import mongoose from "mongoose";
import { deleteFromCloudinary } from "../config/cloudinary.js";
import {
  notifyEventSubmitted,
  notifyEventApproved,
  notifyEventRejected,
  notifyEventPublished,
  notifyAdminPendingApproval,
} from "../services/notificationService.js";

const ensureCorrectStatus = async (event) => {
  if (
    event.status === "published" &&
    new Date() >= event.liveDate &&
    new Date() < event.endTime
  ) {
    event.status = "live";
    await event.save();
  }
  return event;
};

// ===== GET PUBLIC EVENT BY ID (No authentication required) =====
export const getPublicEventById = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate eventId format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format",
      });
    }

    // Find event with only public fields
    const event = await Event.findById(eventId)
      .select({
        name: 1,
        description: 1,
        environmentType: 1,
        numberOfStalls: 1,
        liveDate: 1,
        startTime: 1,
        endTime: 1,
        status: 1,
        bannerImage: 1,
        backgroundType: 1,
        backgroundUrl: 1,
        selectedBackgroundId: 1,
        eventType: 1,
        tags: 1,
        venue: 1,
        createdBy: 1,
      })
      .populate("createdBy", "name organization")
      .lean();

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Only return published or live events
    if (!["published", "live"].includes(event.status)) {
      return res.status(404).json({
        success: false,
        message: "Event not available for public viewing",
      });
    }

    // Update status if needed (check if event should be live)
    if (event.status === "published") {
      const now = new Date();
      const liveDateTime = new Date(event.liveDate);
      const endDateTime = new Date(event.endTime);

      if (now >= liveDateTime && now < endDateTime) {
        event.status = "live";
        // Update in database (fire and forget - don't await)
        Event.findByIdAndUpdate(eventId, { status: "live" }).catch((err) =>
          console.error("Failed to update event status:", err),
        );
      }
    }

    // Get registration count (optional - can be removed if not needed)
    const registrationCount = await Registration.countDocuments({
      event: eventId,
      status: "approved",
    });

    res.status(200).json({
      success: true,
      data: {
        ...event,
        registrationCount,
        // Ensure we don't expose sensitive fields
        reviewedBy: undefined,
        rejectionReason: undefined,
        reviewedAt: undefined,
        publishedBy: undefined,
      },
    });
  } catch (error) {
    console.error("Get Public Event Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch event",
    });
  }
};

// ===== CREATE EVENT REQUEST =====
// Role: Event Admin creates event (status: pending)
export const createEvent = async (req, res) => {
  try {
    const {
      name,
      description,
      numberOfStalls,
      liveDate,
      startTime,
      endTime,
      backgroundType,
      selectedBackgroundId, // 1-5 for default backgrounds
      environmentType,
      eventType,
      tags,
      venue,
      archive,
    } = req.body;

    let backgroundUrl = null;
    let finalSelectedBackgroundId = null;

    // Handle background selection
    if (backgroundType === "custom") {
      // Custom background will be uploaded separately
      // For now, we don't set the backgroundUrl (will be set when file is uploaded)
      backgroundUrl = null;
    } else {
      // Default background - user must select one from the 5 options (1-5)
      if (
        !selectedBackgroundId ||
        selectedBackgroundId < 1 ||
        selectedBackgroundId > 5
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a default background (1-5) or upload a custom background",
        });
      }

      // Fetch the selected background from Settings
      const settings = await Settings.findOne();
      if (
        !settings ||
        !settings.defaultBackgrounds ||
        settings.defaultBackgrounds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "No default backgrounds available. Please contact admin.",
        });
      }

      const selectedBg = settings.defaultBackgrounds.find(
        (bg) => bg.backgroundId === selectedBackgroundId,
      );
      if (!selectedBg || !selectedBg.url) {
        return res.status(400).json({
          success: false,
          message: `Background ${selectedBackgroundId} not found or not set by admin`,
        });
      }

      backgroundUrl = selectedBg.url;
      finalSelectedBackgroundId = selectedBackgroundId;
    }

    // Create event
    const event = await Event.create({
      name,
      description,
      numberOfStalls,
      liveDate,
      startTime,
      endTime,
      backgroundType: backgroundType || "default",
      backgroundUrl,
      selectedBackgroundId: finalSelectedBackgroundId,
      environmentType,
      eventType,
      tags,
      venue,
      archive: archive || false, // Default to false if not specified
      createdBy: req.user._id,
      status: "pending", // Awaiting System Admin approval
    });

    await event.populate("createdBy", "name email organization");

    // Send notifications
    try {
      // Notify event creator that event was submitted
      await notifyEventSubmitted(event._id, event.name, req.user._id);

      // Notify all system admins of pending approval
      const creatorName = req.user.name || "Event Creator";
      await notifyAdminPendingApproval(event._id, event.name, creatorName);
    } catch (notifError) {
      console.error("Error sending notifications:", notifError);
      // Don't fail the request if notifications fail
    }

    res.status(201).json({
      success: true,
      message:
        "Event creation request submitted successfully. Awaiting admin approval.",
      data: event,
    });
  } catch (error) {
    console.error("Create Event Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create event",
    });
  }
};

// ===== GET ALL EVENTS (Admin VIEW) =====
// Role: System Admin views all events for approval
export const getAllEvents = async (req, res) => {
  try {
    const {
      status,
      search,
      page = 1,
      limit = 10,
      sortBy = "latest",
    } = req.query;

    let query = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Determine sort order
    let sortObject = { createdAt: -1 }; // default
    if (sortBy === "oldest") {
      sortObject = { createdAt: 1 };
    } else if (sortBy === "asc_alphabetically") {
      sortObject = { name: 1 };
    } else if (sortBy === "desc_alphabetically") {
      sortObject = { name: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await Event.find(query)
      .populate("createdBy", "name email organization")
      .populate("reviewedBy", "name email")
      .sort(sortObject)
      .skip(skip)
      .limit(parseInt(limit));

    // Update statuses for any events that should be live
    for (const event of events) {
      await ensureCorrectStatus(event);
    }

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      data: events,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get All Events Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
    });
  }
};

// ===== GET EVENTS FOR BROWSE PAGE (Unified) =====
export const getBrowseEvents = async (req, res) => {
  try {
    const {
      type, // "all", "live", "upcoming", "past"
      search,
      eventType,
      tags,
      page = 1,
      limit = 12,
      sortBy = "latest",
    } = req.query;

    let query = {};

    // Build query based on tab type
    if (type === "live") {
      query.status = "live";
    } else if (type === "upcoming") {
      query.status = "published";
      query.liveDate = { $gt: new Date() };
    } else if (type === "past") {
      query.archive = true;
      query.status = "completed";
    } else {
      // "all" - show everything
      query.$or = [
        { status: "published" },
        { status: "live" },
        { status: "completed", archive: true }, // Only completed if archived
      ];
    }

    // Search filter
    if (search) {
      query.$or = query.$or || [];
      query.$or.push(
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      );
    }

    // Event type filter
    if (eventType) {
      query.eventType = eventType;
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(",");
      query.tags = { $in: tagArray };
    }

    // Sort order
    let sortObject = { createdAt: -1 };
    if (sortBy === "oldest") sortObject = { createdAt: 1 };
    else if (sortBy === "asc_alphabetically") sortObject = { name: 1 };
    else if (sortBy === "desc_alphabetically") sortObject = { name: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await Event.find(query)
      .populate("createdBy", "name organization")
      .sort(sortObject)
      .skip(skip)
      .limit(parseInt(limit))
      .select("-reviewedBy -rejectionReason");

    // Update live status for events that should be live
    for (const event of events) {
      if (event.status === "published" && event.liveDate <= new Date()) {
        event.status = "live";
        await event.save();
      }
    }

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      data: events,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get Browse Events Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch events",
    });
  }
};

// ===== GET PENDING EVENTS (System Admin) =====
export const getPendingEvents = async (req, res) => {
  try {
    // ✅ Removed role check - let frontend handle authorization
    const events = await Event.find({ status: "pending" })
      .populate("createdBy", "name email organization")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    console.error("Get Pending Events Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending events",
    });
  }
};

// ===== APPROVE EVENT (System Admin) =====
export const approveEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    // ✅ Check role from normalized user object
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only System Admins can approve events",
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (event.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Event is already ${event.status}`,
      });
    }

    event.status = "approved";
    event.reviewedBy = req.user._id;
    event.reviewedAt = new Date();

    await event.save();
    await event.populate("createdBy", "name email organization");

    // Send notification to event creator
    try {
      await notifyEventApproved(event._id, event.name, event.createdBy._id);
    } catch (notifError) {
      console.error("Error sending approval notification:", notifError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      message: "Event approved successfully",
      data: event,
    });
  } catch (error) {
    console.error("Approve Event Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve event",
    });
  }
};

// ===== REJECT EVENT (System Admin) =====
export const rejectEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rejectionReason } = req.body;

    // ✅ Check role from normalized user object
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only System Admins can reject events",
      });
    }

    if (!rejectionReason || rejectionReason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (event.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Event is already ${event.status}`,
      });
    }

    event.status = "rejected";
    event.reviewedBy = req.user._id;
    event.reviewedAt = new Date();
    event.rejectionReason = rejectionReason;

    await event.save();
    await event.populate("createdBy", "name email organization");

    // Send notification to event creator
    try {
      await notifyEventRejected(
        event._id,
        event.name,
        event.createdBy._id,
        rejectionReason,
      );
    } catch (notifError) {
      console.error("Error sending rejection notification:", notifError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      message: "Event rejected",
      data: event,
    });
  } catch (error) {
    console.error("Reject Event Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject event",
    });
  }
};

// ===== PUBLISH EVENT (Event Admin) =====
export const publishEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Only event creator can publish
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only publish your own events",
      });
    }

    // Event must be approved before publishing
    if (event.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved events can be published",
      });
    }

    // Update to published
    event.status = "published";
    event.publishedAt = new Date();
    event.publishedBy = req.user._id;

    await event.save();

    // Send notification to event creator
    try {
      await notifyEventPublished(event._id, event.name, req.user._id);
    } catch (notifError) {
      console.error("Error sending publish notification:", notifError);
      // Don't fail the request if notification fails
    }

    // TODO: Send notifications to all attendees/interested users

    res.status(200).json({
      success: true,
      message: "Event published successfully",
      data: event,
    });
  } catch (error) {
    console.error("Publish Event Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to publish event",
    });
  }
};

// ===== GET PUBLISHED EVENTS (Public) =====
export const getPublishedEvents = async (req, res) => {
  try {
    const {
      search,
      eventType,
      tags,
      page = 1,
      limit = 10,
      sortBy = "latest",
    } = req.query;

    let query = {
      status: { $in: ["published", "live"] },
    };

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Event type filter
    if (eventType) {
      query.eventType = eventType;
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(",");
      query.tags = { $in: tagArray };
    }

    // Determine sort order
    let sortObject = { createdAt: -1 }; // default
    if (sortBy === "oldest") {
      sortObject = { createdAt: 1 };
    } else if (sortBy === "asc_alphabetically") {
      sortObject = { name: 1 };
    } else if (sortBy === "desc_alphabetically") {
      sortObject = { name: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await Event.find(query)
      .populate("createdBy", "name organization")
      .select("-reviewedBy -rejectionReason")
      .sort(sortObject)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(query);
    // Update statuses for any events that should be live
    for (const event of events) {
      await ensureCorrectStatus(event);
    }

    res.status(200).json({
      success: true,
      data: events,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get Published Events Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch published events",
    });
  }
};

// ===== GET SINGLE EVENT =====
export const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
      .populate("createdBy", "name email organization")
      .populate("reviewedBy", "name email");

    // Update statuses for any events that should be live
    await ensureCorrectStatus(event);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Get registration count
    const registrationCount = await Registration.countDocuments({
      event: eventId,
      status: "approved",
    });

    res.status(200).json({
      success: true,
      data: {
        ...event.toObject(),
        registrationCount,
      },
    });
  } catch (error) {
    console.error("Get Event Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch event",
    });
  }
};

// ===== GET MY EVENTS (Event Admin) =====
export const getMyEvents = async (req, res) => {
  try {
    // ✅ Use req.user._id (set by middleware)
    const events = await Event.find({ createdBy: req.user._id })
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    // Update statuses for any events that should be live
    for (const event of events) {
      await ensureCorrectStatus(event);
    }

    res.status(200).json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    console.error("Get My Events Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your events",
    });
  }
};

// ===== UPDATE EVENT =====
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Only creator can update
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own events",
      });
    }

    // Can only update pending or approved events
    if (!["pending", "approved"].includes(event.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot update published or completed events",
      });
    }

    // Prevent updating certain fields
    delete updates.status;
    delete updates.createdBy;
    delete updates.reviewedBy;
    delete updates.reviewedAt;

    // Apply updates
    Object.assign(event, updates);
    await event.save();

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: event,
    });
  } catch (error) {
    console.error("Update Event Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update event",
    });
  }
};

// ===== DELETE EVENT =====
export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // System Admin can delete any event
    // Event Admin can only delete their own pending/rejected events
    const isSystemAdmin = req.user.role === "admin";
    const isOwner = event.createdBy.toString() === req.user._id.toString();

    if (!isSystemAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this event",
      });
    }

    if (!isSystemAdmin && !["pending", "rejected"].includes(event.status)) {
      return res.status(400).json({
        success: false,
        message: "You can only delete pending or rejected events",
      });
    }

    // Check if event has registrations
    const hasRegistrations = await Registration.exists({ event: eventId });

    if (hasRegistrations && event.status !== "rejected") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete event with existing registrations",
      });
    }

    await Event.findByIdAndDelete(eventId);

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Delete Event Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete event",
    });
  }
};

// ===== CANCEL EVENT =====
export const cancelEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { reason } = req.body;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Only event creator can cancel
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own events",
      });
    }

    // Can't cancel completed events
    if (event.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel completed events",
      });
    }

    event.status = "cancelled";
    event.rejectionReason = reason || "Event cancelled by organizer";

    await event.save();

    // TODO: Notify all registered users

    res.status(200).json({
      success: true,
      message: "Event cancelled successfully",
      data: event,
    });
  } catch (error) {
    console.error("Cancel Event Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel event",
    });
  }
};

// ===== GET EVENT STATISTICS (Dashboard) =====
export const getEventStatistics = async (req, res) => {
  try {
    const userId = req.user._id;
    const isSystemAdmin = req.user.role === "admin";

    let stats;

    if (isSystemAdmin) {
      // System Admin sees all events
      stats = await Event.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);
    } else {
      // Event Admin sees only their events
      stats = await Event.aggregate([
        { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);
    }

    const formattedStats = stats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        pending: formattedStats.pending || 0,
        approved: formattedStats.approved || 0,
        rejected: formattedStats.rejected || 0,
        published: formattedStats.published || 0,
        live: formattedStats.live || 0,
        completed: formattedStats.completed || 0,
        cancelled: formattedStats.cancelled || 0,
        total: Object.values(formattedStats).reduce((sum, val) => sum + val, 0),
      },
    });
  } catch (error) {
    console.error("Get Event Statistics Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
};

// ===== UPLOAD EVENT THUMBNAIL =====
export const uploadEventThumbnail = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    // Find event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check ownership (only event creator can upload thumbnail)
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only upload thumbnail to your own events",
      });
    }

    // Delete old thumbnail if it exists
    if (event.thumbnailPublicId) {
      try {
        await deleteFromCloudinary(event.thumbnailPublicId);
      } catch (error) {
        console.error("Error deleting old thumbnail:", error);
        // Continue anyway - don't fail the upload
      }
    }

    // Update event with new thumbnail
    event.thumbnailUrl = req.file.path;
    event.thumbnailPublicId = req.file.filename;
    await event.save();

    res.status(200).json({
      success: true,
      message: "Event thumbnail uploaded successfully",
      data: {
        thumbnailUrl: event.thumbnailUrl,
        eventId: event._id,
      },
    });
  } catch (error) {
    console.error("Upload Event Thumbnail Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload thumbnail",
    });
  }
};

// ===== UPLOAD EVENT CUSTOM BACKGROUND =====
export const uploadEventBackground = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    // Find event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check ownership
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only upload background to your own events",
      });
    }

    // Delete old background if it exists (only if it's from custom uploads)
    if (event.backgroundPublicId && event.backgroundType === "custom") {
      try {
        await deleteFromCloudinary(event.backgroundPublicId);
      } catch (error) {
        console.error("Error deleting old background:", error);
        // Continue anyway
      }
    }

    // Update event with new background
    event.backgroundUrl = req.file.path;
    event.backgroundPublicId = req.file.filename;
    event.backgroundType = "custom"; // Automatically set to custom when uploading
    event.selectedBackgroundId = null; // Clear default background selection
    await event.save();

    res.status(200).json({
      success: true,
      message: "Event background uploaded successfully",
      data: {
        backgroundUrl: event.backgroundUrl,
        backgroundType: event.backgroundType,
        eventId: event._id,
      },
    });
  } catch (error) {
    console.error("Upload Event Background Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload background",
    });
  }
};

// ===== SET DEFAULT BACKGROUND (Admin only) =====
// This endpoint stores the default background that will be used for all "default" background events
// ===== SET DEFAULT BACKGROUNDS (UP TO 5) =====
export const setDefaultBackgrounds = async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can set default backgrounds",
      });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded",
      });
    }

    // Get or create Settings document
    let settings = await Settings.findOne();

    // Get existing backgrounds or empty array
    let existingBackgrounds = settings?.defaultBackgrounds || [];
    const currentCount = existingBackgrounds.length;
    const newFilesCount = req.files.length;

    // Check if total would exceed 5
    if (currentCount + newFilesCount > 5) {
      return res.status(400).json({
        success: false,
        message: `Cannot add ${newFilesCount} background(s). You already have ${currentCount}. Maximum is 5.`,
      });
    }

    // Process new uploaded images and append to existing
    const startId = currentCount + 1;
    const newBackgrounds = req.files.map((file, index) => ({
      backgroundId: startId + index,
      url: file.path,
      publicId: file.filename,
      name: `Background ${startId + index}`,
    }));

    // Combine existing + new backgrounds
    const allBackgrounds = [...existingBackgrounds, ...newBackgrounds];

    if (!settings) {
      // Create new Settings document
      settings = await Settings.create({
        defaultBackgrounds: allBackgrounds,
        lastUpdatedBy: req.user._id,
        lastUpdatedAt: new Date(),
      });
    } else {
      // Update existing Settings (APPEND, don't delete old ones)
      settings.defaultBackgrounds = allBackgrounds;
      settings.lastUpdatedBy = req.user._id;
      settings.lastUpdatedAt = new Date();
      await settings.save();
    }

    res.status(200).json({
      success: true,
      message: `${newFilesCount} background(s) added successfully`,
      data: {
        defaultBackgrounds: allBackgrounds,
        count: allBackgrounds.length,
      },
    });
  } catch (error) {
    console.error("Set Default Backgrounds Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to set default backgrounds",
    });
  }
};

// ===== DELETE A SPECIFIC DEFAULT BACKGROUND (Admin only) =====
export const deleteDefaultBackground = async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete default backgrounds",
      });
    }

    const { backgroundId } = req.params;
    const bgId = parseInt(backgroundId);

    if (isNaN(bgId) || bgId < 1 || bgId > 5) {
      return res.status(400).json({
        success: false,
        message: "Invalid background ID (must be 1-5)",
      });
    }

    // Get settings
    let settings = await Settings.findOne();
    if (
      !settings ||
      !settings.defaultBackgrounds ||
      settings.defaultBackgrounds.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "No default backgrounds found",
      });
    }

    // Find the background to delete
    const bgToDelete = settings.defaultBackgrounds.find(
      (bg) => bg.backgroundId === bgId,
    );
    if (!bgToDelete) {
      return res.status(404).json({
        success: false,
        message: `Background ${bgId} not found`,
      });
    }

    // Delete from Cloudinary
    if (bgToDelete.publicId) {
      try {
        await deleteFromCloudinary(bgToDelete.publicId);
      } catch (error) {
        console.error(`Error deleting background ${bgId}:`, error);
        // Continue anyway
      }
    }

    // Remove the background from the array
    const remainingBackgrounds = settings.defaultBackgrounds.filter(
      (bg) => bg.backgroundId !== bgId,
    );

    // Re-index remaining backgrounds (1, 2, 3, 4)
    const reindexedBackgrounds = remainingBackgrounds.map((bg, idx) => ({
      ...bg,
      backgroundId: idx + 1,
      name: `Background ${idx + 1}`,
    }));

    settings.defaultBackgrounds = reindexedBackgrounds;
    settings.lastUpdatedBy = req.user._id;
    settings.lastUpdatedAt = new Date();
    await settings.save();

    res.status(200).json({
      success: true,
      message: `Background ${bgId} deleted successfully`,
      data: {
        defaultBackgrounds: reindexedBackgrounds,
        count: reindexedBackgrounds.length,
      },
    });
  } catch (error) {
    console.error("Delete Default Background Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete background",
    });
  }
};

// ===== UPDATE EVENT BACKGROUND TYPE =====
export const updateBackgroundType = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { backgroundType } = req.body;

    // Validate input
    if (!backgroundType || !["default", "custom"].includes(backgroundType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid background type. Must be 'default' or 'custom'",
      });
    }

    // Find event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check ownership
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only modify your own events",
      });
    }

    // Update background type
    event.backgroundType = backgroundType;

    // If switching to "default", user must provide selectedBackgroundId in next request
    // For now, clear the background URL since it will be set when user selects one
    if (backgroundType === "default") {
      event.backgroundUrl = null;
      event.backgroundPublicId = null;
      event.selectedBackgroundId = null;
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: "Background type updated successfully",
      data: {
        backgroundType: event.backgroundType,
        backgroundUrl: event.backgroundUrl,
        selectedBackgroundId: event.selectedBackgroundId,
        eventId: event._id,
      },
    });
  } catch (error) {
    console.error("Update Background Type Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update background type",
    });
  }
};

// ===== DELETE EVENT THUMBNAIL =====
export const deleteEventThumbnail = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check ownership
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only modify your own events",
      });
    }

    // Delete from cloudinary if exists
    if (event.thumbnailPublicId) {
      try {
        await deleteFromCloudinary(event.thumbnailPublicId);
      } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
      }
    }

    // Clear thumbnail fields
    event.thumbnailUrl = null;
    event.thumbnailPublicId = null;
    await event.save();

    res.status(200).json({
      success: true,
      message: "Event thumbnail deleted successfully",
      data: {
        eventId: event._id,
      },
    });
  } catch (error) {
    console.error("Delete Event Thumbnail Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete thumbnail",
    });
  }
};

// ===== DELETE CUSTOM BACKGROUND =====
export const deleteCustomBackground = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check ownership
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only modify your own events",
      });
    }

    // Delete from cloudinary if exists (only for custom backgrounds)
    if (event.backgroundPublicId && event.backgroundType === "custom") {
      try {
        await deleteFromCloudinary(event.backgroundPublicId);
      } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
      }
    }

    // Clear background fields
    event.backgroundUrl = null;
    event.backgroundPublicId = null;
    event.selectedBackgroundId = null;
    event.backgroundType = "default"; // Reset to default
    await event.save();

    res.status(200).json({
      success: true,
      message: "Custom background deleted successfully",
      data: {
        eventId: event._id,
        backgroundType: event.backgroundType,
      },
    });
  } catch (error) {
    console.error("Delete Custom Background Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete background",
    });
  }
};

// ===== SET EVENT REMINDER (for users who want 24hr notification) =====
export const setEventReminder = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    // Validate eventId format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user already has a reminder set
    const reminderExists = event.reminders.some(
      (reminder) => reminder.user.toString() === userId.toString(),
    );

    if (reminderExists) {
      return res.status(400).json({
        success: false,
        message: "You have already set a reminder for this event",
      });
    }

    // Add reminder
    event.reminders.push({
      user: userId,
      setAt: new Date(),
      reminderSent: false,
    });

    await event.save();

    res.status(200).json({
      success: true,
      message:
        "Reminder set successfully. You will receive a notification 24 hours before the event goes live.",
      data: {
        eventId: event._id,
        eventName: event.name,
        liveDate: event.liveDate,
      },
    });
  } catch (error) {
    console.error("Set Event Reminder Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to set reminder",
    });
  }
};

// ===== REMOVE EVENT REMINDER =====
export const removeEventReminder = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    // Validate eventId format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Remove reminder
    event.reminders = event.reminders.filter(
      (reminder) => reminder.user.toString() !== userId.toString(),
    );

    await event.save();

    res.status(200).json({
      success: true,
      message: "Reminder removed successfully",
      data: {
        eventId: event._id,
      },
    });
  } catch (error) {
    console.error("Remove Event Reminder Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to remove reminder",
    });
  }
};

// ===== CHECK IF USER HAS REMINDER SET =====
export const hasUserSetReminder = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    // Validate eventId format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const hasReminder = event.reminders.some(
      (reminder) => reminder.user.toString() === userId.toString(),
    );

    res.status(200).json({
      success: true,
      data: {
        hasReminder,
      },
    });
  } catch (error) {
    console.error("Check Reminder Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to check reminder status",
    });
  }
};

// ===== TOGGLE ARCHIVE STATUS =====
export const toggleArchiveEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    // Validate eventId format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Only event creator can toggle archive
    if (event.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only event creator can modify archive status",
      });
    }

    // Toggle archive status
    event.archive = !event.archive;
    await event.save();

    res.status(200).json({
      success: true,
      message: `Event ${event.archive ? "archived" : "unarchived"} successfully`,
      data: {
        eventId: event._id,
        archive: event.archive,
      },
    });
  } catch (error) {
    console.error("Toggle Archive Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to toggle archive status",
    });
  }
};

// ===== GET ARCHIVED/PAST EVENTS (User's Past Events) =====
export const getArchivedEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = "latest" } = req.query;
    const userId = req.user._id;

    // Determine sort order
    let sortObject = { createdAt: -1 }; // default
    if (sortBy === "oldest") {
      sortObject = { createdAt: 1 };
    } else if (sortBy === "asc_alphabetically") {
      sortObject = { name: 1 };
    } else if (sortBy === "desc_alphabetically") {
      sortObject = { name: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find archived events created by the user that are completed
    const archivedEvents = await Event.find({
      createdBy: userId,
      archive: true,
      status: "completed",
    })
      .sort(sortObject)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "name email organization")
      .select("-rejectionReason");

    const total = await Event.countDocuments({
      createdBy: userId,
      archive: true,
      status: "completed",
    });

    res.status(200).json({
      success: true,
      data: archivedEvents,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get Archived Events Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch archived events",
    });
  }
};

// ===== GET PUBLIC ARCHIVED EVENTS (Public Past Events) =====
export const getPublicArchivedEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = "latest" } = req.query;

    // Determine sort order
    let sortObject = { createdAt: -1 }; // default
    if (sortBy === "oldest") {
      sortObject = { createdAt: 1 };
    } else if (sortBy === "asc_alphabetically") {
      sortObject = { name: 1 };
    } else if (sortBy === "desc_alphabetically") {
      sortObject = { name: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find public archived events that are completed
    const archivedEvents = await Event.find({
      archive: true,
      status: "completed",
    })
      .sort(sortObject)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "name organization")
      .select({
        name: 1,
        description: 1,
        eventType: 1,
        tags: 1,
        liveDate: 1,
        startTime: 1,
        endTime: 1,
        venue: 1,
        bannerImage: 1,
        thumbnailUrl: 1,
        createdBy: 1,
      });

    const total = await Event.countDocuments({
      archive: true,
      status: "completed",
    });

    res.status(200).json({
      success: true,
      data: archivedEvents,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get Public Archived Events Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch archived events",
    });
  }
};

// ===== GET DEFAULT BACKGROUNDS SETTINGS (Public) =====
// Frontend can call this to get all available default backgrounds (up to 5)
export const getDefaultBackgrounds = async (req, res) => {
  try {
    const settings = await Settings.findOne();

    if (
      !settings ||
      !settings.defaultBackgrounds ||
      settings.defaultBackgrounds.length === 0
    ) {
      return res.status(200).json({
        success: true,
        message: "No default backgrounds set yet",
        data: {
          defaultBackgrounds: [],
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        defaultBackgrounds: settings.defaultBackgrounds,
      },
    });
  } catch (error) {
    console.error("Get Default Background Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch default background",
    });
  }
};

// In eventController.js
export const getTopEventsByRegistrations = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const topEvents = await Registration.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$event", registrations: { $sum: 1 } } },
      { $sort: { registrations: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "events",
          localField: "_id",
          foreignField: "_id",
          as: "eventDetails",
        },
      },
      { $unwind: "$eventDetails" },
      {
        $project: {
          name: "$eventDetails.name",
          registrations: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: topEvents,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
