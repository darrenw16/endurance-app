import React, { useState, useEffect } from 'react';
import { Save, Download, Upload, Trash2, Settings, Database, AlertCircle } from 'lucide-react';
import { useDataPersistence, useAutoSave, type AutoSaveSettings } from '../../hooks';
import { useConfirmationDialog } from './ConfirmationDialog';
import type { RaceConfig, TeamState } from '../../types';

interface DataPersistenceSettingsProps {
  raceConfig: RaceConfig;
  raceState: {
    raceStarted: boolean;
    racePaused: boolean;
    raceStartTime: Date | null;
    pausedTime: number;
    fcyActive: boolean;
  };
  teamStates: TeamState[];
  onLoadRaceSession?: (data: {
    raceConfig: RaceConfig;
    raceState: any;
    teamStates: TeamState[];
  }) => void;
  onLoadRaceConfig?: (config: RaceConfig) => void;
}

export const DataPersistenceSettings: React.FC<DataPersistenceSettingsProps> = ({
  raceConfig,
  raceState,
  teamStates,
  onLoadRaceSession,
  onLoadRaceConfig
}) => {
  const {
    saveRaceConfig,
    loadRaceConfig,
    saveRaceSession,
    loadRaceSession,
    hasSavedRaceConfig,
    hasSavedRaceSession,
    clearStoredData,
    getStorageInfo,
    saveAutoSaveSettings,
    loadAutoSaveSettings,
    isStorageAvailable
  } = useDataPersistence();

  const { saveNow, updateAutoSaveSettings } = useAutoSave({
    raceConfig,
    raceState,
    teamStates
  });

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const [autoSaveSettings, setAutoSaveSettings] = useState<AutoSaveSettings>({
    enabled: true,
    intervalSeconds: 30
  });
  const [storageInfo, setStorageInfo] = useState(getStorageInfo());
  const [showSettings, setShowSettings] = useState(false);

  // Load auto-save settings on mount
  useEffect(() => {
    const settings = loadAutoSaveSettings();
    setAutoSaveSettings(settings);
  }, [loadAutoSaveSettings]);

  // Update storage info
  useEffect(() => {
    const updateStorageInfo = () => {
      setStorageInfo(getStorageInfo());
    };

    updateStorageInfo();
    const interval = setInterval(updateStorageInfo, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, [getStorageInfo]);

  const handleSaveConfig = () => {
    const success = saveRaceConfig(raceConfig);
    if (success) {
      alert('Race configuration saved successfully!');
    } else {
      alert('Failed to save race configuration.');
    }
  };

  const handleLoadConfig = () => {
    const config = loadRaceConfig();
    if (config && onLoadRaceConfig) {
      showConfirmation({
        title: 'Load Saved Configuration',
        message: 'This will replace your current race configuration. Any unsaved changes will be lost.',
        onConfirm: () => onLoadRaceConfig(config),
        severity: 'medium'
      });
    } else {
      alert('No saved configuration found.');
    }
  };

  const handleSaveSession = () => {
    const success = saveRaceSession(raceConfig, raceState, teamStates);
    if (success) {
      alert('Race session saved successfully!');
    } else {
      alert('Failed to save race session.');
    }
  };

  const handleLoadSession = () => {
    const session = loadRaceSession();
    if (session && onLoadRaceSession) {
      showConfirmation({
        title: 'Load Saved Race Session',
        message: 'This will restore your previous race session, including all race progress and timing data.',
        onConfirm: () => onLoadRaceSession(session),
        severity: 'medium'
      });
    } else {
      alert('No saved race session found.');
    }
  };

  const handleClearData = () => {
    showConfirmation({
      title: 'Clear All Saved Data',
      message: 'This will permanently delete all saved race configurations and sessions. This action cannot be undone.',
      onConfirm: () => {
        const success = clearStoredData();
        if (success) {
          alert('All saved data cleared successfully.');
        } else {
          alert('Failed to clear saved data.');
        }
      },
      severity: 'high',
      requireConfirmation: true,
      confirmText: 'Delete All'
    });
  };

  const handleAutoSaveToggle = (enabled: boolean) => {
    const newSettings = { ...autoSaveSettings, enabled };
    setAutoSaveSettings(newSettings);
    updateAutoSaveSettings(newSettings);
    saveAutoSaveSettings(newSettings);
  };

  const handleIntervalChange = (intervalSeconds: number) => {
    const newSettings = { ...autoSaveSettings, intervalSeconds };
    setAutoSaveSettings(newSettings);
    updateAutoSaveSettings(newSettings);
    saveAutoSaveSettings(newSettings);
  };

  const exportToFile = (data: any, filename: string) => {
    try {
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data.');
    }
  };

  const handleExportConfig = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    exportToFile(raceConfig, `race-config-${timestamp}.json`);
  };

  const handleExportSession = () => {
    const sessionData = {
      raceConfig,
      raceState: {
        ...raceState,
        raceStartTime: raceState.raceStartTime?.toISOString()
      },
      teamStates,
      exportedAt: new Date().toISOString()
    };
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    exportToFile(sessionData, `race-session-${timestamp}.json`);
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Check if it's a race config or session
        if (data.raceConfig && data.teamStates && onLoadRaceSession) {
          // It's a session file
          showConfirmation({
            title: 'Import Race Session',
            message: 'This will replace your current race session with the imported data.',
            onConfirm: () => {
              const raceState = {
                ...data.raceState,
                raceStartTime: data.raceState.raceStartTime ? new Date(data.raceState.raceStartTime) : null
              };
              onLoadRaceSession({
                raceConfig: data.raceConfig,
                raceState,
                teamStates: data.teamStates
              });
            },
            severity: 'medium'
          });
        } else if (data.track && data.teams && onLoadRaceConfig) {
          // It's a config file
          showConfirmation({
            title: 'Import Race Configuration',
            message: 'This will replace your current race configuration with the imported data.',
            onConfirm: () => onLoadRaceConfig(data),
            severity: 'medium'
          });
        } else {
          alert('Invalid file format. Please select a valid race configuration or session file.');
        }
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import file. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset input value
    event.target.value = '';
  };

  if (!isStorageAvailable) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-400/30 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
          <h3 className="font-medium text-gray-100">Storage Not Available</h3>
        </div>
        <p className="text-sm text-gray-300">
          Browser storage is not available. Data persistence features are disabled.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Database className="h-5 w-5 text-blue-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-100">Data Management</h3>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-gray-400 hover:text-gray-300"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={handleSaveConfig}
          className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Config
        </button>
        
        <button
          onClick={handleSaveSession}
          disabled={!raceState.raceStarted}
          className="flex items-center justify-center bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors text-sm"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Session
        </button>

        <button
          onClick={handleLoadConfig}
          disabled={!hasSavedRaceConfig()}
          className="flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors text-sm"
        >
          <Upload className="h-4 w-4 mr-2" />
          Load Config
        </button>

        <button
          onClick={handleLoadSession}
          disabled={!hasSavedRaceSession()}
          className="flex items-center justify-center bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors text-sm"
        >
          <Upload className="h-4 w-4 mr-2" />
          Load Session
        </button>
      </div>

      {/* Auto-save Status */}
      <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">Auto-save</span>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoSaveSettings.enabled}
              onChange={(e) => handleAutoSaveToggle(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-300">
              {autoSaveSettings.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>
        {autoSaveSettings.enabled && (
          <div className="text-xs text-gray-400">
            Saves every {autoSaveSettings.intervalSeconds} seconds
          </div>
        )}
      </div>

      {/* Expanded Settings */}
      {showSettings && (
        <div className="border-t border-gray-700 pt-4">
          {/* Auto-save Interval */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Auto-save Interval (seconds)
            </label>
            <select
              value={autoSaveSettings.intervalSeconds}
              onChange={(e) => handleIntervalChange(Number(e.target.value))}
              disabled={!autoSaveSettings.enabled}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 disabled:opacity-50"
            >
              <option value={10}>10 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={300}>5 minutes</option>
            </select>
          </div>

          {/* Import/Export */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Import/Export</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportConfig}
                className="flex items-center justify-center bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded text-sm transition-colors"
              >
                <Download className="h-4 w-4 mr-1" />
                Export Config
              </button>
              
              <button
                onClick={handleExportSession}
                disabled={!raceState.raceStarted}
                className="flex items-center justify-center bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm transition-colors"
              >
                <Download className="h-4 w-4 mr-1" />
                Export Session
              </button>
            </div>
            
            <div className="mt-2">
              <label className="flex items-center justify-center bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded text-sm transition-colors cursor-pointer">
                <Upload className="h-4 w-4 mr-1" />
                Import File
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Storage Info */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Storage Usage</h4>
            <div className="bg-gray-700 rounded-lg p-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Used: {Math.round(storageInfo.usage / 1024)} KB</span>
                <span>{storageInfo.usagePercent?.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(storageInfo.usagePercent || 0, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Manual Save */}
          <div className="mb-4">
            <button
              onClick={() => saveNow()}
              className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Now
            </button>
          </div>

          {/* Danger Zone */}
          <div className="border-t border-red-900/50 pt-4">
            <h4 className="text-sm font-medium text-red-400 mb-2">Danger Zone</h4>
            <button
              onClick={handleClearData}
              className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Saved Data
            </button>
          </div>
        </div>
      )}

      {ConfirmationDialog}
    </div>
  );
};
