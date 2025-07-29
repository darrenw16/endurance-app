import React, { memo, useMemo, useCallback } from 'react';
import { usePerformanceMonitoring } from '../../utils/performance/performanceMonitoring';
import type { TeamState, Stint } from '../../types';

// Optimized individual stint display component
interface StintRowProps {
  stint: Stint;
  stintIndex: number;
  teamIndex: number;
  isSelected: boolean;
  onStintSelect?: (stintIndex: number) => void;
  onTimeEdit?: (stintIndex: number, field: string, type: string) => void;
}

const StintRow = memo<StintRowProps>(({ 
  stint, 
  stintIndex, 
  teamIndex, 
  isSelected,
  onStintSelect,
  onTimeEdit 
}) => {
  const { recordRender } = usePerformanceMonitoring('StintRow');
  
  React.useEffect(() => {
    const endTiming = recordRender();
    return endTiming;
  });

  // Memoize click handlers to prevent unnecessary re-renders
  const handleStintClick = useCallback(() => {
    onStintSelect?.(stintIndex);
  }, [onStintSelect, stintIndex]);

  const handleTimeEdit = useCallback((field: string, type: string) => {
    onTimeEdit?.(stintIndex, field, type);
  }, [onTimeEdit, stintIndex]);

  // Memoize stint status styling
  const stintStatusStyle = useMemo(() => {
    const baseClasses = 'px-3 py-2 rounded-lg border transition-colors duration-200';
    
    switch (stint.status) {
      case 'active':
        return `${baseClasses} bg-green-900/30 border-green-400/50 ${isSelected ? 'ring-2 ring-green-400' : ''}`;
      case 'completed':
        return `${baseClasses} bg-gray-900/30 border-gray-600/50 ${isSelected ? 'ring-2 ring-gray-400' : ''}`;
      case 'planned':
      default:
        return `${baseClasses} bg-blue-900/30 border-blue-400/50 ${isSelected ? 'ring-2 ring-blue-400' : ''}`;
    }
  }, [stint.status, isSelected]);

  // Memoize time formatting
  const formattedTimes = useMemo(() => {
    const formatTime = (date: Date | null) => 
      date ? date.toLocaleTimeString('en-US', { hour12: false }) : '--:--:--';

    return {
      plannedStart: formatTime(stint.plannedStart),
      plannedFinish: formatTime(stint.plannedFinish),
      actualStart: formatTime(stint.actualStart),
      actualFinish: formatTime(stint.actualFinish),
    };
  }, [stint.plannedStart, stint.plannedFinish, stint.actualStart, stint.actualFinish]);

  return (
    <div 
      className={stintStatusStyle}
      onClick={handleStintClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleStintClick()}
    >
      {/* Stint Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-100">
            Stint {stint.stintNumber}
          </span>
          {stint.isUnscheduled && (
            <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded">
              Unscheduled
            </span>
          )}
        </div>
        <div className="text-sm text-gray-400">
          {stint.driver}
        </div>
      </div>

      {/* Timing Information */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-400 mb-1">Planned</div>
          <div className="space-y-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTimeEdit('start', 'planned');
              }}
              className="text-blue-300 hover:text-blue-200 transition-colors"
            >
              Start: {formattedTimes.plannedStart}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTimeEdit('finish', 'planned');
              }}
              className="text-blue-300 hover:text-blue-200 transition-colors block"
            >
              Finish: {formattedTimes.plannedFinish}
            </button>
          </div>
        </div>

        <div>
          <div className="text-gray-400 mb-1">Actual</div>
          <div className="space-y-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTimeEdit('start', 'actual');
              }}
              className="text-green-300 hover:text-green-200 transition-colors"
            >
              Start: {formattedTimes.actualStart}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTimeEdit('finish', 'actual');
              }}
              className="text-green-300 hover:text-green-200 transition-colors block"
            >
              Finish: {formattedTimes.actualFinish}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

StintRow.displayName = 'StintRow';

// Optimized stint schedule component
interface OptimizedStintScheduleProps {
  teamState: TeamState;
  teamIndex: number;
  selectedStintIndex?: number;
  onStintSelect?: (stintIndex: number) => void;
  onTimeEdit?: (stintIndex: number, field: string, type: string) => void;
}

export const OptimizedStintSchedule = memo<OptimizedStintScheduleProps>(({ 
  teamState,
  teamIndex,
  selectedStintIndex,
  onStintSelect,
  onTimeEdit 
}) => {
  const { recordRender } = usePerformanceMonitoring('OptimizedStintSchedule');
  
  React.useEffect(() => {
    const endTiming = recordRender();
    return endTiming;
  });

  // Memoize stint filtering and sorting
  const processedStints = useMemo(() => {
    return teamState.stints
      .map((stint, index) => ({ stint, originalIndex: index }))
      .sort((a, b) => a.stint.stintNumber - b.stint.stintNumber);
  }, [teamState.stints]);

  // Memoize handlers to prevent child re-renders
  const handleStintSelect = useCallback((stintIndex: number) => {
    onStintSelect?.(stintIndex);
  }, [onStintSelect]);

  const handleTimeEdit = useCallback((stintIndex: number, field: string, type: string) => {
    onTimeEdit?.(stintIndex, field, type);
  }, [onTimeEdit]);

  if (processedStints.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <div className="text-gray-400 mb-2">No stints scheduled</div>
        <div className="text-sm text-gray-500">
          Stints will appear here once the race starts
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {processedStints.map(({ stint, originalIndex }) => (
          <StintRow
            key={`stint-${stint.stintNumber}-${originalIndex}`}
            stint={stint}
            stintIndex={originalIndex}
            teamIndex={teamIndex}
            isSelected={selectedStintIndex === originalIndex}
            onStintSelect={handleStintSelect}
            onTimeEdit={handleTimeEdit}
          />
        ))}
      </div>
    </div>
  );
});

