import React, { useState } from 'react';
import { RaceProvider } from './contexts';
import { RaceApp } from './components';

const PitStrategyApp = () => {
  // Race Configuration State - this stays at the top level
  const [raceConfig, setRaceConfig] = useState({
    track: '',
    raceLengthHours: 24,
    fuelRangeMinutes: 108,
    minPitTimeSeconds: 170,
    numTeams: 1,
    teams: [{ number: '', name: '', drivers: [''], driverAssignments: [] }]
  });

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        <RaceProvider raceConfig={raceConfig} setRaceConfig={setRaceConfig}>
          <RaceApp />
        </RaceProvider>
      </div>
    </div>
  );
};

export default PitStrategyApp;
