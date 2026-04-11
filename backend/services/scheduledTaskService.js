import Event from "../models/Event.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";
import {
  notifyEventReminder,
  notifyAllStallOwnersEventStarting,
  notifyAllParticipantsReminder24h,
  notifyAllParticipantsReminder1h,
  notifyEventEnded,
  notifyAllParticipantsEventEnded,
  notifyUsersWhoSetReminders,
} from "./notificationService.js";

/**
 * SCHEDULED/CRON JOB UTILITIES
 * These functions are meant to be called by a cron job or scheduled task
 */

/**
 * Check and send reminders for events going live in 24 hours
 * Should be called every hour (or as frequently as needed)
 * Usage: Set up a cron job to call this function periodically
 * Example: every hour at:00 minutes
 */
export const sendEventReminders = async () => {
  try {
    const now = new Date();
    // 24 hours from now
    const twentyFourHoursFromNow = new Date(
      now.getTime() + 24 * 60 * 60 * 1000,
    );
    // 23 hours from now (to avoid sending multiple reminders)
    const twentyThreeHoursFromNow = new Date(
      now.getTime() + 23 * 60 * 60 * 1000,
    );

    // Find events that go live in the next 24 hours (but not within the last 23 hours)
    // This prevents sending the same reminder twice
    const eventsToRemind = await Event.find({
      status: "published",
      liveDate: {
        $gte: twentyThreeHoursFromNow,
        $lte: twentyFourHoursFromNow,
      },
    })
      .select("_id name createdBy")
      .lean();

    if (eventsToRemind.length === 0) {
      console.log("No events to remind");
      return { success: true, sent: 0, userReminders: 0 };
    }

    // Send reminders for event creators
    const reminderPromises = eventsToRemind.map((event) =>
      notifyEventReminder(event._id, event.name, event.createdBy).catch(
        (err) => {
          console.error(`Failed to send reminder for event ${event._id}:`, err);
          return null;
        },
      ),
    );

    const results = await Promise.all(reminderPromises);
    const successCount = results.filter((r) => r !== null).length;

    // Also send reminders to users who set reminders
    let userReminderCount = 0;
    const userReminderPromises = eventsToRemind.map((event) =>
      notifyUsersWhoSetReminders(event._id, event.name)
        .then((result) => {
          if (result.success) {
            userReminderCount += result.sent;
          }
          return result;
        })
        .catch((err) => {
          console.error(
            `Failed to send user reminders for event ${event._id}:`,
            err,
          );
          return null;
        }),
    );

    await Promise.all(userReminderPromises);

    console.log(
      `Event reminders sent: ${successCount}/${eventsToRemind.length}`,
    );
    console.log(`User reminders sent: ${userReminderCount}`);
    return {
      success: true,
      sent: successCount,
      total: eventsToRemind.length,
      userReminders: userReminderCount,
    };
  } catch (error) {
    console.error("Error in sendEventReminders:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Update event status to 'live' when liveDate is reached
 * Should be called frequently (every minute or every 5 minutes)
 */
export const updateLiveEventStatuses = async () => {
  try {
    const now = new Date();

    const updated = await Event.updateMany(
      {
        status: "published",
        liveDate: { $lte: now },
      },
      {
        $set: { status: "live" },
      },
    );

    if (updated.modifiedCount > 0) {
      console.log(`Updated ${updated.modifiedCount} events to 'live' status`);
    }

    return {
      success: true,
      updated: updated.modifiedCount,
    };
  } catch (error) {
    console.error("Error updating live event statuses:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Update event status to 'completed' when liveDate started AND endTime passed
 * Handles startTime and endTime as strings ("HH:MM" format)
 * Should be called frequently
 */
export const updateCompletedEventStatuses = async () => {
  try {
    const now = new Date();

    // Get all live events
    const liveEvents = await Event.find({
      status: "live",
      liveDate: { $lte: now },
      endTime: { $ne: null },
    });

    let completedCount = 0;

    // Check each event to see if endTime has passed
    for (const event of liveEvents) {
      // Parse endTime string ("HH:MM") and combine with liveDate
      if (event.endTime && typeof event.endTime === "string") {
        const [hours, minutes] = event.endTime.split(":").map(Number);
        const eventEndDateTime = new Date(event.liveDate);
        eventEndDateTime.setHours(hours, minutes, 0, 0);

        // If current time has passed the end time, mark as completed
        if (now >= eventEndDateTime) {
          await Event.updateOne(
            { _id: event._id },
            { $set: { status: "completed" } },
          );
          completedCount++;
        }
      }
    }

    if (completedCount > 0) {
      console.log(`Updated ${completedCount} events to 'completed' status`);
    }

    return {
      success: true,
      updated: completedCount,
    };
  } catch (error) {
    console.error("Error updating completed event statuses:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send event starting soon notification (24 hours before startTime)
 * Should be called once per hour
 */
export const sendEventStartingSoonNotifications = async () => {
  try {
    const now = new Date();
    // 24 hours from now
    const twentyFourHoursFromNow = new Date(
      now.getTime() + 24 * 60 * 60 * 1000,
    );
    // 23 hours from now (to avoid sending multiple reminders)
    const twentyThreeHoursFromNow = new Date(
      now.getTime() + 23 * 60 * 60 * 1000,
    );

    // Find events that start in the next 24 hours (but not within the last 23 hours)
    // Also check that notification hasn't been sent yet
    const eventsStarting = await Event.find({
      status: { $in: ["published", "live"] },
      liveDate: {
        $gte: twentyThreeHoursFromNow,
        $lte: twentyFourHoursFromNow,
      },
      eventStartingSoonNotificationSent: false,
    })
      .select("_id name")
      .lean();

    if (eventsStarting.length === 0) {
      console.log("No events starting soon");
      return { success: true, sent: 0 };
    }

    let totalSent = 0;
    let processedEvents = [];

    // Send notifications for each event
    for (const event of eventsStarting) {
      try {
        const result = await notifyAllStallOwnersEventStarting(
          event._id,
          event.name,
        );
        if (result.success) {
          totalSent += result.sent || 0;
          processedEvents.push(event._id);
        }
      } catch (err) {
        console.error(
          `Failed to send event starting soon notifications for event ${event._id}:`,
          err,
        );
      }
    }

    // Mark events as processed to prevent duplicate notifications
    if (processedEvents.length > 0) {
      await Event.updateMany(
        { _id: { $in: processedEvents } },
        { $set: { eventStartingSoonNotificationSent: true } },
      );
    }

    console.log(
      `Event starting soon notifications sent: ${totalSent} total for ${processedEvents.length} events`,
    );
    return {
      success: true,
      events: processedEvents.length,
      totalNotificationsSent: totalSent,
    };
  } catch (error) {
    console.error("Error in sendEventStartingSoonNotifications:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send 24-hour reminder notification before event starts
 * For Event Admin + All Participants (Stall Owners)
 * Should be called once per hour
 */
export const sendReminder24hBeforeStart = async () => {
  try {
    const now = new Date();
    // 24 hours from now
    const twentyFourHoursFromNow = new Date(
      now.getTime() + 24 * 60 * 60 * 1000,
    );
    // 23 hours from now
    const twentyThreeHoursFromNow = new Date(
      now.getTime() + 23 * 60 * 60 * 1000,
    );

    // Find events starting in the next 24 hours (but not within the last 23 hours)
    // Also check that this notification hasn't been sent yet
    const eventsStarting = await Event.find({
      status: { $in: ["published", "live"] },
      liveDate: {
        $gte: twentyThreeHoursFromNow,
        $lte: twentyFourHoursFromNow,
      },
      reminder24hNotificationSent: false,
    })
      .select("_id name createdBy")
      .lean();

    if (eventsStarting.length === 0) {
      return { success: true, sent: 0 };
    }

    let totalSent = 0;
    let processedEvents = [];

    // Send reminders for each event
    for (const event of eventsStarting) {
      try {
        // Notify event admin
        await notifyEventReminder24h(event._id, event.name, event.createdBy);
        totalSent++;

        // Notify all participants
        const participantResult = await notifyAllParticipantsReminder24h(
          event._id,
          event.name,
        );
        if (participantResult.success) {
          totalSent += participantResult.sent;
        }

        processedEvents.push(event._id);
      } catch (err) {
        console.error(
          `Failed to send 24h reminders for event ${event._id}:`,
          err,
        );
      }
    }

    // Mark events as processed to prevent duplicate notifications
    if (processedEvents.length > 0) {
      await Event.updateMany(
        { _id: { $in: processedEvents } },
        { $set: { reminder24hNotificationSent: true } },
      );
    }

    console.log(
      `24-hour event reminders sent: ${totalSent} total for ${processedEvents.length} events`,
    );
    return {
      success: true,
      events: processedEvents.length,
      totalNotificationsSent: totalSent,
    };
  } catch (error) {
    console.error("Error in sendReminder24hBeforeStart:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send 1-hour reminder notification before event starts
 * For Event Admin + All Participants (Stall Owners)
 * Should be called every 15 minutes or every 30 minutes
 */
export const sendReminder1hBeforeStart = async () => {
  try {
    const now = new Date();
    // 1 hour from now
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    // 59 minutes from now (to avoid sending multiple reminders)
    const fiftyNineMinutesFromNow = new Date(now.getTime() + 59 * 60 * 1000);

    // Find events starting in the next hour (but not within the last 59 minutes)
    // Also check that this notification hasn't been sent yet
    const eventsStarting = await Event.find({
      status: { $in: ["published", "live"] },
      liveDate: {
        $gte: fiftyNineMinutesFromNow,
        $lte: oneHourFromNow,
      },
      reminder1hNotificationSent: false,
    })
      .select("_id name createdBy")
      .lean();

    if (eventsStarting.length === 0) {
      return { success: true, sent: 0 };
    }

    let totalSent = 0;
    let processedEvents = [];

    // Send reminders for each event
    for (const event of eventsStarting) {
      try {
        // Notify event admin
        await notifyEventReminder1h(event._id, event.name, event.createdBy);
        totalSent++;

        // Notify all participants
        const participantResult = await notifyAllParticipantsReminder1h(
          event._id,
          event.name,
        );
        if (participantResult.success) {
          totalSent += participantResult.sent;
        }

        processedEvents.push(event._id);
      } catch (err) {
        console.error(
          `Failed to send 1h reminders for event ${event._id}:`,
          err,
        );
      }
    }

    // Mark events as processed to prevent duplicate notifications
    if (processedEvents.length > 0) {
      await Event.updateMany(
        { _id: { $in: processedEvents } },
        { $set: { reminder1hNotificationSent: true } },
      );
    }

    console.log(
      `1-hour event reminders sent: ${totalSent} total for ${processedEvents.length} events`,
    );
    return {
      success: true,
      events: processedEvents.length,
      totalNotificationsSent: totalSent,
    };
  } catch (error) {
    console.error("Error in sendReminder1hBeforeStart:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send event ended notifications
 * For Event Admin + All Participants (Stall Owners)
 * Should be called frequently (every 5-15 minutes)
 */
export const sendEventEndedNotifications = async () => {
  try {
    const now = new Date();

    // Find events that have ended and notification not sent yet
    // Status: live or completed, but eventEndedNotificationSent: false
    const eventsEnded = await Event.find({
      status: { $in: ["live", "completed"] },
      eventEndedNotificationSent: false,
      liveDate: { $lte: now },
      endTime: { $exists: true },
    })
      .select("_id name createdBy liveDate endTime")
      .lean();

    if (eventsEnded.length === 0) {
      return { success: true, sent: 0 };
    }

    let totalSent = 0;
    let processedEvents = [];

    // Send end notifications for each event
    for (const event of eventsEnded) {
      try {
        // Parse endTime (format: "HH:MM") and combine with liveDate to get actual end datetime
        const eventEndDateTime = new Date(event.liveDate);
        const [hours, minutes] = event.endTime.split(":").map(Number);
        eventEndDateTime.setHours(hours, minutes, 0, 0);

        // Only send notification if event has actually ended
        if (now >= eventEndDateTime) {
          // ✅ FIX: Check if event admin already has notification
          const existingAdminNotification = await Notification.findOne({
            user: event.createdBy,
            referenceId: event._id,
            type: "event_ended",
          });

          if (!existingAdminNotification) {
            // Notify event admin
            await notifyEventEnded(event._id, event.name, event.createdBy);
            totalSent++;
          } else {
            console.log(
              `Admin notification already exists for event ${event._id}`,
            );
          }

          // ✅ FIX: Notify all participants with duplicate check
          const Stall = mongoose.model("Stall");
          const stalls = await Stall.find({ event: event._id })
            .select("owner")
            .lean();

          if (stalls.length > 0) {
            const ownerIds = stalls.map((stall) => stall.owner);

            for (const ownerId of ownerIds) {
              // Check if this participant already has a notification
              const existingParticipantNotification =
                await Notification.findOne({
                  user: ownerId,
                  referenceId: event._id,
                  type: "event_ended",
                });

              if (!existingParticipantNotification) {
                await notifyEventEnded(event._id, event.name, ownerId);
                totalSent++;
              }
            }
          }

          // Mark notification as sent to prevent future processing
          processedEvents.push(event._id);
        }
      } catch (err) {
        console.error(
          `Failed to send event ended notifications for event ${event._id}:`,
          err,
        );
      }
    }

    // Update all processed events to mark notification as sent
    if (processedEvents.length > 0) {
      await Event.updateMany(
        { _id: { $in: processedEvents } },
        { $set: { eventEndedNotificationSent: true } },
      );
    }

    console.log(
      `Event ended notifications sent: ${totalSent} total for ${processedEvents.length} events`,
    );
    return {
      success: true,
      events: processedEvents.length,
      totalNotificationsSent: totalSent,
    };
  } catch (error) {
    console.error("Error in sendEventEndedNotifications:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
