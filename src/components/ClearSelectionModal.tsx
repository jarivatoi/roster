import React from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, CalendarDays } from 'lucide-react';

interface ClearSelectionModalProps {
  isOpen: boolean;
  onClearMonth: () => void;
  onClearPeriod: () => void;
  onCancel: () => void;
  periodStart: string | null;
  periodEnd: string | null;
}

export const ClearSelectionModal: React.FC<ClearSelectionModalProps> = ({
  isOpen,
  onClearMonth,
  onClearPeriod,
  onCancel,
  periodStart,
  periodEnd,
}) => {
  if (!isOpen) return null;

  const formatPeriodDate = (dateString: string) => {
    const d = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${monthNames[d.getMonth()]}`;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y'
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
        style={{ 
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-gray-200 flex-shrink-0">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
            Clear Data
          </h3>
          
          <p className="text-sm text-gray-600 text-center">
            Choose what to clear
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {/* Current Month Option */}
            <button
              onClick={onClearMonth}
              className="w-full p-4 bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 hover:border-orange-300 rounded-xl transition-all duration-200 text-left group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-300 transition-colors">
                  <Calendar className="w-5 h-5 text-orange-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-900 mb-1">Current Month</h4>
                  <p className="text-xs text-orange-700">
                    Clear all data for the current month
                  </p>
                </div>
              </div>
            </button>

            {/* Period Option */}
            {periodStart && periodEnd && (
              <button
                onClick={onClearPeriod}
                className="w-full p-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-300 rounded-xl transition-all duration-200 text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0 group-hover:bg-green-300 transition-colors">
                    <CalendarDays className="w-5 h-5 text-green-700" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-900 mb-1">Period</h4>
                    <p className="text-xs text-green-700">
                      {formatPeriodDate(periodStart)} - {formatPeriodDate(periodEnd)}
                    </p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex-shrink-0">
          <button
            onClick={onCancel}
            className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
