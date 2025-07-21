import { useState } from 'react';
import type { DraggedDriver, RaceConfig } from '../types';

/**
 * Custom hook for managing drag and drop functionality for driver assignments
 */
export const useDragAndDrop = (raceConfig: RaceConfig, setRaceConfig: React.Dispatch<React.SetStateAction<RaceConfig>>) => {
  const [draggedDriver, setDraggedDriver] = useState<DraggedDriver | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDriverDragStart = (e: React.DragEvent, stintIndex: number, teamIndex: number) => {
    setDraggedDriver({ stintIndex, teamIndex });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDriverDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDriverDragEnter = (e: React.DragEvent, stintIndex: number) => {
    e.preventDefault();
    setDragOverIndex(stintIndex);
  };

  const handleDriverDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null);
    }
  };

  const handleDriverDrop = (e: React.DragEvent, targetStintIndex: number, selectedTeam: number, teamStates: any[]) => {
    e.preventDefault();
    
    if (!draggedDriver || draggedDriver.teamIndex !== selectedTeam) {
      setDraggedDriver(null);
      setDragOverIndex(null);
      return;
    }

    const sourceStintIndex = draggedDriver.stintIndex;
    
    if (sourceStintIndex === targetStintIndex) {
      setDraggedDriver(null);
      setDragOverIndex(null);
      return;
    }

    // Create a new driver assignment array for this team
    const teamDrivers = [...raceConfig.teams[selectedTeam].drivers];
    const totalStints = teamStates[selectedTeam].stints.length;
    
    // Create current driver assignments
    let currentAssignments = raceConfig.teams[selectedTeam].driverAssignments || [];
    if (currentAssignments.length === 0) {
      currentAssignments = Array.from({ length: totalStints }, (_, index) => 
        index % teamDrivers.length
      );
    }
    
    // Swap the driver assignments
    const temp = currentAssignments[sourceStintIndex];
    currentAssignments[sourceStintIndex] = currentAssignments[targetStintIndex];
    currentAssignments[targetStintIndex] = temp;
    
    // Update the team configuration
    setRaceConfig(prev => ({
      ...prev,
      teams: prev.teams.map((team, index) => 
        index === selectedTeam ? {
          ...team,
          driverAssignments: [...currentAssignments]
        } : team
      )
    }));

    setDraggedDriver(null);
    setDragOverIndex(null);
  };

  return {
    draggedDriver,
    dragOverIndex,
    handleDriverDragStart,
    handleDriverDragOver,
    handleDriverDragEnter,
    handleDriverDragLeave,
    handleDriverDrop,
  };
};
