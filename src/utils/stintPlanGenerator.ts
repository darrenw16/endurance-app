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
 * This function preserves completed and active stints and recalculates future planned stints
 */
export const recalculateStintPlan = (
  teamState: TeamState, 
  raceConfig: RaceConfig, 
  raceStartTime: Date | null,
  currentTime: Date
): Stint[] => {
  if (!teamState || !raceStartTime) return teamState.stints;

  const totalRaceMinutes = raceConfig.raceLengthHours * 60;
  const elapsedRaceMinutes = (currentTime.getTime() - raceStartTime.getTime()) / 60000;
  const remainingRaceMinutes = Math.max(0, totalRaceMinutes - elapsedRaceMinutes);
    
  if (remainingRaceMinutes <= 5) {
    // Race is almost over, don't add more stints
    return teamState.stints.filter(stint => stint.status === 'completed' || stint.status === 'active');
  }
  
  // Find all completed stints and current active stint
  const completedStints = teamState.stints.filter(stint => stint.status === 'completed');
  const activeStint = teamState.stints.find(stint => stint.status === 'active');
  
  // Keep completed stints and current active stint
  let newStints = [...completedStints];
  if (activeStint) {
    newStints.push(activeStint);
  }
  
  // Calculate remaining time after current stint
  let timeAfterCurrentStint = remainingRaceMinutes;
  if (activeStint && teamState.stintStartTime) {
    const elapsedInActiveStint = (currentTime.getTime() - teamState.stintStartTime.getTime()) / 60000;
    const remainingInCurrentStint = Math.max(0, activeStint.plannedLength - elapsedInActiveStint);
    timeAfterCurrentStint = Math.max(0, remainingRaceMinutes - remainingInCurrentStint);
  }
  
  // Generate future stints based on new fuel range
  if (timeAfterCurrentStint > 5) {
    let futureRaceTimeUsed = 0;
    let stintNumber = newStints.length + 1;
    
    while (futureRaceTimeUsed < timeAfterCurrentStint) {
      const remainingTime = timeAfterCurrentStint - futureRaceTimeUsed;
      const stintLength = Math.min(raceConfig.fuelRangeMinutes, remainingTime);
      
      // Don't create stints that are too short
      if (stintLength < 5) break;
      
      // Calculate estimated start time based on race progression
      const raceTimeAtStintStart = elapsedRaceMinutes + 
        (activeStint && teamState.stintStartTime ? 
          Math.max(0, activeStint.plannedLength - ((currentTime.getTime() - teamState.stintStartTime.getTime()) / 60000)) : 0) +
        futureRaceTimeUsed;
      
      const estimatedStartTime = new Date(raceStartTime.getTime() + (raceTimeAtStintStart * 60000));
      
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
 * Recalculates stint plan for fuel range changes during race
 * This is specifically for when fuel range is updated mid-race
 * CRITICAL: Preserves timer states and prevents infinite loops
 */
export const recalculateStintPlanForFuelChange = (
  teamState: TeamState,
  raceConfig: RaceConfig,
  raceStartTime: Date | null,
  currentTime: Date
): Stint[] => {
  // Prevent infinite loops with call tracking
  const callKey = `${teamState?.stints?.length}-${raceConfig.fuelRangeMinutes}-${teamState?.stints?.find(s => s.status === 'active')?.plannedLength}`;
  
  // Store last call info to detect rapid identical calls
  if (!(globalThis as any).lastStintRecalcCall) {
    (globalThis as any).lastStintRecalcCall = { key: '', time: 0, count: 0 };
  }
  
  const lastCall = (globalThis as any).lastStintRecalcCall;
  const now = Date.now();
  
  if (lastCall.key === callKey) {
    const timeSinceLastCall = now - lastCall.time;
    lastCall.count++;
    
    // Prevent infinite loops - abort if too many identical calls
    if (timeSinceLastCall < 1000 && lastCall.count > 3) {
      console.warn('Infinite loop detected in stint recalculation - aborting');
      return teamState.stints;
    }
  } else {
    // New call pattern, reset counter
    (globalThis as any).lastStintRecalcCall = { key: callKey, time: now, count: 1 };
  }

  if (!teamState || !raceStartTime || !teamState.stints.length) {
    return generateStintPlan(raceConfig.fuelRangeMinutes, raceConfig.raceLengthHours, raceStartTime);
  }

  // Preserve all completed and active stints - only update plannedLength
  const preservedStints = teamState.stints.filter(stint => 
    stint.status === 'completed' || stint.status === 'active'
  ).map(stint => {
    if (stint.status === 'active') {
      // Only update if fuel range actually changed
      if (stint.plannedLength === raceConfig.fuelRangeMinutes) {
        return stint; // No change needed
      }
      
      // CRITICAL: Only update plannedLength, preserve ALL timing-related fields
      return {
        ...stint,
        plannedLength: raceConfig.fuelRangeMinutes,
        // Preserve: actualStart, actualFinish, status, stintNumber
        // UI calculates elapsed/remaining dynamically from stintStartTime + currentTime
      };
    }
    return stint; // Keep completed stints exactly as they are
  });

  // If no preserved stints, generate fresh plan
  if (preservedStints.length === 0) {
    return generateStintPlan(raceConfig.fuelRangeMinutes, raceConfig.raceLengthHours, raceStartTime);
  }

  // Calculate remaining race time for future stints
  const totalRaceMinutes = raceConfig.raceLengthHours * 60;
  const elapsedRaceMinutes = (currentTime.getTime() - raceStartTime.getTime()) / 60000;
  let remainingRaceMinutes = Math.max(0, totalRaceMinutes - elapsedRaceMinutes);

  // Adjust for remaining time in active stint
  const activeStint = preservedStints.find(stint => stint.status === 'active');
  if (activeStint && teamState.stintStartTime) {
    const elapsedInActiveStint = (currentTime.getTime() - teamState.stintStartTime.getTime()) / 60000;
    const remainingInActiveStint = Math.max(0, activeStint.plannedLength - elapsedInActiveStint);
    remainingRaceMinutes = Math.max(0, remainingRaceMinutes - remainingInActiveStint);
  }

  // Generate new future stints with updated fuel range
  const futureStints: Stint[] = [];
  let futureRaceTimeUsed = 0;
  let stintNumber = preservedStints.length + 1;

  while (futureRaceTimeUsed < remainingRaceMinutes && remainingRaceMinutes > 5) {
    const remainingTime = remainingRaceMinutes - futureRaceTimeUsed;
    const stintLength = Math.min(raceConfig.fuelRangeMinutes, remainingTime);
    
    if (stintLength < 5) break; // Don't create very short stints
    
    // Calculate estimated start time for future stint
    const timeUntilStintStart = activeStint && teamState.stintStartTime ?
      Math.max(0, activeStint.plannedLength - ((currentTime.getTime() - teamState.stintStartTime.getTime()) / 60000)) :
      0;
    
    const estimatedStartTime = new Date(currentTime.getTime() + ((timeUntilStintStart + futureRaceTimeUsed) * 60000));
    
    futureStints.push({
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
  }

  return [...preservedStints, ...futureStints];
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
