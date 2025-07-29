import { useCallback } from 'react';
import type { RaceConfig } from '../../types';

/**
 * Custom hook for Full Course Yellow (FCY) strategy decisions
 * Handles FCY pit recommendations and strategic calculations
 */
export const useFCYStrategy = (
  fcyActive: boolean,
  raceConfig: RaceConfig
) => {

  /**
   * Determine if teams should pit during FCY
   * FCY provides time advantage since field is neutralized
   */
  const shouldRecommendPit = useCallback((): boolean => {
    // Always recommend pit during FCY for time advantage
    return fcyActive;
  }, [fcyActive]);

  /**
   * Calculate time advantage of pitting during FCY vs normal conditions
   * Returns advantage in seconds
   */
  const getFCYPitAdvantage = useCallback((): number => {
    if (!fcyActive) return 0;
    
    // Typical FCY pit advantage (field is neutralized, less track position lost)
    // This is conservative estimate - actual advantage varies by track
    return 15; // 15 seconds advantage
  }, [fcyActive]);

  /**
   * Get optimal actions during FCY period
   * Returns array of recommended actions
   */
  const getOptimalFCYActions = useCallback((): string[] => {
    if (!fcyActive) return [];

    const actions: string[] = [];

    actions.push('Consider pit stop for time advantage');
    actions.push('Take fuel if fuel window is open');
    actions.push('Change drivers if needed');
    actions.push('Check tire condition (if applicable)');
    actions.push('Communicate strategy to all teams');

    return actions;
  }, [fcyActive]);

  /**
   * Calculate when FCY pit window is most advantageous
   * Returns minutes into FCY period when pit is optimal
   */
  const getOptimalFCYPitTiming = useCallback((): number => {
    // Pit immediately when FCY is called for maximum advantage
    return 0;
  }, []);

  /**
   * Determine if FCY creates a strategic opportunity
   * Based on current race conditions and team positions
   */
  const isStrategicFCYOpportunity = useCallback((
    currentFuelMinutes: number,
    targetStintLength: number
  ): boolean => {
    if (!fcyActive) return false;

    // FCY is strategic if:
    // 1. Team has used significant fuel (>50% of range)
    // 2. Still has reasonable stint time remaining (>15 minutes)
    const fuelUsedPercent = currentFuelMinutes / raceConfig.fuelRangeMinutes;
    const remainingStintTime = targetStintLength - currentFuelMinutes;

    return fuelUsedPercent > 0.5 && remainingStintTime > 15;
  }, [fcyActive, raceConfig.fuelRangeMinutes]);

  /**
   * Calculate fuel strategy during FCY
   * Returns recommendation for fuel taking
   */
  const getFCYFuelStrategy = useCallback((currentStintMinutes: number): {
    shouldTakeFuel: boolean;
    reasoning: string;
  } => {
    if (!fcyActive) {
      return { shouldTakeFuel: false, reasoning: 'No FCY active' };
    }

    const fuelRemainingMinutes = raceConfig.fuelRangeMinutes - currentStintMinutes;
    
    if (fuelRemainingMinutes < 30) {
      return { 
        shouldTakeFuel: true, 
        reasoning: 'Low fuel - must take fuel' 
      };
    }
    
    if (fuelRemainingMinutes < 60) {
      return { 
        shouldTakeFuel: true, 
        reasoning: 'FCY opportunity with moderate fuel' 
      };
    }

    if (currentStintMinutes > 30) {
      return { 
        shouldTakeFuel: true, 
        reasoning: 'FCY advantage outweighs early stop' 
      };
    }

    return { 
      shouldTakeFuel: false, 
      reasoning: 'Too early in stint for FCY advantage' 
    };
  }, [fcyActive, raceConfig.fuelRangeMinutes]);

  /**
   * Get FCY communication priorities
   * Returns ordered list of items to communicate to teams
   */
  const getFCYCommunicationPriorities = useCallback((): string[] => {
    if (!fcyActive) return [];

    return [
      'FCY declared - prepare for pit opportunity',
      'Confirm fuel levels and stint progress',
      'Prepare driver change if scheduled',
      'Monitor field neutralization',
      'Ready pit crew for potential stop'
    ];
  }, [fcyActive]);

  return {
    shouldRecommendPit,
    getFCYPitAdvantage,
    getOptimalFCYActions,
    getOptimalFCYPitTiming,
    isStrategicFCYOpportunity,
    getFCYFuelStrategy,
    getFCYCommunicationPriorities
  };
};
