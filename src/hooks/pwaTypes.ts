// Shared types for PWA functionality

export interface RaceState {
  id: string;
  name: string;
  track: string;
  duration: number;
  fuelRangeMinutes: number;
  teams: any[];
  currentTime: number;
  isRunning: boolean;
  isPaused: boolean;
  fcyActive: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface SavedRace {
  id: string;
  name: string;
  track: string;
  createdAt: string;
  updatedAt: string;
  size: number;
}

export interface DataPersistenceHook {
  saveRaceState: (state: RaceState) => Promise<void>;
  loadRaceState: (id?: string) => Promise<RaceState | null>;
  deleteRaceState: (id: string) => Promise<void>;
  getSavedRaces: () => Promise<SavedRace[]>;
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;
  lastSaved: Date | null;
  isSaving: boolean;
  saveError: string | null;
  exportRaceData: (state: RaceState) => string;
  importRaceData: (data: string) => RaceState | null;
}

export interface PWAInstallHook {
  isInstallable: boolean;
  isInstalled: boolean;
  isSupported: boolean;
  promptInstall: () => Promise<void>;
  isInstalling: boolean;
  installError: string | null;
}

export interface OfflineHook {
  isOnline: boolean;
  isOffline: boolean;
  wasOffline: boolean;
}

export interface ServiceWorkerHook {
  isRegistered: boolean;
  isSupported: boolean;
  updateAvailable: boolean;
  installUpdate: () => Promise<void>;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
}

export interface AutoSaveOptions {
  interval?: number; // Auto-save interval in milliseconds
  enabled?: boolean; // Whether auto-save is enabled
  onSave?: (state: RaceState) => void; // Callback when auto-save occurs
  onError?: (error: Error) => void; // Callback when auto-save fails
}
