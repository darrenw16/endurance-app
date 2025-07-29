import { memoize } from './performanceMonitoring.tsx';
import type { RaceConfig, TeamState, Stint } from '../../types';

/**
 * Optimized stint calculation utilities with memoization and performance monitoring
 */

// Cache for expensive calculations
const calculationCache = new Map<string, any>();

// Memoized function to calculate stint timing
export const calculateStintTiming = memoize(
  (
    raceStartTime: Date | null,
    teamStartTime: Date | null,
    currentTime: Date,
    stint: Stint,
    fuelRangeMinutes: number
  ) => {
    if (!raceStartTime || !teamStartTime) {
      return {
        elapsed: 0,
        remaining: stint.plannedLength || fuelRangeMinutes,
        fcyBuffer: 0,
        progressPercentage: 0
      };
    }

    const elapsedMs = currentTime.getTime() - teamStartTime.getTime();
    const elapsedMinutes = Math.max(0, elapsedMs / 60000);
    const plannedLength = stint.plannedLength || fuelRangeMinutes;
    const remainingMinutes = Math.max(0, plannedLength - elapsedMinutes);
    
    // Calculate FCY buffer (simplified logic for performance)
    const fcyBuffer = stint.fcyBuffer || 0;
    
    const progressPercentage = plannedLength > 0 ? (elapsedMinutes / plannedLength) * 100 : 0;

    return {
      elapsed: Math.floor(elapsedMinutes),
      remaining: Math.floor(remainingMinutes),
      fcyBuffer: Math.floor(fcyBuffer),
      progressPercentage: Math.min(100, Math.max(0, progressPercentage))
    };
  },
  // Custom key generator for better cache hits
  (raceStartTime, teamStartTime, currentTime, stint, fuelRange) => 
    `${raceStartTime?.getTime()}-${teamStartTime?.getTime()}-${Math.floor(currentTime.getTime() / 1000)}-${stint.stintNumber}-${stint.plannedLength}-${fuelRange}`
);

// Memoized function to calculate team position and statistics
export const calculateTeamStats = memoize(
  (teamState: TeamState, raceStartTime: Date | null, currentTime: Date) => {
    const totalStints = teamState.stints.length;
    const completedStints = teamState.stints.filter(s => s.status === 'completed').length;
    const activeStints = teamState.stints.filter(s => s.status === 'active').length;
    
    let totalRaceTime = 0;
    let totalPitTime = 0;
    let averageStintLength = 0;
    
    if (raceStartTime) {
      totalRaceTime = Math.floor((currentTime.getTime() - raceStartTime.getTime()) / 60000);
    }
    
    const completedStintData = teamState.stints.filter(s => s.status === 'completed');
    if (completedStintData.length > 0) {
      const totalStintTime = completedStintData.reduce((acc, stint) => acc + (stint.elapsed || 0), 0);
      totalPitTime = Math.max(0, totalRaceTime - totalStintTime);
      averageStintLength = totalStintTime / completedStintData.length;
    }

    return {
      totalStints,
      completedStints,
      activeStints,
      completionPercentage: totalStints > 0 ? (completedStints / totalStints) * 100 : 0,
      totalRaceTime,
      totalPitTime,
      averageStintLength: Math.floor(averageStintLength),
      efficiency: totalRaceTime > 0 ? ((totalRaceTime - totalPitTime) / totalRaceTime) * 100 : 100
    };
  },
  (teamState, raceStartTime, currentTime) => 
    `${teamState.currentStint}-${teamState.stints.length}-${raceStartTime?.getTime()}-${Math.floor(currentTime.getTime() / 10000)}`
);

// Optimized function to calculate next pit window
export const calculateNextPitWindow = memoize(
  (
    currentStint: Stint | undefined,
    teamStartTime: Date | null,
    currentTime: Date,
    fuelRangeMinutes: number,
    fcyActive: boolean
  ) => {
    if (!currentStint || !teamStartTime) {
      return {
        timeToNextPit: fuelRangeMinutes,
        canPitNow: false,
        recommendedAction: 'continue',
        urgency: 'low'
      };
    }

    const elapsedMinutes = (currentTime.getTime() - teamStartTime.getTime()) / 60000;
    const remainingMinutes = Math.max(0, (currentStint.plannedLength || fuelRangeMinutes) - elapsedMinutes);
    
    // Determine pit urgency and recommendations
    let urgency: 'low' | 'medium' | 'high' = 'low';
    let recommendedAction: 'continue' | 'prepare' | 'pit_now' = 'continue';
    
    if (remainingMinutes < 5) {
      urgency = 'high';
      recommendedAction = 'pit_now';
    } else if (remainingMinutes < 15) {
      urgency = 'medium';
      recommendedAction = 'prepare';
    } else if (fcyActive && remainingMinutes < 30) {
      urgency = 'medium';
      recommendedAction = 'prepare'; // FCY opportunity
    }

    return {
      timeToNextPit: Math.floor(remainingMinutes),
      canPitNow: remainingMinutes < (fuelRangeMinutes * 0.9), // Can pit when 90% through stint
      recommendedAction,
      urgency,
      fcyOpportunity: fcyActive && remainingMinutes < 30 && remainingMinutes > 10
    };
  },
  (currentStint, teamStartTime, currentTime, fuelRange, fcyActive) =>
    `${currentStint?.stintNumber}-${teamStartTime?.getTime()}-${Math.floor(currentTime.getTime() / 5000)}-${fuelRange}-${fcyActive}`
);

