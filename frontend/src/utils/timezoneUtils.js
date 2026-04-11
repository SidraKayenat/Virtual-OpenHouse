/**
 * Timezone utilities for Pakistan Standard Time (UTC+5)
 * Ensures consistency between what user enters and what's stored in the database
 */

const PAKISTAN_OFFSET = 5 * 60; // UTC+5 in minutes

/**
 * Convert a UTC datetime string to Pakistan local datetime-local format
 * Example: "2026-04-11T23:20:00.000+00:00" → "2026-04-12T04:20"
 * This is used when populating datetime-local inputs for editing
 */
export function utcToLocalDatetimeString(utcDateString) {
  if (!utcDateString) return "";
  
  // Parse the UTC datetime
  const utcDate = new Date(utcDateString);
  
  // Convert to Pakistan time by adding 5 hours
  const pakistaniDate = new Date(utcDate.getTime() + PAKISTAN_OFFSET * 60000);
  
  // Format as datetime-local: "YYYY-MM-DDTHH:mm"
  const year = pakistaniDate.getUTCFullYear();
  const month = String(pakistaniDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(pakistaniDate.getUTCDate()).padStart(2, "0");
  const hours = String(pakistaniDate.getUTCHours()).padStart(2, "0");
  const minutes = String(pakistaniDate.getUTCMinutes()).padStart(2, "0");
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convert a Pakistan local datetime-local value to UTC ISO string
 * Example: "2026-04-12T04:20" → "2026-04-11T23:20:00.000Z"
 * This is used when submitting the form to the backend
 */
export function localDatetimeToUtc(localDatetimeString) {
  if (!localDatetimeString) return null;
  
  // Create a date from the datetime-local value (treated as UTC for calculation)
  const [datePart, timePart] = localDatetimeString.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  
  // Create date treating the input as UTC (since datetime-local doesn't have timezone info)
  const localDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
  
  // Subtract 5 hours to get back to UTC
  const utcDate = new Date(localDate.getTime() - PAKISTAN_OFFSET * 60000);
  
  // Return as ISO string
  return utcDate.toISOString();
}

/**
 * Format a UTC datetime string for display (local Pakistan time)
 * Example: "2026-04-11T23:20:00.000+00:00" → "Apr 12, 2026, 4:20 AM"
 */
export function formatUtcForDisplay(utcDateString, locale = "en-US") {
  if (!utcDateString) return "";
  
  const utcDate = new Date(utcDateString);
  const pakistaniDate = new Date(utcDate.getTime() + PAKISTAN_OFFSET * 60000);
  
  return pakistaniDate.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Convert a UTC time string to Pakistan time string
 * Example: "23:20" → "04:20" (with 5-hour offset)
 * This is used to display startTime and endTime in Pakistan timezone
 */
export function convertUtcTimeToLocal(timeString) {
  if (!timeString) return timeString;
  
  const [hours, minutes] = timeString.split(":").map(Number);
  
  // Add 5 hours for Pakistan offset
  let newHours = hours + 5;
  
  // Handle overflow (if it goes past 24 hours)
  if (newHours >= 24) {
    newHours -= 24;
  }
  
  return `${String(newHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
