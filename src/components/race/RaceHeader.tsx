import React from 'react';
import { Play, Pause, RotateCcw, Flag } from 'lucide-react';
import { formatRaceTime, getRemainingRaceTime } from '../../utils/timeFormatting';
import type { RaceConfig } from '../../types';

interface RaceHeaderProps {
  raceConfig: RaceConfig;
  raceStartTime: Date | null;
  currentTime: Date;
  racePaused: boolean;
  pausedTime: number;
  fcyActive: boolean;
  onPauseRace: () => void;
  onStopRace: () => void;
  onToggleFCY: () => void;
  onOpenRaceTimeModal: () => void;
}

const RaceHeader: React.FC<RaceHeaderProps> = ({
  raceConfig,
  raceStartTime,
  currentTime,
  racePaused,
  pausedTime,
  fcyActive,
  onPauseRace,
  onStopRace,
  onToggleFCY,
  onOpenRaceTimeModal,
}) => {
  return (
    <div className="bg-gray-800 rounded-xl shadow-2xl p-6 mb-6 border border-gray-700">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{raceConfig.track}</h1>
          <p className="text-gray-300 text-lg">24-Hour Endurance Race</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">Time Remaining</div>
            <div 
              className="text-2xl font-mono cursor-pointer hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors text-white"
              onClick={onOpenRaceTimeModal}
              title="Click to edit race time"
            >
              {formatRaceTime(getRemainingRaceTime(raceStartTime, raceConfig.raceLengthHours, currentTime))}
            </div>
          </div>

          {racePaused && (
            <div className="text-right">
              <div className="text-sm text-red-400">PAUSED</div>
              <div className="text-xl font-mono text-red-400">
                {formatRaceTime((Date.now() - pausedTime) / 60000)}
              </div>
            </div>
          )}
          
          <button
            onClick={onPauseRace}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 font-semibold transition-all duration-200 shadow-lg ${
              racePaused 
                ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-green-500/25' 
                : 'bg-yellow-600 text-white hover:bg-yellow-700 hover:shadow-yellow-500/25'
            }`}
          >
            {racePaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            {racePaused ? 'Resume' : 'Pause'}
          </button>
          
          <button
            onClick={onToggleFCY}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 font-semibold transition-all duration-200 shadow-lg ${
              fcyActive 
                ? 'bg-yellow-500 text-black hover:bg-yellow-600 hover:shadow-yellow-500/25' 
                : 'bg-gray-600 text-white hover:bg-gray-700 hover:shadow-gray-500/25'
            }`}
          >
            <Flag className="w-5 h-5" />
            {fcyActive ? 'FCY ACTIVE' : 'FCY'}
          </button>
          
          <button
            onClick={onStopRace}
            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-red-500/25"
          >
            <RotateCcw className="w-5 h-5" />
            Stop Race
          </button>
        </div>
      </div>
    </div>
  );
};

export default RaceHeader;
