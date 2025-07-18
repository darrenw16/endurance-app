// types.ts - Type definitions for the app
export interface Driver {
  name: string;
}

export interface Team {
  number: string;
  name: string;
  drivers: string[];
  driverAssignments: number[];
}

export interface RaceConfig {
  track: string;
  raceLengthHours: number;
  fuelRangeMinutes: number;
  minPitTimeSeconds: number;
  numTeams: number;
  teams: Team[];
}

export interface Stint {
  stintNumber: number;
  plannedLength: number;
  calculatedLength: number | null;
  plannedStart: Date | null;
  predictedStart: Date | null;
  plannedFinish: Date | null;
  predictedFinish: Date | null;
  actualStart: Date | null;
  actualFinish: Date | null;
  pitTime: number;
  actualPitTime: number | null;
  fuelTaken: boolean | null;
  driver: string;
  elapsed: number;
  remaining: number;
  fcyBuffer: number;
  status: 'planned' | 'active' | 'completed';
  isUnscheduled: boolean;
  pitReason?: string;
  driverChanged?: boolean;
}

export interface TeamState {
  currentStint: number;
  stintStartTime: Date | null;
  currentDriver: number;
  stints: Stint[];
  lastPitTime: Date | null;
  position: number;
}

export interface DraggedDriver {
  stintIndex: number;
  teamIndex: number;
}

export interface EditingStint {
  index: number | null;
  field: string | null;
  type: string | null;
}
