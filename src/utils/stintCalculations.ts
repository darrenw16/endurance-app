import type { TeamState, RaceConfig } from '../types';

/**
 * Race timing and stint calculation utilities
 */

/**
 * Calculates elapsed time from a start time to current time
 */
export const getElapsedTime = (startTime: Date | null, currentTime: Date, maxElapsed?: number): number => {
  if (!startTime) return 0;
  const rawElapsed = (currentTime.getTime() - startTime.getTime()) / 60000; // minutes with decimals for seconds
  
  // Cap elapsed time at the maximum if provided
  if (maxElapsed !== undefined) {
    return Math.min(rawElapsed, maxElapsed);
  }
  
  return rawElapsed;
};

/**
 * Calculates remaining time in a stint
 */
export const getRemainingTime = (startTime: Date | null, plannedLength: number, currentTime: Date): number => {
  if (!startTime) return plannedLength;
  const elapsed = getElapsedTime(startTime, currentTime);
  const remaining = Math.max(0, plannedLength - elapsed);
  
  // Safety check: if elapsed time exceeds planned length, remaining should be 0
  if (elapsed >= plannedLength) {
    return 0;
  }
  
  return remaining;
};

/**
 * Calculates remaining race time
 */
export const getRemainingRaceTime = (raceStartTime: Date | null, raceLengthHours: number, currentTime: Date): number => {
  if (!raceStartTime) return raceLengthHours * 60; // Return full race time in minutes
  
  const elapsed = getElapsedTime(raceStartTime, currentTime);
  const totalRaceMinutes = raceLengthHours * 60;
  const remaining = totalRaceMinutes - elapsed;
  
  return Math.max(0, remaining);
};

/**
 * Calculates FCY buffer and pit window status
 */
export const calculateFCYBuffer = (
  teamState: TeamState, 
  raceConfig: RaceConfig, 
  currentTime: Date,
  raceStartTime: Date | null
) => {
  if (!teamState || !teamState.stintStartTime) {
    return { buffer: 0, showGreen: false, isInWindow: false };
  }
  
  const elapsed = getElapsedTime(teamState.stintStartTime, currentTime);
  const remainingRaceMinutes = getRemainingRaceTime(raceStartTime, raceConfig.raceLengthHours, currentTime);
  
  // Get the current stint's planned length, fall back to fuel range if not available
  const currentStint = teamState.stints?.[teamState.currentStint - 1];
  const maxStintLength = currentStint?.plannedLength || raceConfig.fuelRangeMinutes;
  
  // FCY window opens 20 minutes before max stint length
  const fcyWindowOpensAt = maxStintLength - 20;
  
  // Simple check first - are we past the time threshold?
  if (elapsed >= fcyWindowOpensAt) {
    // Past the time threshold, check pit strategy
    const remainingFuelInStint = maxStintLength - elapsed;
    const stopsNeededIfDontPit = Math.ceil((remainingRaceMinutes - remainingFuelInStint) / maxStintLength);
    const stopsNeededIfPitNow = Math.ceil(remainingRaceMinutes / maxStintLength);
    
    const wouldAddExtraStop = stopsNeededIfPitNow > stopsNeededIfDontPit;
    
    if (!wouldAddExtraStop) {
      return {
        buffer: 0,
        showGreen: true,
        isInWindow: true
      };
    }
  }
  
  // Either not past time threshold OR would add extra stops
  const timeUntilWindow = Math.max(0, fcyWindowOpensAt - elapsed);
  
  return {
    buffer: timeUntilWindow,
    showGreen: false,
    isInWindow: false
  };
};

/**
 * Determines if a team can pit under FCY
 */
export const canPitOnFCY = (
  teamState: TeamState, 
  raceConfig: RaceConfig, 
  currentTime: Date,
  raceStartTime: Date | null
): boolean => {
  const fcyData = calculateFCYBuffer(teamState, raceConfig, currentTime, raceStartTime);
  return fcyData.showGreen;
};
