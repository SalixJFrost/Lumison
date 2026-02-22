import React, { useState } from 'react';
import { UpdateService } from '../services/updateService';

interface UpdateNotificationProps {
  version: string;
  onClose: () => void;
  onUpdate: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  version,
  onClose,
  onUpdate,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpdate = async () => {
    setIsUpdating(true);
    const success = await UpdateService.downloadAndInstall((p) => {
      setProgress(Math.round(p));
    });
    
    if (!success) {
      setIsUpdating(false);
      // Update failed, show error
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4 w-80">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm mb-1">
              New Update Available
            </h3>
            <p className="text-white/60 text-xs mb-3">
              Version {version} is ready to install
            </p>

            {isUpdating && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>Downloading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={isUpdating ? undefined : handleUpdate}
                disabled={isUpdating}
                className="flex-1 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating...' : 'Update Now'}
              </button>
              <button
                onClick={onClose}
                disabled={isUpdating}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Later
              </button>
            </div>
          </div>

          {/* Close button */}
          {!isUpdating && (
            <button
              onClick={onClose}
              className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/60 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