// Batch calculation function for multiple teams
export const calculateAllTeamStats = (
  teamStates: TeamState[],
  raceStartTime: Date | null,
  currentTime: Date,
  fuelRangeMinutes: number
) => {
  // Use a single loop to calculate all team stats for better performance
  return teamStates.map((teamState, index) => {
    const currentStint = teamState.stints[teamState.currentStint - 1];
    
    return {
      teamIndex: index,
      timing: calculateStintTiming(
        raceStartTime,
        teamState.stintStartTime,
        currentTime,
        currentStint || teamState.stints[0],
        fuelRangeMinutes
      ),
      stats: calculateTeamStats(teamState, raceStartTime, currentTime),
      pitWindow: calculateNextPitWindow(
        currentStint,
        teamState.stintStartTime,
        currentTime,
        fuelRangeMinutes,
        false // FCY state would be passed from context
      )
    };
  });
};

// Optimized stint plan generation
export const generateOptimizedStintPlan = memoize(
  (
    raceConfig: RaceConfig,
    teamIndex: number,
    raceStartTime: Date | null,
    currentTime: Date
  ) => {
    const raceLengthMinutes = raceConfig.raceLengthHours * 60;
    const fuelRangeMinutes = raceConfig.fuelRangeMinutes;
    const team = raceConfig.teams[teamIndex];
    
    if (!team || !raceStartTime) {
      return [];
    }

    const stints: Partial<Stint>[] = [];
    let currentStintStart = new Date(raceStartTime);
    let stintNumber = 1;
    let driverIndex = 0;
    
    // Generate stints for the entire race duration
    while ((currentStintStart.getTime() - raceStartTime.getTime()) / 60000 < raceLengthMinutes) {
      const stintLength = fuelRangeMinutes;
      const stintEnd = new Date(currentStintStart.getTime() + (stintLength * 60000));
      
      // Don't extend past race end
      const raceEnd = new Date(raceStartTime.getTime() + (raceLengthMinutes * 60000));
      const actualStintEnd = stintEnd > raceEnd ? raceEnd : stintEnd;
      const actualStintLength = (actualStintEnd.getTime() - currentStintStart.getTime()) / 60000;
      
      if (actualStintLength < 10) break; // Skip very short stints
      
      stints.push({
        stintNumber,
        plannedLength: Math.floor(actualStintLength),
        plannedStart: new Date(currentStintStart),
        plannedFinish: new Date(actualStintEnd),
        predictedStart: new Date(currentStintStart),
        predictedFinish: new Date(actualStintEnd),
        actualStart: null,
        actualFinish: null,
        pitTime: raceConfig.minPitTimeSeconds / 60,
        actualPitTime: null,
        fuelTaken: null,
        driver: team.drivers[driverIndex] || 'Driver 1',
        elapsed: 0,
        remaining: Math.floor(actualStintLength),
        fcyBuffer: 0,
        status: 'planned' as const,
        isUnscheduled: false
      });
      
      // Move to next stint
      currentStintStart = new Date(actualStintEnd.getTime() + (raceConfig.minPitTimeSeconds * 1000));
      stintNumber++;
      driverIndex = (driverIndex + 1) % team.drivers.length;
    }
    
    return stints;
  },
  (raceConfig, teamIndex, raceStartTime, currentTime) =>
    `${JSON.stringify(raceConfig.teams[teamIndex])}-${raceConfig.fuelRangeMinutes}-${raceStartTime?.getTime()}-${Math.floor(currentTime.getTime() / 60000)}`
);

// Utility to clear calculation cache when needed
export const clearStintCalculationCache = () => {
  calculationCache.clear();
};

// Performance monitoring wrapper for stint calculations
export const withStintCalculationPerformance = <T extends (...args: any[]) => any>(
  fn: T,
  operationName: string
): T => {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const start = performance.now();
    const result = fn(...args);
    const duration = performance.now() - start;
    
    if (duration > 10) { // Log if calculation takes more than 10ms
      console.warn(`Slow stint calculation: ${operationName} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }) as T;
};

// Pre-optimized exports with performance monitoring
export const optimizedCalculateStintTiming = withStintCalculationPerformance(
  calculateStintTiming,
  'stint-timing'
);

export const optimizedCalculateTeamStats = withStintCalculationPerformance(
  calculateTeamStats,
  'team-stats'
);

export const optimizedCalculateNextPitWindow = withStintCalculationPerformance(
  calculateNextPitWindow,
  'pit-window'
);

export const optimizedGenerateStintPlan = withStintCalculationPerformance(
  generateOptimizedStintPlan,
  'stint-plan-generation'
);
