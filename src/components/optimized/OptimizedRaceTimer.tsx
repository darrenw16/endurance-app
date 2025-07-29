import React, { memo, useMemo, useCallback } from 'react';
import { useOptimizedTimer, useRaceTimer } from '../../hooks/useOptimizedTimer';
import { usePerformanceMonitoring, throttle } from '../../utils/performance/performanceMonitoring';
import { Play, Pause, Square, Clock, Flag, AlertTriangle } from 'lucide-react';

interface OptimizedRaceTimerProps {
  raceStartTime: Date | null;
  raceLengthHours: number;
  isRaceStarted: boolean;
  isRacePaused: boolean;
  fcyActive: boolean;
  onStartRace: () => void;
  onPauseRace: () => void;
  onStopRace: () => void;
  onToggleFCY: () => void;
  onTimeClick?: () => void;
}

export const OptimizedRaceTimer = memo<OptimizedRaceTimerProps>(({ 
  raceStartTime,
  raceLengthHours,
  isRaceStarted,
  isRacePaused,
  fcyActive,
  onStartRace,
  onPauseRace,
  onStopRace,
  onToggleFCY,
  onTimeClick
}) => {
  const { recordRender } = usePerformanceMonitoring('OptimizedRaceTimer');
  
  React.useEffect(() => {
    const endTiming = recordRender();
    return endTiming;
  });

  // Use optimized race timer
  const { 
    currentTime, 
    elapsedTime, 
    formattedElapsedTime 
  } = useRaceTimer(
    raceStartTime, 
    isRaceStarted && !isRacePaused,
    {
      updateInterval: 1000,
      significantChangeThreshold: 1 // Update UI every second
    }
  );

  // Memoize race calculations
  const raceCalculations = useMemo(() => {
    const totalRaceSeconds = raceLengthHours * 3600;
    const remainingSeconds = Math.max(0, totalRaceSeconds - elapsedTime);
    
    const remainingHours = Math.floor(remainingSeconds / 3600);
    const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);
    const remainingSecondsDisplay = remainingSeconds % 60;
    
    const progressPercentage = totalRaceSeconds > 0 ? (elapsedTime / totalRaceSeconds) * 100 : 0;
    
    const elapsedHours = Math.floor(elapsedTime / 3600);
    const elapsedMinutes = Math.floor((elapsedTime % 3600) / 60);
    const elapsedSecondsDisplay = elapsedTime % 60;
    
    return {
      totalRaceSeconds,
      remainingSeconds,
      remainingFormatted: `${String(remainingHours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}:${String(remainingSecondsDisplay).padStart(2, '0')}`,
      elapsedFormatted: `${String(elapsedHours).padStart(2, '0')}:${String(elapsedMinutes).padStart(2, '0')}:${String(elapsedSecondsDisplay).padStart(2, '0')}`,
      progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
      isNearFinish: remainingSeconds < 3600, // Less than 1 hour remaining
      isCritical: remainingSeconds < 600,    // Less than 10 minutes remaining
      hoursRemaining: remainingHours,
      minutesRemaining: remainingMinutes
    };
  }, [elapsedTime, raceLengthHours]);

  // Memoize throttled click handlers
  const throttledStartRace = useMemo(() => throttle(onStartRace, 1000), [onStartRace]);
  const throttledPauseRace = useMemo(() => throttle(onPauseRace, 1000), [onPauseRace]);
  const throttledStopRace = useMemo(() => throttle(onStopRace, 1000), [onStopRace]);
  const throttledToggleFCY = useMemo(() => throttle(onToggleFCY, 500), [onToggleFCY]);

  // Memoize button states and styling
  const buttonStates = useMemo(() => {
    return {
      startButton: {
        disabled: isRaceStarted,
        className: `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
          isRaceStarted 
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700 text-white hover:scale-105 active:scale-95'
        }`
      },
      pauseButton: {
        disabled: !isRaceStarted,
        className: `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
          !isRaceStarted 
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : isRacePaused
              ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 active:scale-95'
              : 'bg-yellow-600 hover:bg-yellow-700 text-white hover:scale-105 active:scale-95'
        }`
      },
      stopButton: {
        disabled: !isRaceStarted,
        className: `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
          !isRaceStarted 
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
            : 'bg-red-600 hover:bg-red-700 text-white hover:scale-105 active:scale-95'
        }`
      },
      fcyButton: {
        className: `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
          fcyActive 
            ? 'bg-orange-600 hover:bg-orange-700 text-white ring-2 ring-orange-400 animate-pulse' 
            : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:scale-105 active:scale-95'
        }`
      }
    };
  }, [isRaceStarted, isRacePaused, fcyActive]);

  // Memoize time display styling
  const timeDisplayStyling = useMemo(() => {
    let remainingTimeClass = 'text-4xl md:text-6xl font-mono font-bold transition-colors duration-300';
    
    if (raceCalculations.isCritical) {
      remainingTimeClass += ' text-red-400 animate-pulse';
    } else if (raceCalculations.isNearFinish) {
      remainingTimeClass += ' text-yellow-400';
    } else {
      remainingTimeClass += ' text-green-400';
    }

    return {
      remainingTime: remainingTimeClass,
      elapsedTime: 'text-2xl md:text-3xl font-mono font-medium text-blue-400',
      progressBar: `h-3 rounded-full transition-all duration-1000 ${
        raceCalculations.isCritical ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse' :
        raceCalculations.isNearFinish ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
        'bg-gradient-to-r from-green-500 to-blue-500'
      }`
    };
  }, [raceCalculations.isCritical, raceCalculations.isNearFinish]);

  const handleTimeClick = useCallback(() => {
    if (onTimeClick) {
      onTimeClick();
    }
  }, [onTimeClick]);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      {/* Race Status Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-bold text-gray-100">
            {raceLengthHours}-Hour Endurance Race
          </h2>
        </div>
        
        {/* Race Status Indicator */}
        <div className="flex items-center gap-2">
          {isRacePaused && (
            <div className="bg-yellow-900/50 border border-yellow-400/50 text-yellow-400 px-3 py-1 rounded-lg text-sm font-medium animate-pulse">
              PAUSED
            </div>
          )}
          {fcyActive && (
            <div className="bg-orange-900/50 border border-orange-400/50 text-orange-400 px-3 py-1 rounded-lg text-sm font-medium animate-pulse">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              FCY ACTIVE
            </div>
          )}
          {!isRaceStarted && (
            <div className="bg-gray-900/50 border border-gray-400/50 text-gray-400 px-3 py-1 rounded-lg text-sm font-medium">
              READY
            </div>
          )}
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="text-center mb-6">
        <div className="mb-2">
          <div className="text-sm text-gray-400 mb-1">Time Remaining</div>
          <button
            onClick={handleTimeClick}
            className={`${timeDisplayStyling.remainingTime} hover:scale-105 transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2`}
            aria-label="Click to edit race time"
          >
            {raceStartTime ? raceCalculations.remainingFormatted : `${String(raceLengthHours).padStart(2, '0')}:00:00`}
          </button>
        </div>
        
        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-1">Elapsed Time</div>
          <div className={timeDisplayStyling.elapsedTime}>
            {raceStartTime ? raceCalculations.elapsedFormatted : '00:00:00'}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className={timeDisplayStyling.progressBar}
              style={{ width: `${raceCalculations.progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Start</span>
            <span>{raceCalculations.progressPercentage.toFixed(1)}% Complete</span>
            <span>Finish</span>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={throttledStartRace}
          disabled={buttonStates.startButton.disabled}
          className={buttonStates.startButton.className}
          aria-label="Start race"
        >
          <Play className="h-5 w-5" />
          Start Race
        </button>

        <button
          onClick={throttledPauseRace}
          disabled={buttonStates.pauseButton.disabled}
          className={buttonStates.pauseButton.className}
          aria-label={isRacePaused ? 'Resume race' : 'Pause race'}
        >
          {isRacePaused ? (
            <>
              <Play className="h-5 w-5" />
              Resume
            </>
          ) : (
            <>
              <Pause className="h-5 w-5" />
              Pause
            </>
          )}
        </button>

        <button
          onClick={throttledStopRace}
          disabled={buttonStates.stopButton.disabled}
          className={buttonStates.stopButton.className}
          aria-label="Stop race"
        >
          <Square className="h-5 w-5" />
          Stop
        </button>

        <div className="w-full md:w-auto md:ml-4">
          <button
            onClick={throttledToggleFCY}
            className={buttonStates.fcyButton.className}
            aria-label={fcyActive ? 'Deactivate Full Course Yellow' : 'Activate Full Course Yellow'}
          >
            <Flag className="h-5 w-5" />
            {fcyActive ? 'FCY Active' : 'FCY'}
          </button>
        </div>
      </div>

      {/* Additional Race Information */}
      {isRaceStarted && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-400 mb-1">Current Time</div>
              <div className="text-gray-100 font-medium">
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-gray-400 mb-1">Hours Remaining</div>
              <div className="text-gray-100 font-medium">
                {raceCalculations.hoursRemaining}h {raceCalculations.minutesRemaining}m
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-gray-400 mb-1">Race Progress</div>
              <div className="text-gray-100 font-medium">
                {raceCalculations.progressPercentage.toFixed(2)}%
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-gray-400 mb-1">Status</div>
              <div className={`font-medium ${
                isRacePaused ? 'text-yellow-400' :
                fcyActive ? 'text-orange-400' :
                'text-green-400'
              }`}>
                {isRacePaused ? 'Paused' : fcyActive ? 'FCY' : 'Racing'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

OptimizedRaceTimer.displayName = 'OptimizedRaceTimer';