OptimizedStintSchedule.displayName = 'OptimizedStintSchedule';

// Optimized team status component
interface OptimizedTeamStatusProps {
  teamState: TeamState;
  teamIndex: number;
  teamConfig: {
    number: string;
    name: string;
    drivers: string[];
  };
  currentTime: Date;
  raceStartTime: Date | null;
  isSelected?: boolean;
  onSelect?: (teamIndex: number) => void;
}

export const OptimizedTeamStatus = memo<OptimizedTeamStatusProps>(({ 
  teamState,
  teamIndex,
  teamConfig,
  currentTime,
  raceStartTime,
  isSelected = false,
  onSelect 
}) => {
  const { recordRender } = usePerformanceMonitoring('OptimizedTeamStatus');
  
  React.useEffect(() => {
    const endTiming = recordRender();
    return endTiming;
  });

  // Memoize team calculations
  const teamCalculations = useMemo(() => {
    const currentStint = teamState.stints[teamState.currentStint - 1];
    let stintElapsed = 0;
    let stintRemaining = 0;
    let totalElapsed = 0;

    if (teamState.stintStartTime && currentStint) {
      stintElapsed = Math.floor((currentTime.getTime() - teamState.stintStartTime.getTime()) / 60000);
      stintRemaining = Math.max(0, (currentStint.plannedLength || 0) - stintElapsed);
    }

    if (raceStartTime) {
      totalElapsed = Math.floor((currentTime.getTime() - raceStartTime.getTime()) / 60000);
    }

    const currentDriverName = teamConfig.drivers[teamState.currentDriver] || 'Unknown';
    const nextDriver = teamConfig.drivers[(teamState.currentDriver + 1) % teamConfig.drivers.length] || 'Unknown';

    return {
      stintElapsed,
      stintRemaining,
      totalElapsed,
      currentDriverName,
      nextDriver,
      currentStint,
      stintElapsedFormatted: `${Math.floor(stintElapsed / 60)}:${String(stintElapsed % 60).padStart(2, '0')}`,
      stintRemainingFormatted: `${Math.floor(stintRemaining / 60)}:${String(stintRemaining % 60).padStart(2, '0')}`,
      totalElapsedFormatted: `${Math.floor(totalElapsed / 60)}:${String(totalElapsed % 60).padStart(2, '0')}`
    };
  }, [teamState, teamConfig, currentTime, raceStartTime]);

  // Memoize click handler
  const handleSelect = useCallback(() => {
    onSelect?.(teamIndex);
  }, [onSelect, teamIndex]);

  return (
    <div 
      className="bg-gray-800 rounded-lg p-4 border-2 transition-all duration-200 cursor-pointer hover:bg-gray-750"
      onClick={handleSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleSelect()}
    >
      {/* Team Header */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-100">
            #{teamConfig.number} - {teamConfig.name}
          </h3>
          <div className="text-sm text-gray-400">
            Position: {teamState.position}
          </div>
        </div>
        {isSelected && (
          <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
            SELECTED
          </div>
        )}
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <div className="text-sm text-gray-400 mb-1">Current Driver</div>
          <div className="text-white font-medium">
            {teamCalculations.currentDriverName}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Next Driver</div>
          <div className="text-gray-300">
            {teamCalculations.nextDriver}
          </div>
        </div>
      </div>

      {/* Timing Information */}
      {teamCalculations.currentStint && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Stint {teamCalculations.currentStint.stintNumber}:</span>
            <span className="text-white font-medium">
              {teamCalculations.stintElapsedFormatted} / {Math.floor((teamCalculations.currentStint.plannedLength || 0) / 60)}:{String((teamCalculations.currentStint.plannedLength || 0) % 60).padStart(2, '0')}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Remaining:</span>
            <span className={`font-medium ${
              teamCalculations.stintRemaining < 10 ? 'text-red-400' : 
              teamCalculations.stintRemaining < 30 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {teamCalculations.stintRemainingFormatted}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Elapsed:</span>
            <span className="text-blue-400 font-medium">
              {teamCalculations.totalElapsedFormatted}
            </span>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {teamCalculations.currentStint && teamCalculations.currentStint.plannedLength && (
        <div className="mt-3">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min(100, (teamCalculations.stintElapsed / teamCalculations.currentStint.plannedLength) * 100)}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
});

OptimizedTeamStatus.displayName = 'OptimizedTeamStatus';

export { StintRow };
