import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import mongoose from "mongoose";

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
      customBackground,
      environmentType,
      eventType,
      tags,
      venue,
    } = req.body;

    // Validate user role
    // if (req.user.role !== "event_admin") {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Only Event Admins can create events",
    //   });
    // }

    // Create event
    const event = await Event.create({
      name,
      description,
      numberOfStalls,
      liveDate,
      startTime,
      endTime,
      backgroundType,
      customBackground,
      environmentType,
      eventType,
      tags,
      venue,
      createdBy: req.user._id,
      status: "pending", // Awaiting System Admin approval
    });

    await event.populate("createdBy", "name email organization");

    res.status(201).json({
      success: true,
      message: "Event creation request submitted successfully. Awaiting admin approval.",
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

// ===== GET ALL EVENTS (Admin View) =====
// Role: System Admin views all events for approval
export const getAllEvents = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

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

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await Event.find(query)
      .populate("createdBy", "name email organization")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

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

// ===== GET PENDING EVENTS (System Admin) =====
export const getPendingEvents = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only System Admins can view pending events",
      });
    }

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

    // Verify System Admin role
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

    // Update event status
    event.status = "approved";
    event.reviewedBy = req.user._id;
    event.reviewedAt = new Date();

    await event.save();
    await event.populate("createdBy", "name email organization");

    // TODO: Send notification to Event Admin

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

    // Verify System Admin role
    if (req.user.role !== "system_admin") {
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

    // Update event status
    event.status = "rejected";
    event.reviewedBy = req.user._id;
    event.reviewedAt = new Date();
    event.rejectionReason = rejectionReason;

    await event.save();
    await event.populate("createdBy", "name email organization");

    // TODO: Send notification to Event Admin

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
    const { search, eventType, tags, page = 1, limit = 10 } = req.query;

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

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await Event.find(query)
      .populate("createdBy", "name organization")
      .select("-reviewedBy -rejectionReason")
      .sort({ liveDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

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
    const events = await Event.find({ createdBy: req.user._id })
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

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
    const isSystemAdmin = req.user.role === "system_admin";
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
    const isSystemAdmin = req.user.role === "system_admin";

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