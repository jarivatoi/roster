import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CalendarDays } from 'lucide-react';

interface PeriodClearModalProps {
  isOpen: boolean;
  periodStart: string;
  periodEnd: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PeriodClearModal: React.FC<PeriodClearModalProps> = ({
  isOpen,
  periodStart,
  periodEnd,
  onConfirm,
  onCancel,
}) => {
  const [isClearing, setIsClearing] = useState(false);

  if (!isOpen) return null;

  const formatPeriodRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const startDay = startDate.getDate();
    const startMonth = monthNames[startDate.getMonth()];
    const endDay = endDate.getDate();
    const endMonth = monthNames[endDate.getMonth()];
    
    if (startYear === endYear) {
      return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`;
    } else {
      return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
    }
  };

  const handleConfirm = () => {
    setIsClearing(true);
    onConfirm();
    setIsClearing(false);
    onCancel();
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
            disabled={isClearing}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-200 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-green-600" />
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
            Clear Period Data
          </h3>
          
          <p className="text-sm text-gray-600 text-center">
            {formatPeriodRange(periodStart, periodEnd)}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-800 mb-2">Caution:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• This will clear all schedule data for this period</li>
                    <li>• All shift assignments will be removed</li>
                    <li>• Special dates and notes will be cleared</li>
                    <li>• This action cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-700">
              Are you sure you want to proceed?
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex-shrink-0">
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              disabled={isClearing}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isClearing}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isClearing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Clearing...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Clear All</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
