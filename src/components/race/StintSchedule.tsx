import React from 'react';
import { GripVertical } from 'lucide-react';
import { formatTime, formatDurationToHMS } from '../../utils/timeFormatting';
import { getDriverForStint } from '../../utils/stintPlanGenerator';
import type { RaceConfig, TeamState } from '../../types';

interface StintScheduleProps {
  currentTeam: TeamState;
  selectedTeam: number;
  raceConfig: RaceConfig;
  teamStates: TeamState[];
  dragOverIndex: number | null;
  onOpenStintTimeModal: (stintIndex: number, field: string, type: string) => void;
  onDriverDragStart: (e: React.DragEvent, stintIndex: number, teamIndex: number) => void;
  onDriverDragOver: (e: React.DragEvent) => void;
  onDriverDragEnter: (e: React.DragEvent, stintIndex: number) => void;
  onDriverDragLeave: (e: React.DragEvent) => void;
  onDriverDrop: (e: React.DragEvent, stintIndex: number, teamIndex: number, teamStates: TeamState[]) => void;
}

const StintSchedule: React.FC<StintScheduleProps> = ({
  currentTeam,
  selectedTeam,
  raceConfig,
  teamStates,
  dragOverIndex,
  onOpenStintTimeModal,
  onDriverDragStart,
  onDriverDragOver,
  onDriverDragEnter,
  onDriverDragLeave,
  onDriverDrop,
}) => {
  if (!currentTeam) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
      <div className="p-6 bg-gray-750 border-b border-gray-700">
        <h3 className="text-xl font-semibold text-white">Stint Schedule</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-750">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Stint #</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Planned Start</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actual Start</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Planned Finish</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actual Finish</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Planned Length</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actual Length</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Planned Pit</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Fuel Taken</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Driver Changed</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Driver</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {currentTeam.stints.map((stint, index) => (
              <tr 
                key={index}
                className={`${
                  stint.status === 'active' ? 'bg-blue-900/30' : 
                  stint.status === 'completed' ? 'bg-green-900/30' : 'bg-gray-800'
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  {stint.stintNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <span 
                    className="cursor-pointer hover:bg-blue-800/50 px-3 py-2 rounded-lg transition-colors"
                    onClick={() => onOpenStintTimeModal(index, 'start', 'planned')}
                    title="Click to edit planned start time"
                  >
                    {formatTime(stint.plannedStart)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <span 
                    className="cursor-pointer hover:bg-green-800/50 px-3 py-2 rounded-lg transition-colors"
                    onClick={() => onOpenStintTimeModal(index, 'start', 'actual')}
                    title="Click to edit actual start time"
                  >
                    {formatTime(stint.actualStart)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <span 
                    className="cursor-pointer hover:bg-blue-800/50 px-3 py-2 rounded-lg transition-colors"
                    onClick={() => onOpenStintTimeModal(index, 'finish', 'planned')}
                    title="Click to edit planned finish time"
                  >
                    {formatTime(stint.plannedFinish)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <span 
                    className="cursor-pointer hover:bg-green-800/50 px-3 py-2 rounded-lg transition-colors"
                    onClick={() => onOpenStintTimeModal(index, 'finish', 'actual')}
                    title="Click to edit actual finish time"
                  >
                    {formatTime(stint.actualFinish)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {formatDurationToHMS(stint.plannedLength)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {stint.calculatedLength ? formatDurationToHMS(stint.calculatedLength) : '00:00:00'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {stint.pitTime}s
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {stint.fuelTaken === null ? '--' : stint.fuelTaken ? 'Yes' : 'No'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {stint.driverChanged === null || stint.driverChanged === undefined ? '--' : stint.driverChanged ? 'Yes' : 'No'}
                </td>
                <td 
                  className={`px-6 py-4 whitespace-nowrap text-sm text-gray-300 ${
                    dragOverIndex === index ? 'bg-blue-800/50' : ''
                  }`}
                  draggable
                  onDragStart={(e) => onDriverDragStart(e, index, selectedTeam)}
                  onDragOver={onDriverDragOver}
                  onDragEnter={(e) => onDriverDragEnter(e, index)}
                  onDragLeave={onDriverDragLeave}
                  onDrop={(e) => onDriverDrop(e, index, selectedTeam, teamStates)}
                >
                  <div className="flex items-center gap-2 cursor-move">
                    <GripVertical className="w-4 h-4 text-gray-500" />
                    {getDriverForStint(index, selectedTeam, raceConfig.teams, teamStates)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    stint.status === 'active' ? 'bg-blue-900/50 text-blue-300 border border-blue-600' :
                    stint.status === 'completed' ? 
                      (stint.pitReason === 'unscheduled' ? 'bg-red-900/50 text-red-300 border border-red-600' : 
                       stint.pitReason === 'fcyOpportunity' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-600' :
                       'bg-green-900/50 text-green-300 border border-green-600') :
                    'bg-gray-700 text-gray-300 border border-gray-600'
                  }`}>
                    {stint.status === 'completed' && stint.pitReason ? stint.pitReason : stint.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StintSchedule;
