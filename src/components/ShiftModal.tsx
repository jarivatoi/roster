import React, { useState, useEffect, useCallback } from 'react';
import { X, Check } from 'lucide-react';
import { SHIFTS } from '../constants';
import { DaySchedule, SpecialDates, DateNotes, Settings, CustomShift } from '../types';
import { ScrollingText } from './ScrollingText';

interface ShiftModalProps {
  selectedDate: string | null;
  schedule: DaySchedule;
  specialDates: SpecialDates;
  dateNotes: DateNotes;
  settings?: Settings;
  onToggleShift: (shiftId: string) => void;
  onToggleSpecialDate: (dateKey: string, isSpecial: boolean) => void;
  onUpdateNote: (dateKey: string, note: string) => void;
  onClose: () => void;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  selectedDate,
  schedule,
  specialDates,
  dateNotes,
  settings,
  onToggleShift,
  onToggleSpecialDate,
  onUpdateNote,
  onClose
}) => {
  const [isSpecialDate, setIsSpecialDate] = useState(false);
  const [localSchedule, setLocalSchedule] = useState<Record<string, string[]>>({});
  const [noteText, setNoteText] = useState('');

  // Initialize special date state when modal opens
  useEffect(() => {
    if (selectedDate) {
      setIsSpecialDate(specialDates[selectedDate] === true);
      setLocalSchedule(schedule);
      setNoteText(dateNotes[selectedDate] || '');
    }
  }, [selectedDate, specialDates, schedule, dateNotes]);

  // Update local schedule when parent schedule changes
  useEffect(() => {
    setLocalSchedule(schedule);
  }, [schedule]);

  // Update note text when dateNotes changes
  useEffect(() => {
    if (selectedDate) {
      setNoteText(dateNotes[selectedDate] || '');
    }
  }, [dateNotes, selectedDate]);

  const handleNoteChange = (newNote: string) => {
    if (!selectedDate) return;
    
    setNoteText(newNote);
    onUpdateNote(selectedDate, newNote);
  };

  const calculateTotalAmount = () => {
    if (!selectedDate) return 0;
    
    const currentShifts = localSchedule[selectedDate] || [];
    let total = 0;
    
    currentShifts.forEach((shiftId: string) => {
      // Check custom shifts first
      if (settings?.customShifts) {
        const customShift = settings.customShifts.find(s => s.id === shiftId);
        if (customShift) {
          // Use manual amount if enabled, otherwise calculate
          if (customShift.useManualAmount) {
            total += customShift.manualAmount || 0;
          } else {
            total += customShift.hours * (settings.hourlyRate || 0);
          }
          return;
        }
      }
      
      // Then check hardcoded shifts
      const shift = SHIFTS.find(s => s.id === shiftId);
      if (shift) {
        const hours = (shift as any).hours || 0;
        total += hours * (settings?.hourlyRate || 0);
      }
    });
    
    return total;
  };
  
  const formatCurrency = (amount: number) => {
    const currency = settings?.currency || 'Rs';
    return `${currency} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const handleShiftToggle = (shiftId: string) => {
    if (!selectedDate) return;
    
    const currentShifts = localSchedule[selectedDate] || [];
    
    // Update local state immediately for instant visual feedback
    if (currentShifts.includes(shiftId)) {
      // Remove shift
      const updatedShifts = currentShifts.filter(id => id !== shiftId);
      setLocalSchedule(prev => ({
        ...prev,
        [selectedDate]: updatedShifts
      }));
    } else {
      // Add shift if allowed
      if (canSelectShift(shiftId, selectedDate)) {
        setLocalSchedule(prev => ({
          ...prev,
          [selectedDate]: [...currentShifts, shiftId]
        }));
      }
    }
    
    // Then call parent handler for persistence
    onToggleShift(shiftId);
  };

  // Function to scroll back to the edited date when modal closes
  const handleCloseWithFocus = useCallback(() => {
    if (selectedDate) {
      // Parse the date to get the day number
      const dateObj = new Date(selectedDate);
      const dayNumber = dateObj.getDate();
      
      // Close the modal first
      onClose();
      
      // Use setTimeout to ensure modal is closed before scrolling
      setTimeout(() => {
        // Find the date element using the data-day attribute
        const dateElement = document.querySelector(`[data-day="${dayNumber}"]`) as HTMLElement;
        
        if (dateElement) {
          // Scroll the element into view with smooth behavior
          dateElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',    // Center the element vertically
            inline: 'center'    // Center the element horizontally
          });
          
          // Optional: Add a brief highlight effect to show which date was edited
          dateElement.style.transition = 'all 0.3s ease';
          dateElement.style.transform = 'scale(1.05)';
          dateElement.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.5)';
          
          // Remove highlight after animation
          setTimeout(() => {
            dateElement.style.transform = '';
            dateElement.style.boxShadow = '';
          }, 600);
        } else {
          // Element not found
        }
      }, 100); // Small delay to ensure modal close animation completes
    } else {
      // Fallback to normal close if no selected date
      onClose();
    }
  }, [selectedDate, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedDate) {
      // Disable body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = '0';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.bottom = '0';
    }

    return () => {
      // Re-enable body scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.bottom = '';
    };
  }, [selectedDate]);

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseWithFocus();
    }
  };

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseWithFocus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleCloseWithFocus]);

  if (!selectedDate) return null;

  const checkTimeOverlap = (shift1: any, shift2: any): boolean => {
    const [start1Hour, start1Min] = shift1.fromTime.split(':').map(Number);
    const [end1Hour, end1Min] = shift1.toTime.split(':').map(Number);
    const [start2Hour, start2Min] = shift2.fromTime.split(':').map(Number);
    const [end2Hour, end2Min] = shift2.toTime.split(':').map(Number);
    
    let start1 = start1Hour * 60 + start1Min;
    let end1 = end1Hour * 60 + end1Min;
    let start2 = start2Hour * 60 + start2Min;
    let end2 = end2Hour * 60 + end2Min;
    
    // Handle overnight shifts
    if (end1 <= start1) end1 += 24 * 60;
    if (end2 <= start2) end2 += 24 * 60;
    
    // Check overlap
    return start1 < end2 && start2 < end1;
  };

  const canSelectShift = (shiftId: string, dateKey: string) => {
    const currentShifts = localSchedule[dateKey] || [];
    
    // Max 3 shifts allowed
    if (currentShifts.length >= 3 && !currentShifts.includes(shiftId)) {
      return false;
    }
    
    // 9-4 and 12-10 cannot overlap
    if (shiftId === '9-4' && currentShifts.includes('12-10')) return false;
    if (shiftId === '12-10' && currentShifts.includes('9-4')) return false;
    
    // 12-10 and 4-10 cannot overlap
    if (shiftId === '12-10' && currentShifts.includes('4-10')) return false;
    if (shiftId === '4-10' && currentShifts.includes('12-10')) return false;
    
    // Check for time overlaps with custom shifts
    if (settings?.customShifts) {
      const newShift = settings.customShifts.find(s => s.id === shiftId);
      if (newShift) {
        for (const existingShiftId of currentShifts) {
          // Skip if it's the same shift (already selected)
          if (existingShiftId === shiftId) continue;
          
          const existingShift = settings.customShifts.find(s => s.id === existingShiftId);
          if (existingShift) {
            // Check if times overlap
            const hasOverlap = checkTimeOverlap(newShift, existingShift);
            if (hasOverlap) return false;
          }
        }
      }
    }
    
    return true;
  };

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDay(); // 0 = Sunday, 6 = Saturday
  };

  const getAvailableShifts = () => {
    const shifts: Array<{
      id: string;
      label: string;
      time: string;
      hours: number;
      color: string;
    }> = [];
    const selectedDateObj = new Date(selectedDate);
    const dayOfWeek = selectedDateObj.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayName = dayNames[dayOfWeek];
    const isSpecial = specialDates[selectedDate] === true;
    
    // Add custom shifts from settings
    if (settings?.customShifts && settings.customShifts.length > 0) {
      settings.customShifts.forEach(shift => {
        if (shift.enabled) {
          // If special date is selected, show all shifts regardless of applicable days
          if (isSpecial) {
            shifts.push({
              id: shift.id,
              label: shift.label,
              time: `${shift.fromTime} to ${shift.toTime}`,
              hours: shift.hours,
              color: 'bg-blue-100 text-blue-800 border-blue-200'
            });
          } else {
            // Otherwise, check applicable days
            const applicableDays = shift.applicableDays || {
              monday: true, tuesday: true, wednesday: true, thursday: true,
              friday: true, saturday: true, sunday: true, specialDay: true
            };
            
            const isApplicableForDay = applicableDays[currentDayName as keyof typeof applicableDays];
            
            if (isApplicableForDay) {
              shifts.push({
                id: shift.id,
                label: shift.label,
                time: `${shift.fromTime} to ${shift.toTime}`,
                hours: shift.hours,
                color: 'bg-blue-100 text-blue-800 border-blue-200'
              });
            }
          }
        }
      });
    }
    
    return shifts;
  };

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = dayNames[date.getDay()];
    const day = date.getDate().toString().padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return {
      dayName,
      dateString: `${day}-${month}-${year}`
    };
  };

  const handleSpecialDateToggle = async () => {
    const newSpecialState = !isSpecialDate;
    setIsSpecialDate(newSpecialState);
    
    // Update parent state immediately
    onToggleSpecialDate(selectedDate, newSpecialState);
    
    const currentShifts = schedule[selectedDate] || [];
    
    if (newSpecialState) {
      // If we're ENABLING special date status, remove any 12-10 shifts (not allowed on special dates)
      if (currentShifts.includes('12-10')) {
        onToggleShift('12-10'); // This will remove the 12-10 shift
      }
    } else {
      // If we're DISABLING special date status, remove any 9-4 shifts that are no longer valid
      const dayOfWeek = getDayOfWeek(selectedDate);
      
      // If it's not Sunday and we're removing special date status, remove 9-4 shifts
      if (dayOfWeek !== 0 && currentShifts.includes('9-4')) {
        onToggleShift('9-4'); // This will remove the 9-4 shift
      }
    }
  };

  const { dayName, dateString } = formatDateDisplay(selectedDate);
  const dayOfWeek = getDayOfWeek(selectedDate);
  const isSunday = dayOfWeek === 0;
  
  // Get available shifts (custom or hardcoded)
  const availableShifts = getAvailableShifts();

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999, // Higher z-index to ensure it's above everything
        // CRITICAL: Enable touch scrolling on the backdrop
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y', // Allow vertical panning (scrolling)
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: window.innerWidth > window.innerHeight ? '4px' : '16px',
        paddingTop: window.innerWidth > window.innerHeight ? '2px' : '16px'
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full select-none" 
        style={{ 
          userSelect: 'none', 
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          marginTop: window.innerWidth > window.innerHeight ? '2px' : '2rem',
          marginBottom: window.innerWidth > window.innerHeight ? '2px' : '2rem',
          maxWidth: window.innerWidth > window.innerHeight ? '95vw' : '28rem',
          maxHeight: window.innerWidth > window.innerHeight ? '98vh' : 'none',
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden'
        }}
        onClick={(e) => {
          // Prevent modal from closing when clicking inside
          e.stopPropagation();
        }}
      >
        {/* Header with close button and auto-save indicator */}
        <div className="relative pb-4 border-b border-gray-200 flex-shrink-0" style={{
          padding: window.innerWidth > window.innerHeight ? '8px' : '24px'
        }}>
          <button
            onClick={handleCloseWithFocus}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-200 select-none z-10"
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Auto-save indicator */}
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium select-none">Changes saved automatically</span>
          </div>

          {/* Date info - centered */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-1 select-none">
              {dayName}
            </h3>
            <p className="text-lg text-gray-700 select-none">
              {dateString}
            </p>
          </div>
        </div>

        {/* Scrollable content with ENHANCED TOUCH SUPPORT */}
        <div 
          className="overflow-y-auto flex-1"
          style={{
            // CRITICAL: Enable smooth touch scrolling
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y', // Allow vertical panning (scrolling)
            overscrollBehavior: 'contain', // Prevent scroll chaining to parent
            maxHeight: window.innerWidth > window.innerHeight ? 'calc(98vh - 100px)' : '70vh',
            padding: window.innerWidth > window.innerHeight ? '8px' : '24px'
          }}
        >
          {/* Special Date Checkbox - only show if not Sunday */}
          {(
            <div className="flex items-center justify-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSpecialDate}
                  onChange={handleSpecialDateToggle}
                  className="w-4 h-4 text-yellow-600 focus:ring-yellow-500 focus:ring-2 rounded"
                />
                <span className="text-sm font-medium text-yellow-800 select-none">
                  Special Date
                </span>
              </label>
            </div>
          )}
          
          {/* Sunday info message - only show if NOT special */}
          {isSunday && !isSpecialDate && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <p className="text-xs text-blue-800 text-center select-none">
                <strong>Sunday:</strong> Available shifts for this day
              </p>
            </div>
          )}
          
          {/* Special date info message */}
          {isSpecialDate && (
            <div className="p-2 bg-yellow-100 border border-yellow-300 rounded-lg mb-4">
              <p className="text-xs text-yellow-800 text-center select-none">
                <strong>Special Date:</strong> {isSunday ? 'Sunday marked as special' : 'Available shifts for this special day'}
              </p>
            </div>
          )}

          {/* Shift Selection Info - Only show when using custom shifts */}
          {settings?.customShifts && settings.customShifts.length > 0 && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg mb-4">
              <p className="text-sm text-gray-700 text-center select-none">
                <strong>Shift Selection ({(localSchedule[selectedDate] || []).length}/3)</strong>
              </p>
              {(localSchedule[selectedDate] || []).length > 0 && (
                <p className="text-sm text-indigo-600 text-center mt-1 font-medium">
                  Total: {formatCurrency(calculateTotalAmount())}
                </p>
              )}
            </div>
          )}

          {/* Shift options */}
          <div className="space-y-3 mb-6">
            {availableShifts.map(shift => {
              const isSelected = (localSchedule[selectedDate] || []).includes(shift.id);
              const currentShifts = localSchedule[selectedDate] || [];
              const maxReached = currentShifts.length >= 3 && !isSelected;
              const canSelect = canSelectShift(shift.id, selectedDate);
              const isDisabled = !isSelected && (!canSelect || maxReached);
              const showMaxSelection = maxReached && !canSelect;
              const showOverlap = !canSelect && !maxReached;

              return (
                <button
                  key={shift.id}
                  onClick={() => handleShiftToggle(shift.id)}
                  disabled={isDisabled}
                  className={`w-full p-4 rounded-lg border-2 text-center transition-all duration-200 select-none ${
                    isSelected
                      ? `${shift.color} border-current shadow-md transform scale-[1.02]`
                      : isDisabled
                        ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                        : 'bg-white border-gray-300 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100'
                  }`}
                  style={{ 
                    userSelect: 'none', 
                    WebkitUserSelect: 'none',
                    touchAction: 'manipulation'
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div className="text-left flex-1">
                      <div className="font-semibold select-none">{shift.label}</div>
                      <div className="text-sm opacity-75 select-none">{shift.time}</div>
                      {showMaxSelection && (
                        <div className="text-xs mt-1 text-orange-600 font-semibold select-none">
                          Max Selection (3/3)
                        </div>
                      )}
                      {showOverlap && (
                        <div className="text-xs mt-1 text-red-500 select-none">
                          Cannot combine with current shifts
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-current rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {availableShifts.length === 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center mb-4">
              <p className="text-yellow-800 font-medium">No shifts available</p>
              <p className="text-yellow-700 text-sm mt-1">Please add shifts in the Settings section first.</p>
            </div>
          )}

          {/* Note Field */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 select-none">
              Note for this date
            </label>
            <textarea
              value={noteText}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="Add a note for this date..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
              style={{ 
                userSelect: 'text', 
                WebkitUserSelect: 'text',
                WebkitTouchCallout: 'none'
              }}
              rows={3}
            />
            {noteText && noteText.length > 30 && (
              <p className="text-xs text-gray-500 mt-1 select-none">
                Note will appear as scrolling text on calendar
              </p>
            )}
          </div>

          {/* Add extra padding at bottom to ensure all content is accessible */}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
};