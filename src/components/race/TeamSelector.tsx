import React from 'react';
import type { RaceConfig } from '../../types';

interface TeamSelectorProps {
  raceConfig: RaceConfig;
  selectedTeam: number;
  onSelectTeam: (teamIndex: number) => void;
  onExecutePit: (teamIndex: number) => void;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({
  raceConfig,
  selectedTeam,
  onSelectTeam,
  onExecutePit,
}) => {
  return (
    <div className="bg-gray-800 rounded-xl shadow-2xl p-6 mb-6 border border-gray-700">
      <div className="flex flex-wrap gap-3">
        {raceConfig.teams.map((team, index) => (
          <div key={index} className="flex items-center gap-3">
            <button
              onClick={() => onSelectTeam(index)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg ${
                selectedTeam === index
                  ? 'bg-blue-600 text-white shadow-blue-500/25'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
            >
              #{team.number} - {team.name}
            </button>
            <button
              onClick={() => onExecutePit(index)}
              className="px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-orange-500/25"
              title={`Pit stop for team ${team.number}`}
            >
              PIT
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamSelector;
