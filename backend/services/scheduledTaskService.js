import Event from "../models/Event.js";
import {
  notifyEventReminder,
  notifyAllStallOwnersEventStarting,
  notifyAllParticipantsReminder24h,
  notifyAllParticipantsReminder1h,
  notifyEventEnded,
  notifyAllParticipantsEventEnded,
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
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    // 23 hours from now (to avoid sending multiple reminders)
    const twentyThreeHoursFromNow = new Date(now.getTime() + 23 * 60 * 60 * 1000);

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
      return { success: true, sent: 0 };
    }

    // Send reminders for each event
    const reminderPromises = eventsToRemind.map(event =>
      notifyEventReminder(event._id, event.name, event.createdBy)
        .catch(err => {
          console.error(`Failed to send reminder for event ${event._id}:`, err);
          return null;
        })
    );

    const results = await Promise.all(reminderPromises);
    const successCount = results.filter(r => r !== null).length;

    console.log(`Event reminders sent: ${successCount}/${eventsToRemind.length}`);
    return {
      success: true,
      sent: successCount,
      total: eventsToRemind.length,
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
      }
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
      if (event.endTime && typeof event.endTime === 'string') {
        const [hours, minutes] = event.endTime.split(':').map(Number);
        const eventEndDateTime = new Date(event.liveDate);
        eventEndDateTime.setHours(hours, minutes, 0, 0);

        // If current time has passed the end time, mark as completed
        if (now >= eventEndDateTime) {
          await Event.updateOne(
            { _id: event._id },
            { $set: { status: "completed" } }
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
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    // 23 hours from now (to avoid sending multiple reminders)
    const twentyThreeHoursFromNow = new Date(now.getTime() + 23 * 60 * 60 * 1000);

    // Find events that start in the next 24 hours (but not within the last 23 hours)
    const eventsStarting = await Event.find({
      status: { $in: ["published", "live"] },
      startTime: {
        $gte: twentyThreeHoursFromNow,
        $lte: twentyFourHoursFromNow,
      },
    })
      .select("_id name")
      .lean();

    if (eventsStarting.length === 0) {
      console.log("No events starting soon");
      return { success: true, sent: 0 };
    }

    // Send notifications for each event
    const notificationPromises = eventsStarting.map(event =>
      notifyAllStallOwnersEventStarting(event._id, event.name)
        .catch(err => {
          console.error(`Failed to send event starting soon notifications for event ${event._id}:`, err);
          return { success: false };
        })
    );

    const results = await Promise.all(notificationPromises);
    const totalSent = results.reduce((sum, r) => sum + (r.sent || 0), 0);

    console.log(`Event starting soon notifications sent: ${totalSent} total`);
    return {
      success: true,
      events: eventsStarting.length,
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
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    // 23 hours from now
    const twentyThreeHoursFromNow = new Date(now.getTime() + 23 * 60 * 60 * 1000);

    // Find events starting in the next 24 hours (but not within the last 23 hours)
    const eventsStarting = await Event.find({
      status: { $in: ["published", "live"] },
      startTime: {
        $gte: twentyThreeHoursFromNow,
        $lte: twentyFourHoursFromNow,
      },
    })
      .select("_id name createdBy")
      .lean();

    if (eventsStarting.length === 0) {
      return { success: true, sent: 0 };
    }

    let totalSent = 0;

    // Send reminders for each event
    for (const event of eventsStarting) {
      try {
        // Notify event admin
        await notifyEventReminder24h(event._id, event.name, event.createdBy);
        totalSent++;

        // Notify all participants
        const participantResult = await notifyAllParticipantsReminder24h(event._id, event.name);
        if (participantResult.success) {
          totalSent += participantResult.sent;
        }
      } catch (err) {
        console.error(`Failed to send 24h reminders for event ${event._id}:`, err);
      }
    }

    console.log(`24-hour event reminders sent: ${totalSent} total`);
    return {
      success: true,
      events: eventsStarting.length,
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
    const eventsStarting = await Event.find({
      status: { $in: ["published", "live"] },
      startTime: {
        $gte: fiftyNineMinutesFromNow,
        $lte: oneHourFromNow,
      },
    })
      .select("_id name createdBy")
      .lean();

    if (eventsStarting.length === 0) {
      return { success: true, sent: 0 };
    }

    let totalSent = 0;

    // Send reminders for each event
    for (const event of eventsStarting) {
      try {
        // Notify event admin
        await notifyEventReminder1h(event._id, event.name, event.createdBy);
        totalSent++;

        // Notify all participants
        const participantResult = await notifyAllParticipantsReminder1h(event._id, event.name);
        if (participantResult.success) {
          totalSent += participantResult.sent;
        }
      } catch (err) {
        console.error(`Failed to send 1h reminders for event ${event._id}:`, err);
      }
    }

    console.log(`1-hour event reminders sent: ${totalSent} total`);
    return {
      success: true,
      events: eventsStarting.length,
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

    // Find events that have ended (endTime has passed but not "completed" yet)
    const eventsEnded = await Event.find({
      status: { $in: ["published", "live"] },
      endTime: { $lte: now },
    })
      .select("_id name createdBy")
      .lean();

    if (eventsEnded.length === 0) {
      return { success: true, sent: 0 };
    }

    let totalSent = 0;

    // Send end notifications for each event
    for (const event of eventsEnded) {
      try {
        // Notify event admin
        await notifyEventEnded(event._id, event.name, event.createdBy);
        totalSent++;

        // Notify all participants
        const participantResult = await notifyAllParticipantsEventEnded(event._id, event.name);
        if (participantResult.success) {
          totalSent += participantResult.sent;
        }
      } catch (err) {
        console.error(`Failed to send event ended notifications for event ${event._id}:`, err);
      }
    }

    console.log(`Event ended notifications sent: ${totalSent} total`);
    return {
      success: true,
      events: eventsEnded.length,
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
