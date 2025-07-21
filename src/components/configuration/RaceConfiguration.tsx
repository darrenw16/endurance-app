import React from 'react';
import { Play, Settings, Clock, Fuel, Users, MapPin } from 'lucide-react';
import type { RaceConfig } from '../../types';

interface RaceConfigurationProps {
  raceConfig: RaceConfig;
  setRaceConfig: React.Dispatch<React.SetStateAction<RaceConfig>>;
  onStartRace: () => void;
}

const RaceConfiguration: React.FC<RaceConfigurationProps> = ({
  raceConfig,
  setRaceConfig,
  onStartRace,
}) => {
  const addTeam = () => {
    setRaceConfig(prev => ({
      ...prev,
      numTeams: prev.numTeams + 1,
      teams: [...prev.teams, { number: '', name: '', drivers: [''], driverAssignments: [] }]
    }));
  };

  const updateTeam = (teamIndex: number, field: string, value: string) => {
    setRaceConfig(prev => ({
      ...prev,
      teams: prev.teams.map((team, i) => 
        i === teamIndex ? { ...team, [field]: value } : team
      )
    }));
  };

  const addDriver = (teamIndex: number) => {
    setRaceConfig(prev => ({
      ...prev,
      teams: prev.teams.map((team, i) => 
        i === teamIndex ? { ...team, drivers: [...team.drivers, ''] } : team
      )
    }));
  };

  const updateDriver = (teamIndex: number, driverIndex: number, name: string) => {
    setRaceConfig(prev => ({
      ...prev,
      teams: prev.teams.map((team, i) => 
        i === teamIndex ? {
          ...team,
          drivers: team.drivers.map((driver, j) => j === driverIndex ? name : driver)
        } : team
      )
    }));
  };

  const deleteTeam = (teamIndex: number) => {
    if (raceConfig.teams.length > 1) {
      setRaceConfig(prev => ({
        ...prev,
        numTeams: prev.numTeams - 1,
        teams: prev.teams.filter((_, i) => i !== teamIndex)
      }));
    }
  };

  const deleteDriver = (teamIndex: number, driverIndex: number) => {
    const team = raceConfig.teams[teamIndex];
    if (team.drivers.length > 1) {
      setRaceConfig(prev => ({
        ...prev,
        teams: prev.teams.map((team, i) => 
          i === teamIndex ? {
            ...team,
            drivers: team.drivers.filter((_, j) => j !== driverIndex),
            driverAssignments: [] // Reset driver assignments when drivers change
          } : team
        )
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-600 rounded-full">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Race Configuration</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label htmlFor="track-name" className="block text-sm font-medium text-gray-300 mb-3">
                <MapPin className="w-4 h-4 inline mr-2" />
                Track Name
              </label>
              <input
                id="track-name"
                type="text"
                value={raceConfig.track}
                onChange={(e) => setRaceConfig(prev => ({ ...prev, track: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter track name..."
              />
            </div>

            <div>
              <label htmlFor="race-length" className="block text-sm font-medium text-gray-300 mb-3">
                <Clock className="w-4 h-4 inline mr-2" />
                Race Length (hours)
              </label>
              <input
                id="race-length"
                type="number"
                value={raceConfig.raceLengthHours}
                onChange={(e) => setRaceConfig(prev => ({ ...prev, raceLengthHours: parseInt(e.target.value) || 24 }))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                min="1"
                max="24"
              />
            </div>

            <div>
              <label htmlFor="fuel-range" className="block text-sm font-medium text-gray-300 mb-3">
                <Fuel className="w-4 h-4 inline mr-2" />
                Fuel Range (minutes)
              </label>
              <input
                id="fuel-range"
                type="number"
                value={raceConfig.fuelRangeMinutes}
                onChange={(e) => setRaceConfig(prev => ({ ...prev, fuelRangeMinutes: parseInt(e.target.value) || 108 }))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                min="30"
                max="180"
              />
            </div>

            <div>
              <label htmlFor="min-pit-time" className="block text-sm font-medium text-gray-300 mb-3">
                <Clock className="w-4 h-4 inline mr-2" />
                Minimum Pit Time (seconds)
              </label>
              <input
                id="min-pit-time"
                type="number"
                value={raceConfig.minPitTimeSeconds}
                onChange={(e) => setRaceConfig(prev => ({ ...prev, minPitTimeSeconds: parseInt(e.target.value) || 170 }))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                min="60"
                max="600"
              />
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <label className="block text-sm font-medium text-gray-300">
                <Users className="w-4 h-4 inline mr-2" />
                Teams ({raceConfig.teams.length})
              </label>
              <button
                onClick={addTeam}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-blue-500/25"
              >
                Add Team
              </button>
            </div>

            <div className="space-y-6">
              {raceConfig.teams.map((team, teamIndex) => (
                <div key={teamIndex} className="border border-gray-600 rounded-xl p-6 bg-gray-750">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">Team {teamIndex + 1}</h3>
                    {raceConfig.teams.length > 1 && (
                      <button
                        onClick={() => deleteTeam(teamIndex)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-red-500/25"
                        title="Delete team"
                      >
                        Delete Team
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor={`team-number-${teamIndex}`} className="block text-sm font-medium text-gray-300 mb-2">Team Number</label>
                      <input
                        id={`team-number-${teamIndex}`}
                        type="text"
                        value={team.number}
                        onChange={(e) => updateTeam(teamIndex, 'number', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="#3"
                      />
                    </div>
                    <div>
                      <label htmlFor={`team-name-${teamIndex}`} className="block text-sm font-medium text-gray-300 mb-2">Team Name</label>
                      <input
                        id={`team-name-${teamIndex}`}
                        type="text"
                        value={team.name}
                        onChange={(e) => updateTeam(teamIndex, 'name', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Apex Twin Racing"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-300">Drivers</label>
                      <button
                        onClick={() => addDriver(teamIndex)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-green-500/25"
                      >
                        Add Driver
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {team.drivers.map((driver, driverIndex) => (
                        <div key={driverIndex} className="flex items-center gap-3">
                          <input
                            id={`driver-${teamIndex}-${driverIndex}`}
                            type="text"
                            value={driver}
                            onChange={(e) => updateDriver(teamIndex, driverIndex, e.target.value)}
                            className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder={`Driver ${driverIndex + 1}`}
                            aria-label={`Driver ${driverIndex + 1} for Team ${teamIndex + 1}`}
                          />
                          {team.drivers.length > 1 && (
                            <button
                              onClick={() => deleteDriver(teamIndex, driverIndex)}
                              className="px-3 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-red-500/25"
                              title="Delete driver"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={onStartRace}
              disabled={!raceConfig.track || raceConfig.teams.some(team => !team.number || !team.name)}
              className="px-10 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-3 text-lg font-semibold shadow-xl hover:shadow-green-500/25 disabled:shadow-none"
            >
              <Play className="w-6 h-6" />
              Start Race
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaceConfiguration;
