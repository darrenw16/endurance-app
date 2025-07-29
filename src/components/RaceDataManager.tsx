import React, { useState, useRef } from 'react';
import { Download, Upload, Trash2, Save, FileText, Calendar } from 'lucide-react';
import { useDataPersistence } from '../hooks/useDataPersistence';
import type { SavedRace, RaceState } from '../hooks/pwaTypes';

interface RaceDataManagerProps {
  currentRace: RaceState | null;
  onLoadRace: (race: RaceState) => void;
  onSaveRace: () => void;
  className?: string;
}

export const RaceDataManager: React.FC<RaceDataManagerProps> = ({
  currentRace,
  onLoadRace,
  onSaveRace,
  className = ''
}) => {
  const {
    getSavedRaces,
    deleteRaceState,
    exportRaceData,
    importRaceData,
    loadRaceState,
    saveRaceState
  } = useDataPersistence();

  const [savedRaces, setSavedRaces] = useState<SavedRace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSavedRaces, setShowSavedRaces] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSavedRaces = async () => {
    setIsLoading(true);
    try {
      const races = await getSavedRaces();
      setSavedRaces(races);
    } catch (error) {
      console.error('Failed to load saved races:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowSavedRaces = () => {
    if (!showSavedRaces) {
      loadSavedRaces();
    }
    setShowSavedRaces(!showSavedRaces);
  };

  const handleLoadRace = async (id: string) => {
    setIsLoading(true);
    try {
      const race = await loadRaceState(id);
      if (race) {
        onLoadRace(race);
        setShowSavedRaces(false);
      }
    } catch (error) {
      console.error('Failed to load race:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRace = async (id: string) => {
    try {
      await deleteRaceState(id);
      setSavedRaces(races => races.filter(race => race.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete race:', error);
    }
  };

  const handleExportRace = () => {
    if (!currentRace) return;

    try {
      const exportData = exportRaceData(currentRace);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `endurance-race-${currentRace.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export race:', error);
    }
  };

  const handleImportRace = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedRace = importRaceData(text);
      
      if (importedRace) {
        await saveRaceState(importedRace);
        onLoadRace(importedRace);
        loadSavedRaces(); // Refresh the list
      } else {
        alert('Invalid race data file');
      }
    } catch (error) {
      console.error('Failed to import race:', error);
      alert('Failed to import race data');
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onSaveRace}
          disabled={!currentRace}
          className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Race</span>
        </button>

        <button
          onClick={handleShowSavedRaces}
          className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>{showSavedRaces ? 'Hide' : 'Show'} Saved Races</span>
        </button>

        <button
          onClick={handleExportRace}
          disabled={!currentRace}
          className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>

        <button
          onClick={handleImportRace}
          className="flex items-center space-x-1 px-3 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Import</span>
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />

      {/* Saved Races List */}
      {showSavedRaces && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="font-semibold text-lg mb-3 flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Saved Races</span>
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : savedRaces.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No saved races found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedRaces.map((race) => (
                <div
                  key={race.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {race.name}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{race.track}</span>
                      </span>
                      <span>{formatDate(race.updatedAt)}</span>
                      <span>{formatFileSize(race.size)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleLoadRace(race.id)}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      Load
                    </button>
                    
                    {deleteConfirm === race.id ? (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleDeleteRace(race.id)}
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(race.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
