import type { Stint, RaceConfig, TeamState } from '../types';

/**
 * Stint plan generation and management utilities
 */

/**
 * Generates initial stint plan for a race
 */
export const generateStintPlan = (fuelRange: number, raceHours: number, startTime: Date | null = null): Stint[] => {
  const totalRaceMinutes = raceHours * 60;
  const stints: Stint[] = [];
  let raceTimeUsed = 0; // Track total race time used
  let stintNumber = 1;
  
  while (raceTimeUsed < totalRaceMinutes) {
    const remainingRaceTime = totalRaceMinutes - raceTimeUsed;
    const stintLength = Math.min(fuelRange, remainingRaceTime);
    
    // Don't create stints that are too short to be meaningful (but allow very short final stints)
    if (stintLength <= 0) {
      break;
    }
    
    // Ensure no stint exceeds fuel range
    const cappedStintLength = Math.min(stintLength, fuelRange);
    
    const stint: Stint = {
      stintNumber,
      plannedLength: cappedStintLength,
      calculatedLength: null,
      plannedStart: startTime ? new Date(startTime.getTime() + (raceTimeUsed * 60000)) : null,
      predictedStart: null,
      plannedFinish: startTime ? new Date(startTime.getTime() + (raceTimeUsed + cappedStintLength) * 60000) : null,
      predictedFinish: null,
      actualStart: null,
      actualFinish: null,
      pitTime: 170, // Default pit time, should be passed as parameter
      actualPitTime: null,
      fuelTaken: null,
      driver: '',
      elapsed: 0,
      remaining: cappedStintLength,
      fcyBuffer: 0,
      status: 'planned',
      isUnscheduled: false
    };
    
    stints.push(stint);
    raceTimeUsed += cappedStintLength; // Add stint length to race time used
    stintNumber++;
    
    // Safety check: if we've reached or exceeded the race duration, stop
    if (raceTimeUsed >= totalRaceMinutes) {
      break;
    }
  }
  
  // Verify no stint exceeds fuel range
  stints.forEach((stint) => {
    if (stint.plannedLength > fuelRange) {
      stint.plannedLength = fuelRange;
      stint.remaining = fuelRange;
    }
  });
  
  return stints;
};

/**
 * Recalculates stint plan based on current race state
 */
export const recalculateStintPlan = (
  teamState: TeamState, 
  raceConfig: RaceConfig, 
  raceStartTime: Date | null,
  currentTime: Date
): Stint[] => {
  if (!teamState || !raceStartTime) return teamState.stints;

  const remainingRaceMinutes = (raceConfig.raceLengthHours * 60) - 
    ((currentTime.getTime() - raceStartTime.getTime()) / 60000);
    
  if (remainingRaceMinutes <= 5) {
    // Race is almost over, don't add more stints
    return teamState.stints.filter(stint => stint.status === 'completed' || stint.status === 'active');
  }
  
  // Find all completed stints and current active stint
  const completedStints = teamState.stints.filter(stint => stint.status === 'completed');
  const activeStint = teamState.stints.find(stint => stint.status === 'active');
  
  // Calculate how much race time we've already used
  let raceTimeUsed = 0;
  completedStints.forEach(stint => {
    raceTimeUsed += stint.calculatedLength || stint.plannedLength;
  });
  
  // If there's an active stint, add its elapsed time
  if (activeStint && teamState.stintStartTime) {
    const elapsedInActiveStint = (currentTime.getTime() - teamState.stintStartTime.getTime()) / 60000;
    raceTimeUsed += elapsedInActiveStint;
  }
  
  // Calculate remaining time after current stint
  let timeAfterCurrentStint = remainingRaceMinutes;
  if (activeStint && teamState.stintStartTime) {
    const remainingInCurrentStint = Math.max(0, activeStint.plannedLength - 
      ((currentTime.getTime() - teamState.stintStartTime.getTime()) / 60000));
    timeAfterCurrentStint = Math.max(0, remainingRaceMinutes - remainingInCurrentStint);
  }
  
  // Keep completed stints and current active stint
  let newStints = [...completedStints];
  if (activeStint) {
    newStints.push(activeStint);
  }
  
  // Add future stints only if needed and only up to race end
  if (timeAfterCurrentStint > 5) {
    let futureRaceTimeUsed = 0;
    let stintNumber = newStints.length + 1;
    
    while (futureRaceTimeUsed < timeAfterCurrentStint) {
      const remainingTime = timeAfterCurrentStint - futureRaceTimeUsed;
      const stintLength = Math.min(raceConfig.fuelRangeMinutes, remainingTime);
      
      // Don't create stints that are too short
      if (stintLength < 5) break;
      
      const estimatedStartTime = new Date(Date.now() + (futureRaceTimeUsed * 60000));
      
      newStints.push({
        stintNumber,
        plannedLength: stintLength,
        calculatedLength: null,
        plannedStart: estimatedStartTime,
        predictedStart: estimatedStartTime,
        plannedFinish: new Date(estimatedStartTime.getTime() + (stintLength * 60000)),
        predictedFinish: new Date(estimatedStartTime.getTime() + (stintLength * 60000)),
        actualStart: null,
        actualFinish: null,
        pitTime: raceConfig.minPitTimeSeconds,
        actualPitTime: null,
        fuelTaken: null,
        driver: '',
        elapsed: 0,
        remaining: stintLength,
        fcyBuffer: 0,
        status: 'planned',
        isUnscheduled: false
      });
      
      futureRaceTimeUsed += stintLength;
      stintNumber++;
      
      // Safety check: if we've used all remaining race time, stop
      if (futureRaceTimeUsed >= timeAfterCurrentStint) break;
    }
  }
  
  return newStints;
};

/**
 * Gets the assigned driver for a specific stint
 */
export const getDriverForStint = (
  stintIndex: number, 
  teamIndex: number, 
  teams: any[], 
  teamStates: TeamState[]
): string => {
  const team = teams[teamIndex];
  const teamState = teamStates[teamIndex];
  const stint = teamState?.stints?.[stintIndex];
  
  if (!team || !team.drivers.length) {
    return '--';
  }
  
  // If the stint has a driver field populated, use that (for completed stints, unscheduled stops, etc.)
  if (stint && stint.driver) {
    return stint.driver;
  }
  
  // Check if there are custom driver assignments
  if (team.driverAssignments && team.driverAssignments.length > stintIndex) {
    const driverIndex = team.driverAssignments[stintIndex];
    const assignedDriver = team.drivers[driverIndex] || '--';
    return assignedDriver;
  }
  
  // Default rotation for planned stints
  const rotationDriver = team.drivers[stintIndex % team.drivers.length] || '--';
  return rotationDriver;
};
