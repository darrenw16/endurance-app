import React from 'react';
import BaseModal from './BaseModal';
import type { RaceConfig } from '../../types';

interface PitStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pitReason: string;
  setPitReason: (reason: string) => void;
  fuelTaken: boolean;
  setFuelTaken: (taken: boolean) => void;
  driverChanged: boolean;
  setDriverChanged: (changed: boolean) => void;
  selectedDriverIndex: number;
  setSelectedDriverIndex: (index: number) => void;
  selectedTeam: number;
  raceConfig: RaceConfig;
}

const PitStopModal: React.FC<PitStopModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  pitReason,
  setPitReason,
  fuelTaken,
  setFuelTaken,
  driverChanged,
  setDriverChanged,
  selectedDriverIndex,
  setSelectedDriverIndex,
  selectedTeam,
  raceConfig,
}) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Confirm Pit Stop">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Reason for Pit Stop</label>
          <select
            value={pitReason}
            onChange={(e) => setPitReason(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="scheduled">Scheduled Stop</option>
            <option value="fcyOpportunity">FCY Opportunity</option>
            <option value="unscheduled">Unscheduled Stop</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Fuel Taken?</label>
          <div className="flex gap-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="fuel"
                checked={fuelTaken === true}
                onChange={() => setFuelTaken(true)}
                className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
              />
              <span className="text-white">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="fuel"
                checked={fuelTaken === false}
                onChange={() => setFuelTaken(false)}
                className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
              />
              <span className="text-white">No</span>
            </label>
          </div>
          {!fuelTaken && (
            <p className="text-sm text-orange-400 mt-2">
              Note: Stint timer will continue if no fuel is taken
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Driver Changed?</label>
          <div className="flex gap-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="driverChanged"
                checked={driverChanged === true}
                onChange={() => setDriverChanged(true)}
                className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
              />
              <span className="text-white">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="driverChanged"
                checked={driverChanged === false}
                onChange={() => setDriverChanged(false)}
                className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
              />
              <span className="text-white">No</span>
            </label>
          </div>
        </div>

        {driverChanged && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">New Driver</label>
            <select
              value={selectedDriverIndex}
              onChange={(e) => setSelectedDriverIndex(parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {raceConfig.teams[selectedTeam]?.drivers.map((driver, index) => (
                <option key={index} value={index}>
                  {driver || `Driver ${index + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <button
          onClick={onClose}
          className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-blue-500/25"
        >
          Confirm Pit Stop
        </button>
      </div>
    </BaseModal>
  );
};

export default PitStopModal;
