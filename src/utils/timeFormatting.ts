/**
 * Time formatting utilities for the endurance racing app
 */

/**
 * Formats a Date object to time string in HH:MM:SS format
 */
export const formatTime = (date: Date | null): string => {
  if (!date) return '--:--:--';
  return date.toLocaleTimeString('en-US', { hour12: false });
};

/**
 * Converts minutes to HH:MM:SS format
 */
export const formatDurationToHMS = (minutes: number | null | undefined): string => {
  if (minutes === null || minutes === undefined || isNaN(minutes) || minutes <= 0) {
    return "00:00:00";
  }
  
  const totalSeconds = Math.floor(minutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Formats duration in MM:SS format (for shorter durations)
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 0) return `-${Math.floor(Math.abs(minutes) / 60)}:${String(Math.abs(minutes) % 60).padStart(2, '0')}`;
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
};

/**
 * Formats race time in HH:MM:SS format
 */
export const formatRaceTime = (minutes: number): string => {
  if (minutes <= 0) return "00:00:00";
  
  const totalSeconds = Math.floor(minutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Parses time string (HH:MM:SS or MM:SS) and returns total minutes
 */
export const parseTimeToMinutes = (timeString: string): number => {
  const parts = timeString.split(':').map(p => parseInt(p) || 0);
  let totalMinutes = 0;
  
  if (parts.length === 2) {
    // MM:SS format
    totalMinutes = parts[0] + (parts[1] / 60);
  } else if (parts.length === 3) {
    // HH:MM:SS format
    totalMinutes = parts[0] * 60 + parts[1] + (parts[2] / 60);
  }
  
  return totalMinutes;
};

/**
 * Creates a new Date with specified time (HH:MM:SS) for today's date
 */
export const createTimeForToday = (timeString: string): Date | null => {
  const timeParts = timeString.split(':');
  if (timeParts.length !== 3) {
    return null;
  }

  const hours = parseInt(timeParts[0]) || 0;
  const minutes = parseInt(timeParts[1]) || 0;
  const seconds = parseInt(timeParts[2]) || 0;

  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, seconds);
};

/**
 * Gets elapsed time in minutes from a start time to current time
 */
export const getElapsedTime = (startTime: Date, currentTime: Date): number => {
  if (!startTime || !currentTime) return 0;
  return (currentTime.getTime() - startTime.getTime()) / 60000;
};

/**
 * Gets remaining time in minutes for a stint
 */
export const getRemainingTime = (startTime: Date, plannedLengthMinutes: number, currentTime: Date): number => {
  if (!startTime || !currentTime) return plannedLengthMinutes;
  const elapsedMinutes = (currentTime.getTime() - startTime.getTime()) / 60000;
  return Math.max(0, plannedLengthMinutes - elapsedMinutes);
};

/**
 * Gets remaining race time in minutes
 */
export const getRemainingRaceTime = (raceStartTime: Date | null, raceLengthHours: number, currentTime: Date): number => {
  if (!raceStartTime) return raceLengthHours * 60;
  const elapsedMinutes = (currentTime.getTime() - raceStartTime.getTime()) / 60000;
  const totalRaceMinutes = raceLengthHours * 60;
  return Math.max(0, totalRaceMinutes - elapsedMinutes);
};
