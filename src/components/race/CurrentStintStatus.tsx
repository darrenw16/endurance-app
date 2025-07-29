import React from 'react';
import { formatDurationToHMS, getRemainingTime, getElapsedTime, getRemainingRaceTime } from '../../utils/timeFormatting';
import { calculateFCYBuffer } from '../../utils/stintCalculations';
import type { RaceConfig, TeamState } from '../../types';

interface CurrentStintStatusProps {
  raceConfig: RaceConfig;
  currentTeam: TeamState;
  selectedTeam: number;
  raceStartTime: Date | null;
  currentTime: Date;
  onOpenElapsedModal: () => void;
  onOpenRemainingModal: () => void;
  onOpenFuelRangeModal: () => void;
}

const CurrentStintStatus: React.FC<CurrentStintStatusProps> = ({
  raceConfig,
  currentTeam,
  selectedTeam,
  raceStartTime,
  currentTime,
  onOpenElapsedModal,
  onOpenRemainingModal,
  onOpenFuelRangeModal,
}) => {
  const currentStint = currentTeam?.stints?.[currentTeam.currentStint - 1];

  if (!currentTeam || !raceConfig.teams[selectedTeam]) {
    return null;
  }

  const fcyBuffer = calculateFCYBuffer(currentTeam, raceConfig, currentTime, raceStartTime);

  return (
    <div className="bg-gray-800 rounded-xl shadow-2xl p-8 mb-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">
        #{raceConfig.teams[selectedTeam].number} - {raceConfig.teams[selectedTeam].name}
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
            onClick={onOpenElapsedModal}
            title="Click to edit"
          >
            {formatDurationToHMS(currentTeam.stintStartTime ? getElapsedTime(currentTeam.stintStartTime, currentTime) : 0)}
          </div>
        </div>
        
        <div className="bg-orange-900/50 p-4 rounded-xl border border-orange-700">
          <div className="text-sm text-orange-300 mb-2">Stint Remaining</div>
          <div 
            className="text-xl font-bold text-orange-400 cursor-pointer hover:bg-orange-800/50 px-3 py-2 rounded-lg transition-colors"
            onClick={onOpenRemainingModal}
            title="Click to edit"
          >
            {(() => {
              if (!currentTeam || !currentStint) {
                return "00:00:00";
              }
              
              if (!currentTeam.stintStartTime) {
                return formatDurationToHMS(currentStint.plannedLength);
              }
              
              const remaining = getRemainingTime(currentTeam.stintStartTime, currentStint.plannedLength, currentTime);
              return formatDurationToHMS(remaining);
            })()}
          </div>
        </div>
        
        <div className="bg-blue-900/50 p-4 rounded-xl border border-blue-700">
          <div className="text-sm text-blue-300 mb-2">Predicted # of Stints</div>
          <div className="text-xl font-bold text-blue-400">{currentTeam.stints.length}</div>
        </div>
        
        <div className={`p-4 rounded-xl border ${
          fcyBuffer.showGreen 
            ? 'bg-green-900/50 border-green-700' 
            : 'bg-red-900/50 border-red-700'
        }`}>
          <div className="text-sm text-gray-300 mb-2">FCY Buffer</div>
          <div className={`text-xl font-bold ${
            fcyBuffer.showGreen ? 'text-green-400' : 'text-red-400'
          }`}>
            {(() => {
              if (!currentTeam || !currentTeam.stintStartTime) {
                return '00:00:00';
              }
              
              const elapsed = getElapsedTime(currentTeam.stintStartTime, currentTime);
              // Use current stint's planned length instead of global fuel range
              const currentStintLength = currentStint?.plannedLength || raceConfig.fuelRangeMinutes;
              const fcyWindowOpensAt = currentStintLength - 20;
              
              if (elapsed >= fcyWindowOpensAt) {
                return 'PIT WINDOW OPEN';
              } else {
                const timeUntilWindow = fcyWindowOpensAt - elapsed;
                return formatDurationToHMS(timeUntilWindow);
              }
            })()}
          </div>
        </div>
      </div>

      {/* Race Settings Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-purple-900/50 p-4 rounded-xl border border-purple-700">
          <div className="text-sm text-purple-300 mb-2">Max Fuel Range</div>
          <div 
            className="text-xl font-bold text-purple-400 cursor-pointer hover:bg-purple-800/50 px-3 py-2 rounded-lg transition-colors"
            onClick={onOpenFuelRangeModal}
            title="Click to edit fuel range"
          >
            {raceConfig.fuelRangeMinutes} min
          </div>
        </div>
        
        <div className="bg-gray-700 p-4 rounded-xl border border-gray-600">
          <div className="text-sm text-gray-400 mb-2">Min Pit Time</div>
          <div className="text-xl font-bold text-gray-300">
            {raceConfig.minPitTimeSeconds}s
          </div>
        </div>
        
        <div className="bg-gray-700 p-4 rounded-xl border border-gray-600">
          <div className="text-sm text-gray-400 mb-2">Race Length</div>
          <div className="text-xl font-bold text-gray-300">
            {raceConfig.raceLengthHours}h
          </div>
        </div>
      </div>

      {/* Current Driver */}
      <div className="mb-6">
        <div className="text-sm text-gray-400 mb-2">Current Driver</div>
        <div className="text-xl font-semibold text-white">
          {raceConfig.teams[selectedTeam]?.drivers?.[currentTeam.currentDriver] || 'Not assigned'}
        </div>
      </div>
    </div>
  );
};

export default CurrentStintStatus;
