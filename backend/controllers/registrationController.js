import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// ===== CREATE REGISTRATION (User registers for event stall) =====
export const createRegistration = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      projectTitle,
      projectDescription,
      category,
      teamMembers,
      requirements,
    } = req.body;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if event accepts registrations
    if (!["published", "live"].includes(event.status)) {
      return res.status(400).json({
        success: false,
        message: `Event is ${event.status}. Only published or live events accept registrations.`,
      });
    }

    // Check if event is full
    if (event.availableStalls <= 0) {
      return res.status(400).json({
        success: false,
        message: "Event is full. No stalls available.",
      });
    }

    // Check if user already registered
    const existingRegistration = await Registration.findOne({
      event: eventId,
      user: req.user._id,
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: `You have already registered for this event. Status: ${existingRegistration.status}`,
        data: existingRegistration,
      });
    }

    // Create registration
    const registration = await Registration.create({
      event: eventId,
      user: req.user._id,
      status: "pending",
      participantInfo: {
        projectTitle,
        projectDescription,
        category,
        teamMembers,
        requirements,
      },
    });

    await registration.populate([
      { path: "event", select: "name liveDate numberOfStalls availableStalls" },
      { path: "user", select: "name email organization" },
    ]);

    // TODO: Send notification to Event Admin about new registration

    res.status(201).json({
      success: true,
      message: "Registration submitted successfully. Awaiting approval from Event Admin.",
      data: registration,
    });
  } catch (error) {
    console.error("Create Registration Error:", error);

    // Handle duplicate registration error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already registered for this event",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create registration",
    });
  }
};

// ===== GET ALL REGISTRATIONS FOR AN EVENT (Event Admin) =====
export const getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Only event creator can view registrations
    if (
      event.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "system_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view registrations for your own events",
      });
    }

    // Build query
    let query = { event: eventId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const registrations = await Registration.find(query)
      .populate("user", "name email organization phoneNumber")
      .populate("approvedBy", "name email")
      .populate("rejectedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Registration.countDocuments(query);

    res.status(200).json({
      success: true,
      data: registrations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get Event Registrations Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch registrations",
    });
  }
};

// ===== GET PENDING REGISTRATIONS (Event Admin) =====
export const getPendingRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Only event creator can view pending registrations
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only view registrations for your own events",
      });
    }

    const pendingRegistrations = await Registration.getPendingForEvent(eventId);

    res.status(200).json({
      success: true,
      data: pendingRegistrations,
      count: pendingRegistrations.length,
    });
  } catch (error) {
    console.error("Get Pending Registrations Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending registrations",
    });
  }
};

// ===== APPROVE REGISTRATION (Event Admin assigns stall) =====
export const approveRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { stallNumber } = req.body;

    if (!stallNumber) {
      return res.status(400).json({
        success: false,
        message: "Stall number is required",
      });
    }

    const registration = await Registration.findById(registrationId).populate("event");

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // Check if user is the event creator
    if (registration.event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only approve registrations for your own events",
      });
    }

    // Check if registration is pending
    if (!registration.canBeApproved()) {
      return res.status(400).json({
        success: false,
        message: `Registration is already ${registration.status}`,
      });
    }

    // Check if stall number is valid
    if (stallNumber < 1 || stallNumber > registration.event.numberOfStalls) {
      return res.status(400).json({
        success: false,
        message: `Invalid stall number. Must be between 1 and ${registration.event.numberOfStalls}`,
      });
    }

    // Check if stall number is already assigned
    const existingStall = await Registration.findOne({
      event: registration.event._id,
      stallNumber,
      status: "approved",
    });

    if (existingStall) {
      return res.status(400).json({
        success: false,
        message: `Stall number ${stallNumber} is already assigned`,
      });
    }

    // Check if event still has available stalls
    if (registration.event.availableStalls <= 0) {
      return res.status(400).json({
        success: false,
        message: "Event is full. No more stalls available.",
      });
    }

    // Approve registration
    registration.status = "approved";
    registration.stallNumber = stallNumber;
    registration.approvedBy = req.user._id;
    registration.approvedAt = new Date();

    await registration.save();

    await registration.populate([
      { path: "user", select: "name email organization" },
      { path: "event", select: "name liveDate" },
      { path: "approvedBy", select: "name email" },
    ]);

    // TODO: Send notification to user about approval

    res.status(200).json({
      success: true,
      message: "Registration approved successfully",
      data: registration,
    });
  } catch (error) {
    console.error("Approve Registration Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve registration",
    });
  }
};

