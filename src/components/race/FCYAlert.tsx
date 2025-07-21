import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { canPitOnFCY } from '../../utils/stintCalculations';
import type { RaceConfig, TeamState } from '../../types';

interface FCYAlertProps {
  fcyActive: boolean;
  currentTeam: TeamState;
  raceConfig: RaceConfig;
  currentTime: Date;
  raceStartTime: Date | null;
  onExecutePit: () => void;
}

const FCYAlert: React.FC<FCYAlertProps> = ({
  fcyActive,
  currentTeam,
  raceConfig,
  currentTime,
  raceStartTime,
  onExecutePit,
}) => {
  if (!fcyActive) {
    return null;
  }

  const canPit = canPitOnFCY(currentTeam, raceConfig, currentTime, raceStartTime);

  return (
    <div className={`p-6 rounded-xl mb-6 border-2 ${
      canPit 
        ? 'bg-green-900/50 border-green-500' 
        : 'bg-yellow-900/50 border-yellow-500'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-400" />
          <span className="font-semibold text-white text-lg">
            {canPit 
              ? 'PIT WINDOW OPEN - Recommend pit stop under FCY'
              : 'FCY Active - Outside optimal pit window'
            }
          </span>
        </div>
        {canPit && (
          <button 
            onClick={onExecutePit}
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-green-500/25"
          >
            PIT NOW
          </button>
        )}
      </div>
    </div>
  );
};

export default FCYAlert;
