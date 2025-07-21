import React from 'react';
import BaseModal from './BaseModal';

interface StintTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  stintIndex: number | null;
  field: string | null;
  type: string | null;
  value: string;
  onChange: (value: string) => void;
}

const StintTimeModal: React.FC<StintTimeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  stintIndex,
  field,
  type,
  value,
  onChange,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSave();
    if (e.key === 'Escape') onClose();
  };

  const getTitle = () => {
    if (stintIndex === null || !field || !type) return 'Edit Stint Time';
    
    const stintNum = stintIndex + 1;
    const fieldName = field === 'start' ? 'Start' : 'Finish';
    const typeName = type === 'planned' ? 'Planned' : 'Actual';
    
    return `Edit Stint ${stintNum} ${typeName} ${fieldName} Time`;
  };

  const getHelpText = () => {
    if (type === 'actual' && field === 'start') {
      return 'Note: Editing actual start time will affect stint timing calculations';
    }
    return 'Enter time in 24-hour format (HH:MM:SS)';
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={getTitle()}>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Time (HH:MM:SS)</label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="HH:MM:SS"
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <p className="text-sm text-gray-400 mt-2">{getHelpText()}</p>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <button
          onClick={onClose}
          className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className={`px-6 py-3 rounded-xl transition-all duration-200 font-semibold text-white shadow-lg ${
            type === 'planned' 
              ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/25' 
              : 'bg-green-600 hover:bg-green-700 hover:shadow-green-500/25'
          }`}
        >
          Update Time
        </button>
      </div>
    </BaseModal>
  );
};

export default StintTimeModal;