// ===== REJECT REGISTRATION (Event Admin) =====
export const rejectRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const registration = await Registration.findById(registrationId).populate("event");

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // Check if user is the event creator
    if (registration.event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only reject registrations for your own events",
      });
    }

    // Check if registration is pending
    if (registration.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Registration is already ${registration.status}`,
      });
    }

    // Reject registration
    registration.status = "rejected";
    registration.rejectionReason = rejectionReason;
    registration.rejectedBy = req.user._id;
    registration.rejectedAt = new Date();

    await registration.save();

    await registration.populate([
      { path: "user", select: "name email" },
      { path: "rejectedBy", select: "name email" },
    ]);

    // TODO: Send notification to user about rejection

    res.status(200).json({
      success: true,
      message: "Registration rejected",
      data: registration,
    });
  } catch (error) {
    console.error("Reject Registration Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject registration",
    });
  }
};

// ===== GET MY REGISTRATIONS (User) =====
export const getMyRegistrations = async (req, res) => {
  try {
    const { status } = req.query;

    const registrations = await Registration.getByUser(req.user._id, status);

    res.status(200).json({
      success: true,
      data: registrations,
      count: registrations.length,
    });
  } catch (error) {
    console.error("Get My Registrations Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your registrations",
    });
  }
};

// ===== GET SINGLE REGISTRATION =====
export const getRegistrationById = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findById(registrationId)
      .populate("user", "name email organization phoneNumber")
      .populate("event", "name description liveDate numberOfStalls availableStalls")
      .populate("approvedBy", "name email")
      .populate("rejectedBy", "name email");

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // Only allow user themselves or event creator to view
    const isOwner = registration.user._id.toString() === req.user._id.toString();
    const isEventCreator = registration.event.createdBy.toString() === req.user._id.toString();
    const isSystemAdmin = req.user.role === "system_admin";

    if (!isOwner && !isEventCreator && !isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this registration",
      });
    }

    res.status(200).json({
      success: true,
      data: registration,
    });
  } catch (error) {
    console.error("Get Registration Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch registration",
    });
  }
};

// ===== CANCEL REGISTRATION (User) =====
export const cancelRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { cancellationReason } = req.body;

    const registration = await Registration.findById(registrationId).populate("event");

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // Only registration owner can cancel
    if (registration.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own registrations",
      });
    }

    // Check if can be cancelled
    if (!registration.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel ${registration.status} registration`,
      });
    }

    // Cancel registration
    registration.status = "cancelled";
    registration.cancellationReason = cancellationReason || "Cancelled by user";
    registration.cancelledAt = new Date();

    await registration.save();

    // TODO: Notify Event Admin about cancellation

    res.status(200).json({
      success: true,
      message: "Registration cancelled successfully",
      data: registration,
    });
  } catch (error) {
    console.error("Cancel Registration Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel registration",
    });
  }
};

// ===== UPDATE REGISTRATION (User updates project info) =====
export const updateRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const updates = req.body;

    const registration = await Registration.findById(registrationId);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // Only owner can update
    if (registration.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own registrations",
      });
    }

    // Can only update pending registrations
    if (registration.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Can only update pending registrations",
      });
    }

    // Only allow updating participantInfo
    if (updates.participantInfo) {
      registration.participantInfo = {
        ...registration.participantInfo,
        ...updates.participantInfo,
      };
    }

    await registration.save();

    res.status(200).json({
      success: true,
      message: "Registration updated successfully",
      data: registration,
    });
  } catch (error) {
    console.error("Update Registration Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update registration",
    });
  }
};

// ===== GET REGISTRATION STATISTICS (Dashboard) =====
export const getRegistrationStatistics = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Only event creator can view stats
    if (
      event.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "system_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view statistics for your own events",
      });
    }

    const stats = await Registration.aggregate([
      { $match: { event: new mongoose.Types.ObjectId(eventId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = stats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const totalRegistrations = Object.values(formattedStats).reduce(
      (sum, val) => sum + val,
      0
    );

    res.status(200).json({
      success: true,
      data: {
        pending: formattedStats.pending || 0,
        approved: formattedStats.approved || 0,
        rejected: formattedStats.rejected || 0,
        cancelled: formattedStats.cancelled || 0,
        total: totalRegistrations,
        availableStalls: event.availableStalls,
        totalStalls: event.numberOfStalls,
      },
    });
  } catch (error) {
    console.error("Get Registration Statistics Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch registration statistics",
    });
  }
};