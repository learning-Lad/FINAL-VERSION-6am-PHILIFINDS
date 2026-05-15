import { useState } from 'react';
import { AlertCircle, Trash2, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  tripName: string;
  tripDate: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  tripName,
  tripDate,
  onConfirm,
  onCancel,
  isLoading = false
}: DeleteConfirmationModalProps) {
  const [showWarning, setShowWarning] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onCancel}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />

      {/* Modal Container */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
        style={{ animation: 'slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Header with gradient background */}
          <div className="relative h-32 bg-gradient-to-br from-[#e8efe6] to-[#d4e8df] border-b-2 border-[#f0a3a3] overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/20 rounded-full"></div>
            <div className="absolute -bottom-4 -left-6 w-20 h-20 bg-white/30 rounded-full"></div>

            {/* Warning icon */}
            <div className="relative h-full flex items-center justify-center">
              <div
                className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#e63946] flex items-center justify-center shadow-lg"
                style={{ animation: 'pulse 2s ease-in-out infinite' }}
              >
                <Trash2 className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            <h2
              className="text-2xl font-bold text-[#1f3d2b] mb-2 text-center"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Delete Trip?
            </h2>

            <p className="text-gray-600 text-center mb-6 text-sm leading-relaxed">
              Are you sure you want to delete your trip to
              <span className="font-semibold text-[#2d5840] block mt-1">{tripName}</span>
              <span className="text-xs text-gray-500 mt-1">({tripDate})</span>
            </p>

            {/* Warning box */}
            <div
              className="bg-[#fef2f2] border-l-4 border-[#e63946] rounded-lg p-4 mb-6"
              style={{ animation: 'slideInLeft 0.5s ease-out 0.2s both' }}
            >
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-[#e63946] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-[#8b0000]">
                  <p className="font-semibold mb-1">This action cannot be undone</p>
                  <p className="text-xs opacity-90">Your itinerary and all activities will be permanently deleted.</p>
                </div>
              </div>
            </div>

            {/* Type confirmation checkbox - Optional for extra safety */}
            <div
              className="mb-6 p-3 bg-[#f6f5ef] rounded-lg border border-dashed border-gray-300"
              style={{ animation: 'slideInLeft 0.5s ease-out 0.3s both' }}
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWarning}
                  onChange={(e) => setShowWarning(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 accent-[#e63946]"
                />
                <span className="text-sm text-gray-700">
                  I understand and want to delete this trip
                </span>
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3" style={{ animation: 'slideInUp 0.5s ease-out 0.4s both' }}>
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-full border-2 border-gray-200 text-[#1f3d2b] font-semibold hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-300"
              >
                Keep Trip
              </button>

              <button
                onClick={onConfirm}
                disabled={!showWarning || isLoading}
                className={`flex-1 px-4 py-3 rounded-full font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  showWarning && !isLoading
                    ? 'bg-gradient-to-r from-[#ff6b6b] to-[#e63946] text-white hover:shadow-lg hover:from-[#ff5555] hover:to-[#d62828] active:scale-95'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Trip
                  </>
                )}
              </button>
            </div>

            {/* Footer message */}
            <p className="text-xs text-gray-500 text-center mt-4">
              This will be reflected across all your devices
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 10px 25px rgba(230, 57, 70, 0.2);
          }
          50% {
            box-shadow: 0 10px 40px rgba(230, 57, 70, 0.4);
          }
        }
      `}</style>
    </>
  );
}
