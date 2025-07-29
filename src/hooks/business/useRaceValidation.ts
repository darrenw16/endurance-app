import { useCallback } from 'react';
import type { RaceConfig, TeamState } from '../../types';

/**
 * Custom hook for race validation and safety checks
 * Handles pit stop validation, timing validation, and strategic recommendations
 */
export const useRaceValidation = (
  raceConfig: RaceConfig,
  teamStates: TeamState[],
  currentTime: Date
) => {

  /**
   * Validate if a pit stop can be executed
   */
  const canExecutePitStop = useCallback((teamIndex: number): { valid: boolean; reasons: string[] } => {
    const reasons: string[] = [];
    
    // Check team exists
    if (teamIndex < 0 || teamIndex >= teamStates.length) {
      reasons.push('Invalid team index');
      return { valid: false, reasons };
    }

    const team = teamStates[teamIndex];
    const teamConfig = raceConfig.teams[teamIndex];

    if (!team) {
      reasons.push('Team state not found');
      return { valid: false, reasons };
    }

    if (!teamConfig) {
      reasons.push('Team configuration not found');
      return { valid: false, reasons };
    }

    // Check if team has an active stint
    if (!team.stintStartTime) {
      reasons.push('No active stint to pit from');
      return { valid: false, reasons };
    }

    // Check minimum stint time (prevent immediate re-pit)
    const stintDuration = (currentTime.getTime() - team.stintStartTime.getTime()) / 60000;
    const minimumStintTime = 10; // 10 minutes minimum

    if (stintDuration < minimumStintTime) {
      reasons.push(`Stint too short (${Math.round(stintDuration)} min, minimum ${minimumStintTime} min)`);
      return { valid: false, reasons };
    }

    // All validations passed
    return { valid: true, reasons: [] };
  }, [teamStates, raceConfig, currentTime]);

  /**
   * Validate pit stop timing and provide warnings
   */
  const validatePitTiming = useCallback((teamIndex: number): { valid: boolean; warnings: string[] } => {
    const warnings: string[] = [];
    const team = teamStates[teamIndex];
    
    if (!team || !team.stintStartTime) {
      return { valid: false, warnings: ['No active stint'] };
    }

    const stintDuration = (currentTime.getTime() - team.stintStartTime.getTime()) / 60000;
    const fuelRange = raceConfig.fuelRangeMinutes;

    // Check if pitting too early
    if (stintDuration < (fuelRange * 0.5)) {
      warnings.push('Pitting early - fuel range not fully utilized');
    }

    // Check if pitting too late
    if (stintDuration > (fuelRange * 0.9)) {
      warnings.push('Pitting late - approaching fuel limit');
    }

    // Check if within optimal window
    const optimalStart = fuelRange * 0.7;
    const optimalEnd = fuelRange * 0.85;
    
    if (stintDuration >= optimalStart && stintDuration <= optimalEnd) {
      // No warnings for optimal timing
    } else if (stintDuration > fuelRange) {
      warnings.push('CRITICAL: Exceeding fuel range!');
    }

    return { valid: true, warnings };
  }, [teamStates, raceConfig, currentTime]);

  /**
   * Validate driver change selection
   */
  const validateDriverChange = useCallback((
    teamIndex: number, 
    newDriverIndex: number
  ): { valid: boolean; reasons: string[] } => {
    const reasons: string[] = [];
    const teamConfig = raceConfig.teams[teamIndex];
    const team = teamStates[teamIndex];

    if (!teamConfig || !team) {
      reasons.push('Team not found');
      return { valid: false, reasons };
    }

    // Check driver index bounds
    if (newDriverIndex < 0 || newDriverIndex >= teamConfig.drivers.length) {
      reasons.push('Invalid driver index');
      return { valid: false, reasons };
    }

    // Check if selecting same driver
    if (newDriverIndex === team.currentDriver) {
      reasons.push('Driver is already driving');
      return { valid: false, reasons };
    }

    // All validations passed
    return { valid: true, reasons: [] };
  }, [raceConfig, teamStates]);

  /**
   * Get pit stop recommendations based on current conditions
   */
  const getPitStopRecommendations = useCallback((
    teamIndex: number, 
    fcyActive: boolean
  ): string[] => {
    const recommendations: string[] = [];
    const team = teamStates[teamIndex];
    const teamConfig = raceConfig.teams[teamIndex];

    if (!team || !teamConfig || !team.stintStartTime) {
      return ['Unable to provide recommendations - insufficient data'];
    }

    const stintDuration = (currentTime.getTime() - team.stintStartTime.getTime()) / 60000;
    const fuelRange = raceConfig.fuelRangeMinutes;
    const fuelRemaining = Math.max(0, fuelRange - stintDuration);

    // FCY recommendations
    if (fcyActive) {
      recommendations.push('✅ FCY Active - Good time to pit');
      recommendations.push('⚡ Time advantage available');
      
      if (stintDuration > 30) {
        recommendations.push('📊 Sufficient stint time completed');
      }
    }

    // Fuel-based recommendations
    if (fuelRemaining < 30) {
      recommendations.push('⛽ LOW FUEL - Pit required soon');
    } else if (fuelRemaining < 60) {
      recommendations.push('⛽ Moderate fuel - Consider pit window');
    } else if (stintDuration < 30) {
      recommendations.push('🕒 Early in stint - wait unless FCY');
    }

    // Driver change recommendations
    if (teamConfig.drivers.length > 1) {
      recommendations.push('🏃 Driver change available');
      
      // Could add driver-specific logic here in future
      const nextDriver = teamConfig.drivers[(team.currentDriver + 1) % teamConfig.drivers.length];
      recommendations.push(`👤 Next driver: ${nextDriver}`);
    }

    // Strategic recommendations
    const timingValidation = validatePitTiming(teamIndex);
    if (timingValidation.warnings.length === 0) {
      recommendations.push('🎯 Optimal pit window timing');
    }

    return recommendations;
  }, [teamStates, raceConfig, currentTime, validatePitTiming]);

  /**
   * Validate race configuration
   */
  const validateRaceConfiguration = useCallback((): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Basic validation
    if (!raceConfig.track.trim()) {
      errors.push('Track name is required');
    }

    if (raceConfig.raceLengthHours < 1 || raceConfig.raceLengthHours > 48) {
      errors.push('Race length must be between 1 and 48 hours');
    }

    if (raceConfig.fuelRangeMinutes < 30 || raceConfig.fuelRangeMinutes > 300) {
      errors.push('Fuel range must be between 30 and 300 minutes');
    }

    if (raceConfig.minPitTimeSeconds < 30 || raceConfig.minPitTimeSeconds > 600) {
      errors.push('Minimum pit time must be between 30 and 600 seconds');
    }

    if (raceConfig.teams.length === 0) {
      errors.push('At least one team is required');
    }

    // Team validation
    raceConfig.teams.forEach((team, index) => {
      if (!team.name.trim()) {
        errors.push(`Team ${index + 1}: Name is required`);
      }
      
      if (!team.number.trim()) {
        errors.push(`Team ${index + 1}: Number is required`);
      }

      if (team.drivers.length === 0) {
        errors.push(`Team ${index + 1}: At least one driver is required`);
      }

      team.drivers.forEach((driver, driverIndex) => {
        if (!driver.trim()) {
          errors.push(`Team ${index + 1}: Driver ${driverIndex + 1} name is required`);
        }
      });
    });

    return { valid: errors.length === 0, errors };
  }, [raceConfig]);

  return {
    canExecutePitStop,
    validatePitTiming,
    validateDriverChange,
    getPitStopRecommendations,
    validateRaceConfiguration
  };
};
