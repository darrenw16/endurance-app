import React from 'react';
import BaseModal from './BaseModal';

interface TimeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  helpText?: string;
  buttonText?: string;
  buttonColor?: 'blue' | 'green' | 'orange' | 'purple';
}

const TimeEditModal: React.FC<TimeEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  label,
  placeholder,
  value,
  onChange,
  helpText,
  buttonText = 'Update Time',
  buttonColor = 'blue',
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSave();
    if (e.key === 'Escape') onClose();
  };

  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/25',
    green: 'bg-green-600 hover:bg-green-700 hover:shadow-green-500/25',
    orange: 'bg-orange-600 hover:bg-orange-700 hover:shadow-orange-500/25',
    purple: 'bg-purple-600 hover:bg-purple-700 hover:shadow-purple-500/25',
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">{label}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {helpText && (
            <p className="text-sm text-gray-400 mt-2">{helpText}</p>
          )}
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
          className={`px-6 py-3 rounded-xl transition-all duration-200 font-semibold text-white shadow-lg ${colorClasses[buttonColor]}`}
        >
          {buttonText}
        </button>
      </div>
    </BaseModal>
  );
};

export default TimeEditModal;
