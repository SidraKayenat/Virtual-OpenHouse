import Notification from "../models/Notification.js";
import User from "../models/User.js";
import mongoose from "mongoose";

/**
 * Generic notification creation helper
 */
export const createNotification = async (
  userId,
  title,
  message,
  type,
  referenceId,
  referenceModel,
) => {
  try {
    const notification = new Notification({
      user: userId,
      title,
      message,
      type,
      referenceId,
      referenceModel,
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * EVENT ADMIN NOTIFICATIONS
 */

// When event is submitted for approval
export const notifyEventSubmitted = async (
  eventId,
  eventName,
  eventAdminId,
) => {
  const title = "Event Submitted";
  const message =
    "Your event request has been submitted and is awaiting admin approval";

  return createNotification(
    eventAdminId,
    title,
    message,
    "event_submitted",
    eventId,
    "Event",
  );
};

// When event is approved by admin
export const notifyEventApproved = async (eventId, eventName, eventAdminId) => {
  const title = "Event Approved";
  const message = `Your event '${eventName}' has been approved! You can now publish it.`;

  return createNotification(
    eventAdminId,
    title,
    message,
    "event_approved",
    eventId,
    "Event",
  );
};

// When event is rejected by admin
export const notifyEventRejected = async (
  eventId,
  eventName,
  eventAdminId,
  rejectionReason,
) => {
  const title = "Event Rejected";
  const message = `Your event '${eventName}' was rejected. Reason: ${rejectionReason}`;

  return createNotification(
    eventAdminId,
    title,
    message,
    "event_rejected",
    eventId,
    "Event",
  );
};

// When event is published successfully
export const notifyEventPublished = async (
  eventId,
  eventName,
  eventAdminId,
) => {
  const title = "Event Published";
  const message = `Your event '${eventName}' is now published and accepting stall registrations!`;

  return createNotification(
    eventAdminId,
    title,
    message,
    "event_published",
    eventId,
    "Event",
  );
};

// When new stall registration is received
export const notifyRegistrationReceived = async (
  eventId,
  eventName,
  eventAdminId,
  userName,
  registrationId,
) => {
  const title = "New Stall Registration";
  const message = `${userName} requested a stall for your event '${eventName}'`;

  return createNotification(
    eventAdminId,
    title,
    message,
    "registration_received",
    registrationId,
    "Registration",
  );
};

// Event reminder - 24 hours before going live
export const notifyEventReminder = async (eventId, eventName, eventAdminId) => {
  const title = "Event Going Live Soon";
  const message = `Your event '${eventName}' goes live tomorrow!`;

  return createNotification(
    eventAdminId,
    title,
    message,
    "event_reminder",
    eventId,
    "Event",
  );
};

/**
 * SYSTEM ADMIN NOTIFICATIONS
 */

// When new event is created and needs approval (notify system admins)
export const notifyAdminPendingApproval = async (
  eventId,
  eventName,
  creatorName,
) => {
  try {
    // Get all system admins
    const systemAdmins = await User.find({ role: "admin" });

    const notificationPromises = systemAdmins.map((admin) =>
      createNotification(
        admin._id,
        "New Event Pending Approval",
        `New event '${eventName}' by ${creatorName} is awaiting your approval`,
        "event_pending_approval",
        eventId,
        "Event",
      ),
    );

    return Promise.all(notificationPromises);
  } catch (error) {
    console.error("Error notifying admin pending approval:", error);
    throw error;
  }
};

/**
 * Bulk notification creation helper
 * Useful for sending the same notification to multiple recipients
 */
export const createBulkNotifications = async (
  userIds,
  title,
  message,
  type,
  referenceId,
  referenceModel,
) => {
  try {
    const notifications = await Notification.insertMany(
      userIds.map((userId) => ({
        user: userId,
        title,
        message,
        type,
        referenceId,
        referenceModel,
      })),
    );
    return notifications;
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    throw error;
  }
};

/**
 * REGISTRATION NOTIFICATIONS - FOR PARTICIPANT (Stall Requester)
 */

// When registration is submitted
export const notifyRegistrationSubmitted = async (
  registrationId,
  eventName,
  participantId,
) => {
  const title = "Registration Submitted";
  const message = `Your stall registration for '${eventName}' has been submitted`;

  return createNotification(
    participantId,
    title,
    message,
    "registration_submitted",
    registrationId,
    "Registration",
  );
};

// When registration is approved
export const notifyRegistrationApproved = async (
  registrationId,
  eventName,
  participantId,
  stallNumber,
) => {
  const title = "Registration Approved";
  const message = `Congrats! Your stall request for '${eventName}' was approved. Stall Number: ${stallNumber}`;

  return createNotification(
    participantId,
    title,
    message,
    "registration_approved",
    registrationId,
    "Registration",
  );
};

// When registration is rejected
export const notifyRegistrationRejected = async (
  registrationId,
  eventName,
  participantId,
  rejectionReason,
) => {
  const title = "Registration Rejected";
  const message = `Your stall request for '${eventName}' was rejected. Reason: ${rejectionReason}`;

  return createNotification(
    participantId,
    title,
    message,
    "registration_rejected",
    registrationId,
    "Registration",
  );
};

/**
 * REGISTRATION NOTIFICATIONS - FOR EVENT ADMIN
 */

// When registration is cancelled by user
export const notifyRegistrationCancelledAdmin = async (
  registrationId,
  eventName,
  eventAdminId,
  userName,
) => {
  const title = "Registration Cancelled";
  const message = `${userName} cancelled their stall registration for '${eventName}'`;

  return createNotification(
    eventAdminId,
    title,
    message,
    "registration_cancelled",
    registrationId,
    "Registration",
  );
};

/**
 * STALL NOTIFICATIONS - FOR PARTICIPANT (Stall Owner)
 */

// When stall is created successfully
export const notifyStallCreated = async (
  stallId,
  eventName,
  stallNumber,
  ownerId,
) => {
  const title = "Stall Created";
  const message = `Your stall #${stallNumber} for '${eventName}' is ready! Start uploading content.`;

  return createNotification(
    ownerId,
    title,
    message,
    "stall_created",
    stallId,
    "Stall",
  );
};

// When stall is published successfully
export const notifyStallPublished = async (stallId, eventName, ownerId) => {
  const title = "Stall Published";
  const message = `Your stall is now live in '${eventName}'!`;

  return createNotification(
    ownerId,
    title,
    message,
    "stall_published",
    stallId,
    "Stall",
  );
};

// Event starting soon - 24 hours before
export const notifyEventStartingSoon = async (
  eventId,
  eventName,
  participantId,
) => {
  const title = "Event Starting Soon";
  const message = `Your event '${eventName}' starts tomorrow! Make sure your stall is ready.`;

  return createNotification(
    participantId,
    title,
    message,
    "event_starting_soon",
    eventId,
    "Event",
  );
};

/**
 * SYSTEM NOTIFICATIONS - FOR ALL USERS
 */

// Welcome message for new user
export const notifyWelcomeNewUser = async (userId, userName) => {
  const title = "Welcome to Virtual OpenHouse";
  const message =
    "Welcome to Virtual OpenHouse! Get started by browsing events.";

  return createNotification(userId, title, message, "welcome", null, null);
};

// Account created confirmation
export const notifyAccountCreated = async (userId) => {
  const title = "Account Created";
  const message = "Your account has been created successfully!";

  return createNotification(
    userId,
    title,
    message,
    "account_created",
    null,
    null,
  );
};

/**
 * SYSTEM NOTIFICATIONS - FOR ADMINS
 */

// Notify admin of new user registration
export const notifyAdminNewUser = async (userId, userName, userEmail) => {
  try {
    // Get all system admins
    const systemAdmins = await User.find({ role: "admin" });

    const notificationPromises = systemAdmins.map((admin) =>
      createNotification(
        admin._id,
        "New User Registered",
        `New user registered: ${userName} (${userEmail})`,
        "new_user",
        userId,
        "User",
      ),
    );

    return Promise.all(notificationPromises);
  } catch (error) {
    console.error("Error notifying admin of new user:", error);
    throw error;
  }
};

/**
 * Helper to notify all stall owners about event starting soon (for scheduled tasks)
 */
export const notifyAllStallOwnersEventStarting = async (eventId, eventName) => {
  try {
    // Find all stalls for this event with published status
    const Stall = mongoose.model("Stall");
    const stalls = await Stall.find({ event: eventId }).select("owner").lean();

    if (stalls.length === 0) {
      return { success: true, sent: 0 };
    }

    const ownerIds = stalls.map((stall) => stall.owner);
    const notificationPromises = ownerIds.map((ownerId) =>
      notifyEventStartingSoon(eventId, eventName, ownerId).catch((err) => {
        console.error(
          `Failed to send event starting soon notification to ${ownerId}:`,
          err,
        );
        return null;
      }),
    );

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter((r) => r !== null).length;

    console.log(
      `Event starting soon notifications sent: ${successCount}/${stalls.length}`,
    );
    return {
      success: true,
      sent: successCount,
      total: stalls.length,
    };
  } catch (error) {
    console.error(
      "Error notifying stall owners of event starting soon:",
      error,
    );
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * REMINDER NOTIFICATIONS - 24 HOURS BEFORE EVENT STARTS
 * For Event Admin + All Participants (Stall Owners)
 */
export const notifyEventReminder24h = async (
  eventId,
  eventName,
  eventAdminId,
) => {
  const title = "Event Reminder - 24 Hours";
  const message = `Reminder: '${eventName}' starts in 24 hours!`;

  return createNotification(
    eventAdminId,
    title,
    message,
    "event_reminder_24h",
    eventId,
    "Event",
  );
};

export const notifyAllParticipantsReminder24h = async (eventId, eventName) => {
  try {
    // Find all stalls for this event
    const Stall = mongoose.model("Stall");
    const stalls = await Stall.find({ event: eventId }).select("owner").lean();

    if (stalls.length === 0) {
      return { success: true, sent: 0 };
    }

    const ownerIds = stalls.map((stall) => stall.owner);
    const notificationPromises = ownerIds.map((ownerId) =>
      notifyEventReminder24h(eventId, eventName, ownerId).catch((err) => {
        console.error(`Failed to send 24h reminder to ${ownerId}:`, err);
        return null;
      }),
    );

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter((r) => r !== null).length;

    console.log(
      `24-hour event reminders sent: ${successCount}/${stalls.length}`,
    );
    return {
      success: true,
      sent: successCount,
      total: stalls.length,
    };
  } catch (error) {
    console.error("Error notifying participants of 24h reminder:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * REMINDER NOTIFICATIONS - 1 HOUR BEFORE EVENT STARTS
 * For Event Admin + All Participants (Stall Owners)
 */
export const notifyEventReminder1h = async (
  eventId,
  eventName,
  eventAdminId,
) => {
  const title = "Event Reminder - 1 Hour";
  const message = `Reminder: '${eventName}' starts in 1 hour!`;

  return createNotification(
    eventAdminId,
    title,
    message,
    "event_reminder_1h",
    eventId,
    "Event",
  );
};

export const notifyAllParticipantsReminder1h = async (eventId, eventName) => {
  try {
    // Find all stalls for this event
    const Stall = mongoose.model("Stall");
    const stalls = await Stall.find({ event: eventId }).select("owner").lean();

    if (stalls.length === 0) {
      return { success: true, sent: 0 };
    }

    const ownerIds = stalls.map((stall) => stall.owner);
    const notificationPromises = ownerIds.map((ownerId) =>
      notifyEventReminder1h(eventId, eventName, ownerId).catch((err) => {
        console.error(`Failed to send 1h reminder to ${ownerId}:`, err);
        return null;
      }),
    );

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter((r) => r !== null).length;

    console.log(
      `1-hour event reminders sent: ${successCount}/${stalls.length}`,
    );
    return {
      success: true,
      sent: successCount,
      total: stalls.length,
    };
  } catch (error) {
    console.error("Error notifying participants of 1h reminder:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * EVENT ENDED NOTIFICATION
 * For Event Admin + All Participants (Stall Owners)
 */
export const notifyEventEnded = async (eventId, eventName, eventAdminId) => {
  const title = "Event Ended";
  const message = `'${eventName}' has ended. Thank you for participating!`;

  return createNotification(
    eventAdminId,
    title,
    message,
    "event_ended",
    eventId,
    "Event",
  );
};

export const notifyAllParticipantsEventEnded = async (eventId, eventName) => {
  try {
    // Find all stalls for this event
    const Stall = mongoose.model("Stall");
    const stalls = await Stall.find({ event: eventId }).select("owner").lean();

    if (stalls.length === 0) {
      return { success: true, sent: 0 };
    }

    const ownerIds = stalls.map((stall) => stall.owner);
    const notificationPromises = ownerIds.map((ownerId) =>
      notifyEventEnded(eventId, eventName, ownerId).catch((err) => {
        console.error(
          `Failed to send event ended notification to ${ownerId}:`,
          err,
        );
        return null;
      }),
    );

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter((r) => r !== null).length;

    console.log(
      `Event ended notifications sent: ${successCount}/${stalls.length}`,
    );
    return {
      success: true,
      sent: successCount,
      total: stalls.length,
    };
  } catch (error) {
    console.error("Error notifying participants of event ended:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
