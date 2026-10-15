import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Plus, Edit } from 'lucide-react';
import { CustomShift } from '../types';

interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: CustomShift) => void;
  editingShift?: CustomShift | null;
  settings: any;
  hourlyRate?: number;
  overtimeRate?: number;
}

export const AddShiftModal: React.FC<AddShiftModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingShift,
  settings,
  hourlyRate = 0,
  overtimeRate = 0
}) => {
  const [formData, setFormData] = useState({
    label: '',
    fromTime: '',
    toTime: '',
    normalHours: 0,
    overtimeHours: 0,
    normalAllowanceHours: 0,
    overtimeAllowanceHours: 0,
    useManualAmount: false,
    manualAmount: 0,
    applicableDays: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
      specialDay: true
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [selectAllDays, setSelectAllDays] = useState(false);

  const calculateTimeDifference = (fromTime: string, toTime: string): number => {
    if (!fromTime || !toTime) return 0;
    
    const [fromHour, fromMin] = fromTime.split(':').map(Number);
    const [toHour, toMin] = toTime.split(':').map(Number);
    
    const fromMinutes = fromHour * 60 + fromMin;
    let toMinutes = toHour * 60 + toMin;
    
    if (toMinutes <= fromMinutes) {
      toMinutes += 24 * 60;
    }
    
    return (toMinutes - fromMinutes) / 60;
  };

  const formatHoursDisplay = (totalHours: number): string => {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    
    if (hours === 0 && minutes === 0) return '0 Mins';
    if (hours === 0) return `${minutes} Mins`;
    if (minutes === 0) return `${hours} Hrs`;
    return `${hours} Hrs ${minutes} Mins`;
  };

  const validateHours = (normalHours: number, overtimeHours: number, fromTime: string, toTime: string): string | null => {
    const totalHours = normalHours + overtimeHours;
    const timeDifference = calculateTimeDifference(fromTime, toTime);
    
    if (totalHours > timeDifference) {
      return `Total hours (${formatHoursDisplay(totalHours)}) cannot exceed time difference (${formatHoursDisplay(timeDifference)})`;
    }
    
    return null;
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (editingShift) {
        setFormData({
          label: editingShift.label,
          fromTime: editingShift.fromTime,
          toTime: editingShift.toTime,
          normalHours: editingShift.normalHours || 0,
          overtimeHours: editingShift.overtimeHours || 0,
          normalAllowanceHours: editingShift.normalAllowanceHours || 0,
          overtimeAllowanceHours: editingShift.overtimeAllowanceHours || 0,
          useManualAmount: editingShift.useManualAmount || false,
          manualAmount: editingShift.manualAmount || 0,
          applicableDays: editingShift.applicableDays || {
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false,
            specialDay: true
          }
        });
      } else {
        setFormData({
          label: '',
          fromTime: '',
          toTime: '',
          normalHours: 0,
          overtimeHours: 0,
          normalAllowanceHours: 0,
          overtimeAllowanceHours: 0,
          useManualAmount: false,
          manualAmount: 0,
          applicableDays: {
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false,
            specialDay: true
          }
        });
      }
    }
  }, [isOpen, editingShift]);

  useEffect(() => {
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const selectedDays = dayKeys.filter(day => formData.applicableDays[day as keyof typeof formData.applicableDays]);
    
    if (selectedDays.length === dayKeys.length) {
      setSelectAllDays(true);
    } else {
      setSelectAllDays(false);
    }
  }, [formData.applicableDays]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = '0';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.bottom = '0';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.bottom = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validateShiftTimes = (fromTime: string, toTime: string): string | null => {
    if (!fromTime || !toTime) return 'Both from and to times are required';
    
    const [fromHour, fromMin] = fromTime.split(':').map(Number);
    const [toHour, toMin] = toTime.split(':').map(Number);
    
    const fromMinutes = fromHour * 60 + fromMin;
    let toMinutes = toHour * 60 + toMin;
    
    if (toMinutes <= fromMinutes) {
      toMinutes += 24 * 60;
    }
    
    const hours = (toMinutes - fromMinutes) / 60;
    if (hours <= 0) return 'End time must be after start time';
    if (hours > 24) return 'Shift cannot exceed 24 hours';
    
    return null;
  };

  const checkForDuplicateTimes = (fromTime: string, toTime: string): string | null => {
    if (!settings?.customShifts) return null;
    
    const duplicateShift = settings.customShifts.find(shift => {
      if (editingShift && shift.id === editingShift.id) return false;
      return shift.fromTime === fromTime && shift.toTime === toTime;
    });
    
    if (duplicateShift) {
      return `A shift with times ${fromTime} to ${toTime} already exists: "${duplicateShift.label}"`;
    }
    
    return null;
  };

  const formatShiftDisplay = (fromTime: string, toTime: string): string => {
    return `${fromTime} to ${toTime}`;
  };

  const calculateAmount = (normalHours: number, overtimeHours: number) => {
    if (formData.useManualAmount) {
      return formData.manualAmount || 0;
    }
    return (normalHours * hourlyRate) + (overtimeHours * overtimeRate) + (formData.normalAllowanceHours * hourlyRate) + (formData.overtimeAllowanceHours * overtimeRate);
  };

  const formatCurrency = (amount: number) => {
    const currency = settings?.currency || 'Rs';
    return `${currency} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const handleSave = () => {
    const validation = validateShiftTimes(formData.fromTime, formData.toTime);
    if (validation) {
      setError(`Validation Error: ${validation}`);
      return;
    }

    const duplicateCheck = checkForDuplicateTimes(formData.fromTime, formData.toTime);
    if (duplicateCheck) {
      setError(`Duplicate Times Error: ${duplicateCheck}`);
      return;
    }

    if (!formData.label.trim()) {
      setError('Validation Error: Shift label is required');
      return;
    }

    const hasSelectedDay = Object.entries(formData.applicableDays)
      .filter(([key]) => key !== 'specialDay')
      .some(([, value]) => value === true);
    
    if (!hasSelectedDay) {
      setError('Validation Error: Please select at least one day for this shift');
      return;
    }
    
    if (formData.fromTime && formData.toTime) {
      const hoursValidation = validateHours(formData.normalHours + formData.overtimeHours, 0, formData.fromTime, formData.toTime);
      if (hoursValidation) {
        setError(`Hours Validation Error: ${hoursValidation}`);
        return;
      }
    }
    
    // Validate manual amount if enabled
    if (formData.useManualAmount && (!formData.manualAmount || formData.manualAmount <= 0)) {
      setError('Manual Amount Error: Manual amount must be greater than 0');
      return;
    }
    
    if (editingShift) {
      const updatedShift: CustomShift = {
        ...editingShift,
        label: formData.label.trim(),
        fromTime: formData.fromTime,
        toTime: formData.toTime,
        normalHours: formData.normalHours,
        overtimeHours: formData.overtimeHours,
        normalAllowanceHours: formData.normalAllowanceHours,
        overtimeAllowanceHours: formData.overtimeAllowanceHours,
        hours: formData.normalHours + formData.overtimeHours + formData.normalAllowanceHours + formData.overtimeAllowanceHours,
        useManualAmount: formData.useManualAmount,
        manualAmount: formData.manualAmount,
        applicableDays: formData.applicableDays
      };
      onSave(updatedShift);
    } else {
      const newShift: CustomShift = {
        id: `shift-${Date.now()}`,
        label: formData.label.trim(),
        fromTime: formData.fromTime,
        toTime: formData.toTime,
        normalHours: formData.normalHours,
        overtimeHours: formData.overtimeHours,
        normalAllowanceHours: formData.normalAllowanceHours,
        overtimeAllowanceHours: formData.overtimeAllowanceHours,
        hours: formData.normalHours + formData.overtimeHours + formData.normalAllowanceHours + formData.overtimeAllowanceHours,
        enabled: true,
        useManualAmount: formData.useManualAmount,
        manualAmount: formData.manualAmount,
        applicableDays: formData.applicableDays
      };
      onSave(newShift);
    }
    
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSelectAllDays = (checked: boolean) => {
    setSelectAllDays(checked);
    setFormData(prev => ({
      ...prev,
      applicableDays: {
        ...prev.applicableDays,
        monday: checked,
        tuesday: checked,
        wednesday: checked,
        thursday: checked,
        friday: checked,
        saturday: checked,
        sunday: checked,
        specialDay: prev.applicableDays.specialDay
      }
    }));
  };

  const handleDayChange = (dayKey: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      applicableDays: {
        ...prev.applicableDays,
        [dayKey]: checked
      }
    }));
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 my-8 select-none"
        style={{ 
          userSelect: 'none', 
          WebkitUserSelect: 'none',
          height: '100vh',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          margin: '0 auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6 pb-4 border-b border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-200 z-10"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              {editingShift ? <Edit className="w-6 h-6 text-indigo-600" /> : <Plus className="w-6 h-6 text-indigo-600" />}
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
            {editingShift ? 'Edit Shift' : 'Add New Shift'}
          </h3>
        </div>

        <div className="p-6 overflow-y-auto flex-1" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain', minHeight: 0 }}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start justify-between">
                <span className="text-sm text-red-700 flex-1">{error}</span>
                <button onClick={() => setError(null)} className="ml-2 p-1 rounded-full hover:bg-red-100 text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shift Label</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Morning Shift"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">From</label>
                <input
                  type="time"
                  value={formData.fromTime}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, fromTime: e.target.value }));
                    if (error && error.includes('Hours Validation')) setError(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">To</label>
                <input
                  type="time"
                  value={formData.toTime}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, toTime: e.target.value }));
                    if (error && error.includes('Hours Validation')) setError(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Normal Hours</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={formData.normalHours || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setFormData(prev => ({ ...prev, normalHours: value }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
                  placeholder="8.00"
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Overtime Hours</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={formData.overtimeHours || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setFormData(prev => ({ ...prev, overtimeHours: value }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Normal Allowance</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={formData.normalAllowanceHours || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setFormData(prev => ({ ...prev, normalAllowanceHours: value }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">OT Allowance</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={formData.overtimeAllowanceHours || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setFormData(prev => ({ ...prev, overtimeAllowanceHours: value }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-800">Use Manual Amount</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, useManualAmount: !prev.useManualAmount }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    formData.useManualAmount ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      formData.useManualAmount ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {formData.useManualAmount && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Manual Amount</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
                      <span className="text-gray-500 font-medium">{settings?.currency || 'Rs'}</span>
                    </div>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={formData.manualAmount || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setFormData(prev => ({ ...prev, manualAmount: value }));
                      }}
                      className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-3 text-center">Applicable Days</label>
              
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="flex items-center justify-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAllDays}
                    onChange={(e) => handleSelectAllDays(e.target.checked)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2 rounded"
                  />
                  <span className="text-sm font-semibold text-blue-800">Select All Days</span>
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'monday', label: 'Monday' },
                  { key: 'tuesday', label: 'Tuesday' },
                  { key: 'wednesday', label: 'Wednesday' },
                  { key: 'thursday', label: 'Thursday' },
                  { key: 'friday', label: 'Friday' },
                  { key: 'saturday', label: 'Saturday' },
                  { key: 'sunday', label: 'Sunday' }
                ].map(day => (
                  <label key={day.key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.applicableDays[day.key as keyof typeof formData.applicableDays]}
                      onChange={(e) => handleDayChange(day.key, e.target.checked)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 focus:ring-2 rounded"
                    />
                    <span className="text-sm text-gray-700">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {formData.fromTime && formData.toTime && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700 text-center">
                Time difference: {formatHoursDisplay(calculateTimeDifference(formData.fromTime, formData.toTime))}
              </div>
            )}
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="font-medium mb-2">Preview:</div>
              <div className="text-sm space-y-1">
                <div>{formData.fromTime && formData.toTime ? formatShiftDisplay(formData.fromTime, formData.toTime) : 'No time range set'}</div>
                {formData.useManualAmount ? (
                  <div className="font-semibold border-t pt-2">Manual Amount: {formatCurrency(calculateAmount(formData.normalHours || 0, formData.overtimeHours || 0))}</div>
                ) : calculateAmount(formData.normalHours || 0, formData.overtimeHours || 0) > 0 ? (
                  <>
                    {formData.normalHours > 0 && (
                      <div>Normal: {formData.normalHours}h × {formatCurrency(hourlyRate)}</div>
                    )}
                    {formData.overtimeHours > 0 && (
                      <div>Overtime: {formData.overtimeHours}h × {formatCurrency(overtimeRate)}</div>
                    )}
                    {formData.normalAllowanceHours > 0 && (
                      <div>Normal Allowance: {formData.normalAllowanceHours}h × {formatCurrency(hourlyRate)}</div>
                    )}
                    {formData.overtimeAllowanceHours > 0 && (
                      <div>OT Allowance: {formData.overtimeAllowanceHours}h × {formatCurrency(overtimeRate)}</div>
                    )}
                    <div className="font-semibold border-t pt-2">Total: {formatCurrency(calculateAmount(formData.normalHours || 0, formData.overtimeHours || 0))}</div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          
          <div className="h-8" />
        </div>
        
        <div className="p-6 pt-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.label.trim() || (formData.useManualAmount && (!formData.manualAmount || formData.manualAmount <= 0))}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingShift ? 'Update Shift' : 'Add Shift'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
