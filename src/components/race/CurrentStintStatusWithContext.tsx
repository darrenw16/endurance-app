import React from 'react';
import { useRaceContext } from '../../contexts';
import { formatDurationToHMS, getRemainingTime, getElapsedTime, getRemainingRaceTime } from '../../utils/timeFormatting';
import { calculateFCYBuffer } from '../../utils/stintCalculations';

/**
 * CurrentStintStatus component refactored to use RaceContext
 * This demonstrates how the context eliminates prop drilling
 * 
 * BEFORE: Required 8 props to be passed down from parent
 * AFTER: Gets all state directly from context with useRaceContext()
 */
const CurrentStintStatusWithContext: React.FC = () => {
  const { 
    raceConfig, 
    raceState, 
    teamState, 
    actions 
  } = useRaceContext();

  const currentTeam = teamState.teamStates[teamState.selectedTeam];
  const currentStint = currentTeam?.stints?.[currentTeam.currentStint - 1];

  if (!currentTeam || !raceConfig.teams[teamState.selectedTeam]) {
    return null;
  }

  const fcyBuffer = calculateFCYBuffer(currentTeam, raceConfig, raceState.currentTime, raceState.raceStartTime);

  return (
    <div className="bg-gray-800 rounded-xl shadow-2xl p-8 mb-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">
        #{raceConfig.teams[teamState.selectedTeam].number} - {raceConfig.teams[teamState.selectedTeam].name}
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-gray-700 p-4 rounded-xl border border-gray-600">
          <div className="text-sm text-gray-400 mb-2">Current Stint</div>
          <div className="text-3xl font-bold text-white">{currentTeam.currentStint}</div>
        </div>
        
        <div className="bg-green-900/50 p-4 rounded-xl border border-green-700">
          <div className="text-sm text-green-300 mb-2">Stint Elapsed</div>
          <div 
            className="text-xl font-bold text-green-400 cursor-pointer hover:bg-green-800/50 px-3 py-2 rounded-lg transition-colors"
            onClick={actions.openElapsedModal}
            title="Click to edit elapsed time"
          >
            {currentTeam.stintStartTime ? 
              formatDurationToHMS(getElapsedTime(currentTeam.stintStartTime, raceState.currentTime)) : 
              '--:--:--'
            }
          </div>
        </div>

        <div className="bg-blue-900/50 p-4 rounded-xl border border-blue-700">
          <div className="text-sm text-blue-300 mb-2">Stint Remaining</div>
          <div 
            className="text-xl font-bold text-blue-400 cursor-pointer hover:bg-blue-800/50 px-3 py-2 rounded-lg transition-colors"
            onClick={actions.openRemainingModal}
            title="Click to edit remaining time"
          >
            {currentTeam.stintStartTime && currentStint ? 
              formatDurationToHMS(getRemainingTime(currentTeam.stintStartTime, currentStint.plannedLength, raceState.currentTime)) : 
              '--:--:--'
            }
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${
          fcyBuffer.showGreen 
            ? 'bg-green-900/50 border-green-700' 
            : 'bg-yellow-900/50 border-yellow-700'
        }`}>
          <div className="text-sm text-gray-300 mb-2">FCY Buffer</div>
          <div className={`text-xl font-bold ${
            fcyBuffer.showGreen ? 'text-green-400' : 'text-yellow-400'
          }`}>
            {fcyBuffer.isInWindow ? 'PIT WINDOW OPEN' : formatDurationToHMS(fcyBuffer.buffer)}
          </div>
        </div>

        <div className="bg-purple-900/50 p-4 rounded-xl border border-purple-700">
          <div className="text-sm text-purple-300 mb-2">Fuel Range</div>
          <div 
            className="text-xl font-bold text-purple-400 cursor-pointer hover:bg-purple-800/50 px-3 py-2 rounded-lg transition-colors"
            onClick={actions.openFuelRangeModal}
            title="Click to edit fuel range"
          >
            {raceConfig.fuelRangeMinutes} min
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-700 p-6 rounded-xl border border-gray-600">
          <div className="text-sm text-gray-400 mb-2">Current Driver</div>
          <div className="text-lg font-bold text-white">
            {raceConfig.teams[teamState.selectedTeam].drivers[currentTeam.currentDriver] || 'Unknown'}
          </div>
        </div>

        <div className="bg-gray-700 p-6 rounded-xl border border-gray-600">
          <div className="text-sm text-gray-400 mb-2">Position</div>
          <div className="text-lg font-bold text-white">P{currentTeam.position}</div>
        </div>

        <div className="bg-gray-700 p-6 rounded-xl border border-gray-600">
          <div className="text-sm text-gray-400 mb-2">Race Remaining</div>
          <div className="text-lg font-bold text-white">
            {formatDurationToHMS(getRemainingRaceTime(raceState.raceStartTime, raceConfig.raceLengthHours, raceState.currentTime))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentStintStatusWithContext;
