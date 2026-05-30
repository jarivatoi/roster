/**
 * FILE: src/components/SettingsPanel.tsx
 * 
 * OVERVIEW:
 * Settings management component that provides a comprehensive interface for configuring
 * work schedule parameters including salary, hourly rates, overtime settings, currency,
 * and custom shift management. This component serves as the central configuration hub
 * for all application settings.
 * 
 * MAIN FUNCTIONALITY:
 * - Basic salary and hourly rate configuration with automatic calculations
 * - Currency selection from predefined options
 * - Overtime multiplier and rate calculations
 * - Custom shift creation, editing, and deletion
 * - Formula-based hourly rate calculation
 * - Real-time preview of calculations and amounts
 * - Swipeable shift cards for mobile-friendly management
 * 
 * DEPENDENCIES:
 * - React hooks for state management and performance optimization
 * - Lucide React icons for consistent UI elements
 * - Custom components: AddShiftModal, ToastNotification, SwipeableShiftCard
 * - Types: Settings, CustomShift
 * - Constants: CURRENCY_OPTIONS for supported currencies
 * 
 * RELATIONSHIPS:
 * - Child of App component, receives settings via props
 * - Communicates changes back to parent through callback props
 * - Manages AddShiftModal for shift creation/editing
 * - Integrates with SwipeableShiftCard for shift display and interaction
 * 
 * DESIGN PATTERNS:
 * - Controlled components pattern for form inputs
 * - Callback pattern for parent-child communication
 * - Modal pattern for shift editing interface
 * - Toast notification pattern for user feedback
 * - Optimistic updates with useCallback for performance
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, Clock, DollarSign, Edit, Calculator } from 'lucide-react';
import { Settings, CustomShift } from '../types';
import { CURRENCY_OPTIONS } from '../constants';
import { AddShiftModal } from './AddShiftModal';
import { ToastNotification } from './ToastNotification';
import { SwipeableShiftCard } from './SwipeableShiftCard';
import ConfirmationModal from './ConfirmationModal';

interface SettingsPanelProps {
  settings: Settings;
  onUpdateBasicSalary: (salary: number) => void;
  onUpdateCurrency: (currency: string) => void;
  onAddCustomShift: (shift: CustomShift) => void;
  onUpdateCustomShift: (shiftId: string, shift: CustomShift) => void;
  onDeleteCustomShift: (shiftId: string) => void;
  onUpdateHourlyRate?: (rate: number) => void;
  onUpdateOvertimeMultiplier?: (multiplier: number) => void;
  // Deprecated props kept for compatibility
  onUpdateShiftHours?: (combinationId: string, hours: number) => void;
  onUpdateShiftEnabled?: (combinationId: string, enabled: boolean) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdateBasicSalary,
  onUpdateCurrency,
  onAddCustomShift,
  onUpdateCustomShift,
  onDeleteCustomShift,
  onUpdateHourlyRate,
  onUpdateOvertimeMultiplier
}) => {
  // ============================================================================
  // STATE MANAGEMENT SECTION
  // ============================================================================
  
  /**
   * MODAL AND UI STATE
   * Manages the visibility and state of various UI components
   */
  const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<CustomShift | null>(null);
  const [shiftToDelete, setShiftToDelete] = useState<CustomShift | null>(null);
  
  /**
   * FORMULA CALCULATION STATE
   * Manages the formula-based hourly rate calculation feature
   * Allows users to enter formulas like "x12/52/40" for automatic calculation
   */
  const [hourlyRateFormula, setHourlyRateFormula] = useState('');
  const [hourlyRateValue, setHourlyRateValue] = useState(settings.hourlyRate || 0);
  const [formulaError, setFormulaError] = useState('');
  
  /**
   * NOTIFICATION STATE
   * Manages toast notifications for user feedback
   */
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ============================================================================
  // EFFECT HOOKS SECTION
  // ============================================================================
  
  /**
   * HOURLY RATE SYNCHRONIZATION
   * Keeps local hourly rate value in sync with settings prop
   * This ensures the input field reflects the current saved value
   */
  useEffect(() => {
    setHourlyRateValue(settings.hourlyRate || 0);
  }, [settings.hourlyRate]);

  // Force update of hourly rate display
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Initialize hourly rate value on component mount
  useEffect(() => {
    if (settings.hourlyRate && hourlyRateValue === 0) {
      setHourlyRateValue(settings.hourlyRate);
    }
  }, [settings.hourlyRate, hourlyRateValue]);
  // ============================================================================
  // FORMULA CALCULATION SECTION
  // ============================================================================
  
  /**
   * FORMULA PARSER
   * Parses and evaluates mathematical formulas for hourly rate calculation
   * Supports basic arithmetic operations: +, -, *, /, x, ÷
   * 
   * @param formula - Mathematical formula string (e.g., "x12/52/40")
   * @param basicSalary - Base salary to apply formula to
   * @returns Calculated hourly rate or 0 if invalid
   * 
   * SECURITY NOTE: Uses Function constructor for evaluation - safe in this context
   * as input is controlled and sanitized, but be cautious in other applications
   */
  const parseHourlyRateFormula = useCallback((formula: string, basicSalary: number): number => {
    try {
      // Normalize formula syntax (convert x to *, ÷ to /)
      const expression = formula.toLowerCase().replace(/x/g, '*').replace(/÷/g, '/');
      
      // Safely evaluate the expression with basic salary
      const result = Function(`"use strict"; return (${basicSalary} ${expression})`)();
      
      // Return rounded result or 0 if invalid
      return isNaN(result) ? 0 : Math.round(result * 100) / 100;
    } catch {
      return 0;
    }
  }, []);

  /**
   * FORMULA VALIDATOR
   * Validates formula syntax before evaluation
   * Tests with a safe value (1000) to check for syntax errors
   * 
   * @param formula - Formula string to validate
   * @returns true if formula is valid, false otherwise
   */
  const validateFormula = useCallback((formula: string): boolean => {
    try {
      const expression = formula.toLowerCase().replace(/x/g, '*').replace(/÷/g, '/');
      const testResult = Function(`"use strict"; return (1000 ${expression})`)();
      return !isNaN(testResult) && isFinite(testResult);
    } catch {
      return false;
    }
  }, []);

  // ============================================================================
  // BASIC SALARY HANDLERS SECTION
  // ============================================================================
  
  /**
   * BASIC SALARY CHANGE HANDLER
   * Handles changes to the basic salary input field
   * Automatically recalculates hourly rate if formula is present
   * 
   * INPUT VALIDATION:
   * - Only allows digits (no decimals for salary)
   * - Converts to integer value
   * - Defaults to 0 for invalid input
   */
  const handleBasicSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get the raw input value and remove any non-digit characters
    const rawValue = e.target.value;
    const cleanValue = rawValue.replace(/[^\d]/g, '');
    const numericValue = parseInt(cleanValue) || 0;
    
    console.log('💰 Salary change:', { rawValue, cleanValue, numericValue });
    
    // Update salary through parent callback
    onUpdateBasicSalary(numericValue);
    
    // Recalculate hourly rate if formula exists
    if (hourlyRateFormula) {
      const newHourlyRate = parseHourlyRateFormula(hourlyRateFormula, numericValue);
      setHourlyRateValue(newHourlyRate);
      onUpdateHourlyRate?.(newHourlyRate);
    }
  };

  /**
   * BASIC SALARY FOCUS HANDLER
   * Shows raw numeric value when field gains focus
   * Removes formatting for easier editing
   */
  const handleBasicSalaryFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Show raw number without formatting for easier editing
    const rawValue = settings.basicSalary.toString();
    e.target.value = rawValue;
     
  };

  /**
   * BASIC SALARY BLUR HANDLER
   * Formats the salary with thousand separators when field loses focus
   * Provides better visual presentation of large numbers
   */
  const handleBasicSalaryBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Format with thousand separators
    const formattedValue = settings.basicSalary.toLocaleString('en-US');
    e.target.value = formattedValue;
    
  };

  // ============================================================================
  // HOURLY RATE FORMULA HANDLERS SECTION
  // ============================================================================
  
  /**
   * FORMULA INPUT CHANGE HANDLER
   * Manages the formula input field and clears any previous errors
   */
  const handleHourlyRateFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Only allow numbers, operators (+, -, *, /, x, ÷), decimal points, and spaces
    const sanitizedFormula = input.replace(/[^0-9+\-*/x÷.\s]/g, '');
    
    setHourlyRateFormula(sanitizedFormula);
    setFormulaError('');
    
    // Update the input value if it was sanitized
    if (input !== sanitizedFormula) {
      e.target.value = sanitizedFormula;
    }
    
    // Auto-calculate as user types
    const trimmedFormula = sanitizedFormula.trim();
    
    if (!trimmedFormula) {
      // No formula - use default calculation: Basic Salary x12/52/40
      const defaultHourlyRate = (settings.basicSalary * 12) / 52 / 40;
      console.log('🔄 Using default formula (x12/52/40):', defaultHourlyRate);
      if (onUpdateHourlyRate) {
        onUpdateHourlyRate(defaultHourlyRate);
      }
      setFormulaError('');
      setForceUpdate(prev => prev + 1);
      return;
    }
    
    // Check if it's a direct number input (no operators)
    if (!/[+\-*/x÷]/.test(trimmedFormula)) {
      const directNumber = parseFloat(trimmedFormula);
      if (!isNaN(directNumber) && directNumber > 0) {
        // Valid direct number - update immediately
        console.log('🔢 Auto-updating with direct number:', directNumber);
        if (onUpdateHourlyRate) {
          onUpdateHourlyRate(directNumber);
        }
        setFormulaError('');
        setForceUpdate(prev => prev + 1);
        return;
      }
    }
    
    // Check if it's a valid formula (has operators)
    if (/[+\-*/x÷]/.test(trimmedFormula)) {
      if (validateFormula(trimmedFormula)) {
        // Calculate and apply formula result immediately
        const newHourlyRate = parseHourlyRateFormula(trimmedFormula, settings.basicSalary);
        if (newHourlyRate > 0) {
          
          if (onUpdateHourlyRate) {
            onUpdateHourlyRate(newHourlyRate);
          }
          setFormulaError('');
          setForceUpdate(prev => prev + 1);
        } else {
          setFormulaError('Invalid formula result');
        }
      } else {
        setFormulaError('Invalid formula syntax');
      }
    }
  };

  /**
   * FORMULA KEYDOWN HANDLER
   * Processes formula when Enter key is pressed
   * Validates formula syntax and calculates new hourly rate
   */
  const handleHourlyRateFormulaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      processFormula();
    }
  };

  /**
   * FORMULA BLUR HANDLER
   * Processes formula when user clicks outside the formula input
   * Automatically calculates and applies the result
   */
  const handleHourlyRateFormulaBlur = () => {
    const trimmedFormula = hourlyRateFormula.trim();
    
    if (!trimmedFormula) {
      // No formula - use default calculation: Basic Salary x12/52/40
      const defaultHourlyRate = (settings.basicSalary * 12) / 52 / 40;
      console.log('🔄 No formula on blur, using default formula:', defaultHourlyRate);
      if (onUpdateHourlyRate) {
        onUpdateHourlyRate(defaultHourlyRate);
      }
      setFormulaError('');
      setForceUpdate(prev => prev + 1);
      return;
    }
    
    // Check if it's a direct number input (no operators)
    else if (!/[+\-*/x÷]/.test(trimmedFormula)) {
      const directNumber = parseFloat(trimmedFormula);
      if (!isNaN(directNumber) && directNumber > 0) {
        // Valid direct number
        console.log('🔢 Direct number detected:', directNumber);
        setHourlyRateValue(directNumber);
       if (onUpdateHourlyRate) {
         onUpdateHourlyRate(directNumber);
       }
        setFormulaError('');
       // Force update of the display
       setForceUpdate(prev => prev + 1);
        return;
      } else {
        // Invalid direct number - use default calculation
        const defaultHourlyRate = (settings.basicSalary * 12) / 52 / 40;
        console.log('🔄 Invalid direct number, using default formula:', defaultHourlyRate);
        if (onUpdateHourlyRate) {
          onUpdateHourlyRate(defaultHourlyRate);
        }
        setFormulaError('');
        setForceUpdate(prev => prev + 1);
        return;
      }
    }
    
    // Check if it's a valid formula (has operators)
    else if (/[+\-*/x÷]/.test(trimmedFormula)) {
      if (!validateFormula(trimmedFormula)) {
        // Invalid formula - use default calculation
        const defaultHourlyRate = (settings.basicSalary * 12) / 52 / 40;
        console.log('🔄 Invalid formula on blur, using default formula:', defaultHourlyRate);
        if (onUpdateHourlyRate) {
          onUpdateHourlyRate(defaultHourlyRate);
        }
        setFormulaError('Bad formula - using default calculation (Basic Salary × 12 ÷ 52 ÷ 40)');
        setForceUpdate(prev => prev + 1);
        return;
      }
      
      // Calculate and apply formula result
      const newHourlyRate = parseHourlyRateFormula(trimmedFormula, settings.basicSalary);
      if (newHourlyRate > 0) {
        console.log('📐 Formula calculated:', newHourlyRate);
        setHourlyRateValue(newHourlyRate);
       if (onUpdateHourlyRate) {
          onUpdateHourlyRate(newHourlyRate);
          setForceUpdate(prev => prev + 1);
       }
        setFormulaError('');
       // Force update of the display
       setForceUpdate(prev => prev + 1);
      } else {
        // Invalid formula result - use default calculation
        const defaultHourlyRate = (settings.basicSalary * 12) / 52 / 40;
        console.log('🔄 Invalid formula result on blur, using default formula:', defaultHourlyRate);
        if (onUpdateHourlyRate) {
          onUpdateHourlyRate(defaultHourlyRate);
        }
        setFormulaError('Bad formula result - using default calculation (Basic Salary × 12 ÷ 52 ÷ 40)');
        setForceUpdate(prev => prev + 1);
      }
    } else {
      // Not a number and not a formula - use default calculation
      const defaultHourlyRate = (settings.basicSalary * 12) / 52 / 40;
      console.log('🔄 Invalid input on blur, using default formula:', defaultHourlyRate);
      if (onUpdateHourlyRate) {
        onUpdateHourlyRate(defaultHourlyRate);
      }
      setFormulaError('Invalid input - using default calculation (Basic Salary × 12 ÷ 52 ÷ 40)');
      setForceUpdate(prev => prev + 1);
    }
  };

  /**
   * PROCESS FORMULA FUNCTION
   * Validates and processes the formula, updating the hourly rate
   */
  const processFormula = () => {
    if (!hourlyRateFormula.trim()) return;
    
    // Check if it's a direct number input
    const directNumber = parseFloat(hourlyRateFormula);
    if (!isNaN(directNumber) && hourlyRateFormula.trim() === directNumber.toString()) {
      // Direct number input
      setHourlyRateValue(directNumber);
      if (onUpdateHourlyRate) {
        onUpdateHourlyRate(directNumber);
      }
      setFormulaError('');
      return;
    }
    
    // Check if it's a formula
    if (!validateFormula(hourlyRateFormula)) {
      setFormulaError('Invalid formula syntax. Use operators: +, -, *, /, x, ÷');
      return;
    }
    
    // Calculate and apply new hourly rate
    const newHourlyRate = parseHourlyRateFormula(hourlyRateFormula, settings.basicSalary);
    if (newHourlyRate > 0) {
      setHourlyRateValue(newHourlyRate);
      if (onUpdateHourlyRate) {
        onUpdateHourlyRate(newHourlyRate);
      }
      setFormulaError('');
    } else {
      setFormulaError('Formula resulted in invalid value');
    }
  };

  // ============================================================================
  // HOURLY RATE DIRECT INPUT HANDLERS SECTION
  // ============================================================================
  
  // ============================================================================
  // OVERTIME SETTINGS HANDLERS SECTION
  // ============================================================================
  
  /**
   * OVERTIME MULTIPLIER CHANGE HANDLER
   * Updates the overtime pay multiplier (typically 1.5 for time-and-a-half)
   */
  const handleOvertimeMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 1;
    onUpdateOvertimeMultiplier?.(value);
  };

  // ============================================================================
  // CUSTOM SHIFT MANAGEMENT HANDLERS SECTION
  // ============================================================================
  
  /**
   * ADD SHIFT HANDLER
   * Processes new shift creation and shows success notification
   */
  const handleAddShift = (shift: CustomShift) => {
    onAddCustomShift(shift);
    setIsAddShiftModalOpen(false);
    setToast({ message: 'Custom shift added successfully!', type: 'success' });
  };

  /**
   * EDIT SHIFT HANDLER
   * Initiates shift editing by opening modal with existing shift data
   */
  const handleEditShift = (shift: CustomShift) => {
    setEditingShift(shift);
    setIsAddShiftModalOpen(true);
  };

  /**
   * UPDATE SHIFT HANDLER
   * Processes shift updates and shows success notification
   */
  const handleUpdateShift = (shift: CustomShift) => {
    if (editingShift) {
      onUpdateCustomShift(editingShift.id, shift);
      setEditingShift(null);
      setIsAddShiftModalOpen(false);
      setToast({ message: 'Custom shift updated successfully!', type: 'success' });
    }
  };

  /**
   * DELETE SHIFT HANDLER
   * Processes shift deletion and shows success notification
   */
  const handleDeleteShift = (shiftId: string) => {
    const shift = settings.customShifts?.find(s => s.id === shiftId) || null;
    setShiftToDelete(shift);
  };

  const confirmDeleteShift = () => {
    if (shiftToDelete) {
      onDeleteCustomShift(shiftToDelete.id);
      setShiftToDelete(null);
      setToast({ message: 'Custom shift deleted successfully!', type: 'success' });
    }
  };

  // ============================================================================
  // UTILITY FUNCTIONS SECTION
  // ============================================================================
  
  /**
   * TIME FORMATTER
   * Returns time in 24-hour format (HH:MM)
   * 
   * @param time - Time string in HH:MM format (24-hour)
   * @returns Time string in 24-hour format (e.g., "14:30")
   */
  const formatTime = (time: string) => {
    // Return time as-is in 24-hour format
    return time;
  };

  /**
   * CURRENCY FORMATTER
   * Formats numeric amounts with currency symbol and proper decimal places
   * 
   * @param amount - Numeric amount to format
   * @returns Formatted currency string
   */
  const formatCurrency = (amount: number) => {
    const currency = settings?.currency || 'Rs';
    return `${currency} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // ============================================================================
  // RENDER SECTION
  // ============================================================================
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center justify-center space-x-3 mb-8">
        <SettingsIcon className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-900 text-center">Settings</h2>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* ====================================================================== */}
        {/* BASIC SALARY SECTION */}
        {/* ====================================================================== */}
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Basic Salary
          </label>
          <div className="relative">
            {/* Currency symbol positioned absolutely for better UX */}
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
              <span className="text-gray-500 font-medium">{settings.currency}</span>
            </div>
            <input
              type="text"
              defaultValue={settings.basicSalary.toLocaleString('en-US')}
              onChange={handleBasicSalaryChange}
              onFocus={handleBasicSalaryFocus}
              onBlur={handleBasicSalaryBlur}
              placeholder="0"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-lg"
            />
          </div>
        </div>

        {/* ====================================================================== */}
        {/* CURRENCY SELECTION SECTION */}
        {/* ====================================================================== */}
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Currency
          </label>
          <select
            value={settings.currency}
            onChange={(e) => onUpdateCurrency(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
          >
            {CURRENCY_OPTIONS.map((currency) => (
              <option key={currency.code} value={currency.symbol}>
                {currency.symbol} - {currency.name}
              </option>
            ))}
          </select>
        </div>

        {/* ====================================================================== */}
        {/* HOURLY RATE SECTION */}
        {/* ====================================================================== */}
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Hourly Rate
          </label>
          <div className="space-y-4">
            
            {/* Direct hourly rate input */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
                <span className="text-gray-500 font-medium">{settings.currency}</span>
              </div>
              <input
                type="text"
                value={`${(settings.hourlyRate || 0).toFixed(2)}`}
                key={`hourly-rate-${forceUpdate}-${settings.hourlyRate}`} // Force re-render when value changes
                readOnly
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-center cursor-not-allowed pointer-events-none"
                tabIndex={-1}
              />
            </div>
            
            {/* OR separator */}
            <div className="text-center">
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">OR</span>
            </div>
            
            {/* Formula-based calculation */}
            <div className="space-y-2">
              <input
                type="text"
                value={hourlyRateFormula}
                onChange={handleHourlyRateFormulaChange}
                onKeyDown={handleHourlyRateFormulaKeyDown}
                placeholder="e.g., x12/52/40 (multiply by 12, divide by 52, divide by 40)"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center ${
                  formulaError ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              
              {/* Formula error display */}
              {formulaError && (
                <p className="text-red-500 text-sm text-center">{formulaError}</p>
              )}
              
              {/* Formula preview */}
              {hourlyRateFormula && !formulaError && (
                <p className="text-gray-500 text-sm text-center">
                  {/[+\-*/x÷]/.test(hourlyRateFormula) 
                    ? `Formula: Basic Salary ${hourlyRateFormula.replace(/x/g, ' × ').replace(/\//g, ' ÷ ')}`
                    : 'Manual Input'
                  }
                </p>
              )}
              
              {/* Default formula info */}
              {!hourlyRateFormula && (
                <p className="text-blue-500 text-sm text-center">
                  Using default: Basic Salary × 12 ÷ 52 ÷ 40
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ====================================================================== */}
        {/* OVERTIME SETTINGS SECTION */}
        {/* ====================================================================== */}
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Overtime Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Overtime multiplier input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overtime Multiplier
              </label>
              <input
                type="number"
                value={parseFloat((settings.overtimeMultiplier || 1.5).toString())}
                onChange={handleOvertimeMultiplierChange}
                step="0.1"
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
              />
            </div>
            
            {/* Calculated overtime rate display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overtime Rate
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
                  <span className="text-gray-500 font-medium">{settings.currency}</span>
                </div>
                <input
                  type="number"
                  value={((settings.hourlyRate || 0) * (settings.overtimeMultiplier || 1.5)).toFixed(2)}
                  readOnly
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================================== */}
        {/* CUSTOM SHIFTS SECTION */}
        {/* ====================================================================== */}
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Custom Shifts</h3>
            
            {/* Add shift button */}
            <button
              onClick={() => setIsAddShiftModalOpen(true)}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 font-medium w-full"
            >
              <Plus className="w-4 h-4" />
              <span>Add Shift</span>
            </button>
          </div>
          
          {/* Shifts display area */}
          {!settings.customShifts || settings.customShifts.length === 0 ? (
            // Empty state display
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No custom shifts added yet</p>
              <p className="text-gray-400 text-sm">Click "Add Shift" to create your first custom shift</p>
            </div>
          ) : (
            // Shifts grid display
            <div className="grid grid-cols-1 gap-4">
              {settings.customShifts
                .sort((a, b) => {
                  // Sort by fromTime (start time)
                  const timeA = a.fromTime || '00:00';
                  const timeB = b.fromTime || '00:00';
                  return timeA.localeCompare(timeB);
                })
                .map((shift) => (
                <SwipeableShiftCard
                  key={shift.id}
                  shift={shift}
                  settings={settings}
                  onEdit={() => handleEditShift(shift)}
                  onDelete={() => handleDeleteShift(shift.id)}
                  formatTime={formatTime}
                  formatCurrency={formatCurrency}
                />
                ))}
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================== */}
      {/* MODAL COMPONENTS SECTION */}
      {/* ====================================================================== */}
      
      {/* Add/Edit Shift Modal */}
      {isAddShiftModalOpen && (
        <AddShiftModal
          isOpen={isAddShiftModalOpen}
          onClose={() => {
            setIsAddShiftModalOpen(false);
            setEditingShift(null);
          }}
          onSave={editingShift ? handleUpdateShift : handleAddShift}
          editingShift={editingShift}
          settings={settings}
          hourlyRate={settings.hourlyRate || 0}
          overtimeRate={(settings.hourlyRate || 0) * (settings.overtimeMultiplier || 1.5)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <ToastNotification
          isOpen={!!toast}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete Shift Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!shiftToDelete}
        title="Delete Shift"
        message={shiftToDelete ? `Are you sure you want to delete "${shiftToDelete.label}"? This action cannot be undone.` : ''}
        onConfirm={confirmDeleteShift}
        onCancel={() => setShiftToDelete(null)}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  );
};

/**
 * LEARNING POINTS:
 * 
 * 1. FORM HANDLING PATTERNS:
 *    - Controlled vs uncontrolled components
 *    - Input validation and sanitization
 *    - Focus/blur event handling for better UX
 *    - Real-time calculation and preview
 * 
 * 2. MATHEMATICAL FORMULA EVALUATION:
 *    - Safe evaluation using Function constructor
 *    - Input sanitization and validation
 *    - Error handling for invalid expressions
 *    - User-friendly formula syntax conversion
 * 
 * 3. PERFORMANCE OPTIMIZATION:
 *    - useCallback for expensive function recreations
 *    - Efficient state updates and re-renders
 *    - Optimistic UI updates
 * 
 * 4. USER EXPERIENCE PATTERNS:
 *    - Progressive disclosure (formula OR direct input)
 *    - Immediate feedback with toast notifications
 *    - Consistent formatting and validation
 *    - Mobile-friendly swipeable interactions
 * 
 * 5. COMPONENT COMPOSITION:
 *    - Modal pattern for complex forms
 *    - Reusable card components
 *    - Notification system integration
 *    - Clean separation of concerns
 * 
 * 6. INPUT VALIDATION TECHNIQUES:
 *    - Regex patterns for decimal number validation
 *    - Real-time validation feedback
 *    - Preventing invalid input states
 *    - Graceful error handling
 * 
 * AREAS FOR FURTHER STUDY:
 * - Advanced form libraries (React Hook Form, Formik)
 * - Mathematical expression parsing libraries
 * - Advanced input validation patterns
 * - Accessibility improvements for form controls
 * - State management patterns for complex forms
 */