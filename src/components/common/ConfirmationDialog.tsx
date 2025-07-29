import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'low' | 'medium' | 'high';
  requireConfirmation?: boolean; // Require typing "CONFIRM" for high severity
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  severity = 'medium',
  requireConfirmation = false
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const canConfirm = !requireConfirmation || confirmationText.toUpperCase() === 'CONFIRM';

  const severityConfig = {
    low: {
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      borderColor: 'border-blue-400/30',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    },
    medium: {
      color: 'text-orange-400',
      bgColor: 'bg-orange-900/20',
      borderColor: 'border-orange-400/30',
      buttonColor: 'bg-orange-600 hover:bg-orange-700'
    },
    high: {
      color: 'text-red-400',
      bgColor: 'bg-red-900/20',
      borderColor: 'border-red-400/30',
      buttonColor: 'bg-red-600 hover:bg-red-700'
    }
  };

  const config = severityConfig[severity];

  const handleConfirm = async () => {
    if (!canConfirm || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setIsProcessing(false);
      setConfirmationText('');
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    setConfirmationText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-gray-800 rounded-lg border ${config.borderColor} max-w-md w-full`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center">
            <AlertTriangle className={`h-5 w-5 ${config.color} mr-2`} />
            <h2 className="text-lg font-semibold text-gray-100">
              {title}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-300 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className={`${config.bgColor} rounded-lg p-3 mb-4`}>
            <p className="text-gray-300">
              {message}
            </p>
          </div>

          {requireConfirmation && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Type "CONFIRM" to proceed:
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                disabled={isProcessing}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Type CONFIRM"
                autoComplete="off"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-700">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || isProcessing}
            className={`flex-1 ${config.buttonColor} text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isProcessing ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for managing confirmation dialogs
export const useConfirmationDialog = () => {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
    severity?: 'low' | 'medium' | 'high';
    requireConfirmation?: boolean;
  } | null>(null);

  const showConfirmation = (config: {
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
    severity?: 'low' | 'medium' | 'high';
    requireConfirmation?: boolean;
  }) => {
    setDialogState({
      isOpen: true,
      ...config
    });
  };

  const hideConfirmation = () => {
    setDialogState(null);
  };

  const ConfirmationDialogComponent = dialogState ? (
    <ConfirmationDialog
      isOpen={dialogState.isOpen}
      title={dialogState.title}
      message={dialogState.message}
      onConfirm={dialogState.onConfirm}
      onClose={hideConfirmation}
      confirmText={dialogState.confirmText}
      cancelText={dialogState.cancelText}
      severity={dialogState.severity}
      requireConfirmation={dialogState.requireConfirmation}
    />
  ) : null;

  return {
    showConfirmation,
    hideConfirmation,
    ConfirmationDialog: ConfirmationDialogComponent
  };
};
