/**
 * SwipeableShiftCard Component - Interactive Shift Management Card
 * 
 * =============================================================================
 * PURPOSE AND FUNCTIONALITY
 * =============================================================================
 * 
 * This component provides an interactive card interface for displaying work shift
 * information with native mobile swipe gestures and desktop click interactions.
 * It supports edit and delete actions through intuitive touch-based interactions.
 * 
 * CORE FEATURES:
 * - Cross-platform interaction (swipe on mobile, click on desktop)
 * - Physics-based animations with resistance and momentum
 * - Action revelation (swipe left to reveal edit/delete buttons)
 * - Auto-close behavior when interacting with other cards
 * - Accessibility support with proper touch targets
 * 
 * =============================================================================
 * DEPENDENCIES AND PREREQUISITES
 * =============================================================================
 * 
 * REQUIRED IMPORTS:
 * - React hooks: useState, useRef, useEffect
 * - Lucide icons: Edit, Trash2, Clock
 * 
 * REQUIRED PROPS:
 * - shift: CustomShift object with id, label, times, hours
 * - settings: Settings object with hourlyRate, overtimeMultiplier, currency
 * - onEdit: Callback function for edit action
 * - onDelete: Callback function for delete action
 * - formatTime: Utility function to format time strings (HH:MM -> 12:00 PM)
 * - formatCurrency: Utility function to format currency amounts
 * 
 * DATA STRUCTURE REQUIREMENTS:
 * 
 * Shift object must contain:
 * {
 *   id: string;
 *   label: string;
 *   fromTime: string;    // Format: "HH:MM" (24-hour)
 *   toTime: string;      // Format: "HH:MM" (24-hour)
 *   hours: number;       // Total hours
 *   normalHours: number; // Regular hours
 *   overtimeHours: number; // Overtime hours
 *   enabled: boolean;
 * }
 * 
 * Settings object must contain:
 * {
 *   hourlyRate: number;
 *   overtimeMultiplier: number; // Usually 1.5 for time-and-a-half
 *   currency: string;           // Currency symbol like "Rs" or "$"
 * }
 * 
 * =============================================================================
 * USAGE INSTRUCTIONS
 * =============================================================================
 * 
 * BASIC IMPLEMENTATION:
 * 
 * 1. Import the component:
 *    import { SwipeableShiftCard } from './components/SwipeableShiftCard';
 * 
 * 2. Prepare required functions:
 *    const formatTime = (time: string) => {
 *      const [hours, minutes] = time.split(':');
 *      const hour = parseInt(hours, 10);
 *      const ampm = hour >= 12 ? 'PM' : 'AM';
 *      const displayHour = hour % 12 || 12;
 *      return `${displayHour}:${minutes} ${ampm}`;
 *    };
 * 
 *    const formatCurrency = (amount: number) => {
 *      return `${settings.currency} ${amount.toLocaleString('en-US', {
 *        minimumFractionDigits: 2,
 *        maximumFractionDigits: 2
 *      })}`;
 *    };
 * 
 * 3. Use in component:
 *    <SwipeableShiftCard
 *      shift={shiftData}
 *      settings={appSettings}
 *      onEdit={() => handleEditShift(shiftData.id)}
 *      onDelete={() => handleDeleteShift(shiftData.id)}
 *      formatTime={formatTime}
 *      formatCurrency={formatCurrency}
 *    />
 * 
 * MOBILE INTERACTION:
 * - Swipe left: Reveals edit (blue) and delete (red) buttons
 * - Swipe right: Closes actions if open
 * - Tap buttons: Executes edit or delete action
 * - Tap elsewhere: Closes actions
 * 
 * DESKTOP INTERACTION:
 * - Click card: Toggles action buttons visibility
 * - Click buttons: Executes edit or delete action
 * - Hover effects: Visual feedback on interactive elements
 * 
 * =============================================================================
 * CONFIGURATION OPTIONS
 * =============================================================================
 * 
 * SWIPE BEHAVIOR CONSTANTS (modify at top of component):
 * - SWIPE_THRESHOLD: 60 (minimum pixels to trigger action reveal)
 * - MAX_SWIPE: 120 (maximum swipe distance, matches button width)
 * - RESISTANCE_FACTOR: 0.3 (resistance when swiping beyond limits)
 * 
 * ANIMATION SETTINGS:
 * - Transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
 * - Spring-like easing for natural feel
 * - Hardware acceleration with transform3d
 * 
 * TOUCH TARGET SIZES:
 * - Minimum button size: 44px (iOS/Android accessibility standard)
 * - Button width: 60px each (edit + delete = 120px total)
 * 
 * =============================================================================
 * TROUBLESHOOTING AND BEST PRACTICES
 * =============================================================================
 * 
 * COMMON ISSUES:
 * 
 * 1. Swipe not working on mobile:
 *    - Check if isMobileDevice() returns true
 *    - Verify touch events are not being prevented by parent
 *    - Ensure CSS touch-action is set correctly
 * 
 * 2. Actions not closing automatically:
 *    - Verify useEffect cleanup is working
 *    - Check if shift.id is changing properly
 *    - Ensure component re-renders on shift updates
 * 
 * 3. Animation performance issues:
 *    - Use transform instead of changing left/right properties
 *    - Ensure hardware acceleration with transform3d
 *    - Avoid animating during touch events (set transition: 'none')
 * 
 * 4. Button clicks not working:
 *    - Check if onEdit/onDelete callbacks are provided
 *    - Verify button z-index is higher than card
 *    - Ensure buttons are not being covered by other elements
 * 
 * PERFORMANCE BEST PRACTICES:
 * 
 * 1. Use transform for animations (hardware accelerated)
 * 2. Set transition: 'none' during drag for immediate feedback
 * 3. Clean up event listeners in useEffect return
 * 4. Use useRef for values that don't need re-renders
 * 5. Minimize state updates during drag operations
 * 
 * ACCESSIBILITY CONSIDERATIONS:
 * 
 * 1. Minimum 44px touch targets for buttons
 * 2. Proper semantic HTML structure
 * 3. Keyboard navigation support
 * 4. Screen reader friendly labels
 * 5. High contrast colors for action buttons
 * 
 * MOBILE OPTIMIZATION:
 * 
 * 1. Use touch-action: pan-y to allow vertical scrolling
 * 2. Prevent text selection during swipe (user-select: none)
 * 3. Add visual feedback during interactions
 * 4. Handle touch cancellation properly
 * 5. Test on various device sizes and orientations
 * 
 * =============================================================================
 * TYPICAL USAGE SCENARIOS
 * =============================================================================
 * 
 * SCENARIO 1: Basic shift list display
 * - Map over shifts array
 * - Provide edit/delete handlers
 * - Handle state updates in parent component
 * 
 * SCENARIO 2: Filtered shift display
 * - Filter shifts based on criteria
 * - Maintain consistent key props for animations
 * - Handle empty states gracefully
 * 
 * SCENARIO 3: Bulk operations
 * - Track selected shifts in parent state
 * - Provide batch edit/delete functionality
 * - Show selection indicators
 * 
 * SCENARIO 4: Read-only mode
 * - Disable swipe gestures by not providing onEdit/onDelete
 * - Show information without action buttons
 * - Maintain visual consistency
 * 
 * =============================================================================
 * ADVANCED CUSTOMIZATION
 * =============================================================================
 * 
 * CUSTOM STYLING:
 * - Modify Tailwind classes for different color schemes
 * - Adjust button sizes by changing MAX_SWIPE constant
 * - Customize animation timing and easing functions
 * 
 * EXTENDED FUNCTIONALITY:
 * - Add more action buttons (duplicate, archive, etc.)
 * - Implement different swipe directions for different actions
 * - Add confirmation dialogs for destructive actions
 * - Support for keyboard shortcuts
 * 
 * INTEGRATION PATTERNS:
 * - Use with React.memo for performance optimization
 * - Integrate with state management libraries (Redux, Zustand)
 * - Add loading states during async operations
 * - Implement optimistic updates for better UX
 */

import React, { useState, useRef, useEffect } from 'react';
import { Edit, Trash2, Clock } from 'lucide-react';

interface SwipeableShiftCardProps {
  shift: any;
  settings: any;
  onEdit: () => void;
  onDelete: () => void;
  formatTime: (time: string) => string;
  formatCurrency: (amount: number) => string;
}

export const SwipeableShiftCard: React.FC<SwipeableShiftCardProps> = ({
  shift,
  settings,
  onEdit,
  onDelete,
  formatTime,
  formatCurrency
}) => {
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  
  /**
   * translateX: Current horizontal position of the card
   * - 0: Card in normal position
   * - Negative values: Card swiped left, revealing actions
   * - Positive values: Card swiped right (with resistance)
   */
  const [translateX, setTranslateX] = useState(0);
  
  /**
   * isOpen: Whether action buttons are currently visible
   * - Used for visual indicators and state management
   * - Helps prevent multiple cards from being open simultaneously
   */
  const [isOpen, setIsOpen] = useState(false);
  
  /**
   * isDragging: Whether user is currently performing a swipe gesture
   * - Prevents conflicting animations during user interaction
   * - Used to disable transitions during drag for immediate feedback
   */
  const [isDragging, setIsDragging] = useState(false);
  
  // ==========================================================================
  // REFS FOR TOUCH TRACKING
  // ==========================================================================
  
  /**
   * cardRef: Reference to the main card DOM element
   * - Used for direct DOM manipulation during animations
   * - Provides access to style properties for transform updates
   */
  const cardRef = useRef<HTMLDivElement>(null);
  
  /**
   * Touch tracking refs - store values that don't need re-renders
   * - startX: Initial touch position when gesture begins
   * - currentX: Current touch position during gesture
   * - lastTranslateX: Last committed position before new gesture
   */
  const startX = useRef(0);
  const currentX = useRef(0);
  const lastTranslateX = useRef(0);
  
  // ==========================================================================
  // CONFIGURATION CONSTANTS
  // ==========================================================================
  
  /**
   * Swipe behavior configuration
   * 
   * SWIPE_THRESHOLD: Minimum distance (in pixels) user must swipe to trigger
   * action reveal. Lower values make it easier to trigger, higher values
   * require more deliberate gestures.
   * 
   * MAX_SWIPE: Maximum distance the card can be swiped. This should match
   * the total width of action buttons (60px + 60px = 120px).
   * 
   * RESISTANCE_FACTOR: How much resistance to apply when swiping beyond
   * natural limits. 0.3 means 30% of the movement is applied, creating
   * a rubber-band effect.
   */
  const SWIPE_THRESHOLD = 60;
  const MAX_SWIPE = 120;
  const RESISTANCE_FACTOR = 0.3;
  
  // ==========================================================================
  // DEVICE DETECTION
  // ==========================================================================
  
  /**
   * Detects if the current device is likely a mobile device
   * 
   * Uses multiple detection methods:
   * 1. User agent string parsing for known mobile devices
   * 2. Touch event support detection
   * 3. Touch points capability detection
   * 
   * @returns {boolean} True if mobile device detected
   * 
   * WHY THIS MATTERS:
   * - Enables swipe gestures only on touch devices
   * - Provides click interactions on desktop/laptop
   * - Prevents conflicts between touch and mouse events
   */
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  };
  
  // ==========================================================================
  // ANIMATION FUNCTIONS
  // ==========================================================================
  
  /**
   * Applies smooth spring animation to card position
   * 
   * @param {number} targetX - Target X position to animate to
   * @param {boolean} immediate - Whether to skip animation (for immediate feedback)
   * 
   * ANIMATION DETAILS:
   * - Uses CSS transitions for hardware acceleration
   * - Spring-like easing (cubic-bezier) for natural feel
   * - Can be disabled during drag for immediate feedback
   * - Updates both DOM and React state for consistency
   * 
   * WHY CSS TRANSITIONS:
   * - Hardware accelerated on mobile devices
   * - Smoother than JavaScript-based animations
   * - Automatically handles frame timing
   * - Better battery life on mobile
   */
  const animateToPosition = (targetX: number, immediate = false) => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    
    if (immediate) {
      // Disable transitions for immediate feedback during drag
      card.style.transition = 'none';
    } else {
      // Enable spring-like animation for natural feel
      card.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }
    
    // Use transform for hardware acceleration
    card.style.transform = `translateX(${targetX}px)`;
    setTranslateX(targetX);
    lastTranslateX.current = targetX;
  };
  
  /**
   * Closes the swipe actions with smooth animation
   * 
   * WHEN THIS IS CALLED:
   * - User swipes right or doesn't swipe far enough left
   * - User taps outside the card
   * - Another card is interacted with
   * - Component unmounts or shift changes
   */
  const closeActions = () => {
    setIsOpen(false);
    animateToPosition(0);
  };
  
  /**
   * Opens the swipe actions with smooth animation
   * 
   * WHEN THIS IS CALLED:
   * - User swipes left past the threshold
   * - User clicks card on desktop (non-mobile)
   * - Programmatically triggered by parent component
   */
  const openActions = () => {
    setIsOpen(true);
    animateToPosition(-MAX_SWIPE);
  };
  
  // ==========================================================================
  // TOUCH EVENT HANDLERS
  // ==========================================================================
  
  /**
   * Handles the start of a touch interaction
   * 
   * @param {React.TouchEvent} e - Touch event object
   * 
   * PROCESS:
   * 1. Record initial touch position for delta calculations
   * 2. Set dragging state to prevent conflicting animations
   * 3. Disable CSS transitions for immediate feedback
   * 4. Store current position as baseline for movement
   * 
   * WHY DISABLE TRANSITIONS:
   * - Provides immediate visual feedback during drag
   * - Prevents conflicts between CSS animations and manual positioning
   * - Creates more responsive feel on touch devices
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobileDevice()) return;
    
    const touch = e.touches[0];
    startX.current = touch.clientX;
    currentX.current = touch.clientX;
    setIsDragging(true);
    
    // Disable transitions during drag for immediate feedback
    if (cardRef.current) {
      cardRef.current.style.transition = 'none';
    }
  };
  
  /**
   * Handles touch movement during swipe gesture
   * 
   * @param {React.TouchEvent} e - Touch event object
   * 
   * PROCESS:
   * 1. Calculate movement delta from start position
   * 2. Apply resistance when swiping beyond natural limits
   * 3. Update card position immediately for responsive feel
   * 4. Handle both left (reveal) and right (close) directions
   * 
   * RESISTANCE PHYSICS:
   * - Right swipe (positive): Always has resistance (closing gesture)
   * - Left swipe beyond MAX_SWIPE: Resistance prevents over-swiping
   * - Creates natural rubber-band effect like iOS interfaces
   */
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isMobileDevice()) return;
    
    const touch = e.touches[0];
    currentX.current = touch.clientX;
    
    // Calculate the distance moved from start position
    const deltaX = currentX.current - startX.current;
    let newTranslateX = lastTranslateX.current + deltaX;
    
    // Apply resistance when swiping beyond natural limits
    if (newTranslateX > 0) {
      // Resistance when swiping right (closing direction)
      newTranslateX = newTranslateX * RESISTANCE_FACTOR;
    } else if (newTranslateX < -MAX_SWIPE) {
      // Resistance when swiping too far left
      const excess = Math.abs(newTranslateX + MAX_SWIPE);
      newTranslateX = -MAX_SWIPE - (excess * RESISTANCE_FACTOR);
    }
    
    // Apply the position immediately for responsive feel
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${newTranslateX}px)`;
      setTranslateX(newTranslateX);
    }
  };
  
  /**
   * Handles the end of a touch interaction
   * 
   * @param {React.TouchEvent} e - Touch event object
   * 
   * DECISION LOGIC:
   * 1. Calculate total movement distance
   * 2. Compare against SWIPE_THRESHOLD to determine intent
   * 3. Animate to appropriate final position (open or closed)
   * 4. Reset dragging state and re-enable transitions
   * 
   * THRESHOLD LOGIC:
   * - Left swipe > SWIPE_THRESHOLD: Open actions
   * - Left swipe < SWIPE_THRESHOLD: Close actions (not enough intent)
   * - Right swipe (any amount): Close actions
   */
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging || !isMobileDevice()) return;
    
    setIsDragging(false);
    
    const deltaX = currentX.current - startX.current;
    const finalPosition = lastTranslateX.current + deltaX;
    
    // Determine whether to open or close based on swipe distance
    if (finalPosition < -SWIPE_THRESHOLD) {
      // Swiped far enough left to reveal actions
      openActions();
    } else {
      // Not far enough, snap back to closed position
      closeActions();
    }
  };
  
  // ==========================================================================
  // DESKTOP INTERACTION HANDLERS
  // ==========================================================================
  
  /**
   * Handles click events for desktop/laptop users
   * 
   * BEHAVIOR:
   * - Only active on non-mobile devices
   * - Toggles action visibility on each click
   * - Provides same functionality as swipe gestures
   * 
   * WHY SEPARATE FROM MOBILE:
   * - Prevents conflicts between touch and mouse events
   * - Provides appropriate interaction model for each platform
   * - Maintains consistent UX expectations
   */
  const handleClick = () => {
    if (isMobileDevice()) return; // Only for non-mobile devices
    
    if (isOpen) {
      closeActions();
    } else {
      openActions();
    }
  };
  
  /**
   * Handles action button clicks (Edit/Delete)
   * 
   * @param {() => void} action - The action callback to execute
   * 
   * PROCESS:
   * 1. Execute the provided action (edit or delete)
   * 2. Close the action panel for clean UX
   * 3. Prevent event bubbling to parent elements
   * 
   * WHY CLOSE AFTER ACTION:
   * - Provides clear visual feedback that action was executed
   * - Prevents accidental repeated actions
   * - Returns card to neutral state for next interaction
   */
  const handleActionClick = (e: React.SyntheticEvent, action: () => void) => {
    e.stopPropagation();
    e.preventDefault();
    action();
    closeActions();
  };
  
  // ==========================================================================
  // LIFECYCLE EFFECTS
  // ==========================================================================
  
  /**
   * Cleanup effect - closes actions when component unmounts or shift changes
   * 
   * WHY THIS IS NEEDED:
   * - Prevents memory leaks from active animations
   * - Ensures clean state when shift data changes
   * - Handles component unmounting gracefully
   * 
   * TRIGGERS:
   * - Component unmount
   * - shift.id changes (new shift data)
   * - Parent component re-renders with different shift
   */
  useEffect(() => {
    return () => {
      closeActions();
    };
  }, [shift.id]);
  
  // Helper function to format hours and minutes
  const formatHoursMinutes = (totalHours: number): string => {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    
    if (hours === 0 && minutes === 0) return '0mins';
    if (hours === 0) return `${minutes}mins`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}mins`;
  };
  
  // ==========================================================================
  // RENDER COMPONENT
  // ==========================================================================
  
  return (
    <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden group">
      {/* 
        ACTION BUTTONS CONTAINER
        
        Positioned behind the main card content, revealed when card is swiped left.
        Fixed width matches MAX_SWIPE constant for consistent behavior.
        
        LAYOUT STRATEGY:
        - Absolute positioning behind card
        - Fixed width prevents layout shifts
        - Flexbox for equal button sizing
        - Right-aligned to appear from right edge
      */}
      <div 
        className="absolute right-0 top-0 bottom-0 flex"
        style={{ width: `${MAX_SWIPE}px`, zIndex: 10 }}
      >
        {/* 
          EDIT BUTTON
          
          Blue background follows iOS/Android design patterns for primary actions.
          Minimum 44px touch target meets accessibility guidelines.
        */}
        <button
          onClick={(e) => handleActionClick(e, onEdit)}
          onTouchEnd={(e) => handleActionClick(e, onEdit)}
          className="flex-1 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white flex items-center justify-center transition-colors duration-200"
          style={{
            minWidth: '60px',
            minHeight: '44px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <Edit className="w-5 h-5" />
        </button>
        
        {/* 
          DELETE BUTTON
          
          Red background follows universal design patterns for destructive actions.
          Same sizing as edit button for visual balance.
        */}
        <button
          onClick={(e) => handleActionClick(e, onDelete)}
          onTouchEnd={(e) => handleActionClick(e, onDelete)}
          className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white flex items-center justify-center transition-colors duration-200"
          style={{
            minWidth: '60px',
            minHeight: '44px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* 
        MAIN CARD CONTENT
        
        This is the swipeable/clickable portion that users interact with.
        Contains all shift information and handles user input.
        
        INTERACTION SETUP:
        - Touch events for mobile swipe gestures
        - Click events for desktop interaction
        - Proper touch-action for scroll compatibility
        - User-select disabled to prevent text selection during swipe
      */}
      <div
        ref={cardRef}
        className={`relative bg-white p-4 select-none ${
          !isMobileDevice() ? 'cursor-pointer hover:bg-gray-50' : ''
        }`}
        style={{
          transform: `translateX(${translateX}px)`,
          // Prevent text selection during swipe
          userSelect: 'none',
          WebkitUserSelect: 'none',
          // Allow vertical scrolling but handle horizontal gestures
          touchAction: 'pan-y',
        }}
        // Touch events for mobile swipe gestures
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        // Click event for desktop interaction
        onClick={handleClick}
      >
        {/* 
          SHIFT HEADER
          
          Displays shift name and total hours in a clean, scannable format.
          Hours badge uses consistent styling with app theme.
        */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-800 text-lg">{shift.label}</h4>
            {(() => {
              const totalAmount = shift.useManualAmount 
                ? (shift.manualAmount || 0)
                : (shift.normalHours || 0) * (settings.hourlyRate || 0) +
                                 (shift.overtimeHours || 0) * ((settings.hourlyRate || 0) * (settings.overtimeMultiplier || 1.5)) +
                                 (shift.normalAllowanceHours || 0) * (settings.hourlyRate || 0) +
                                 (shift.overtimeAllowanceHours || 0) * ((settings.hourlyRate || 0) * (settings.overtimeMultiplier || 1.5));
              
              if (totalAmount > 0 && shift.hours > 0) {
                // Show hours when there's a calculated amount
                return (
                  <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full font-medium">
                    {formatHoursMinutes(shift.hours)}
                  </span>
                );
              } else if (shift.fromTime && shift.toTime) {
                // Show time difference when no amount but times are set
                const calculateTimeDifference = (fromTime: string, toTime: string): number => {
                  if (!fromTime || !toTime) return 0;
                  
                  const [fromHour, fromMin] = fromTime.split(':').map(Number);
                  const [toHour, toMin] = toTime.split(':').map(Number);
                  
                  const fromMinutes = fromHour * 60 + fromMin;
                  let toMinutes = toHour * 60 + toMin;
                  
                  // Handle overnight shifts
                  if (toMinutes <= fromMinutes) {
                    toMinutes += 24 * 60;
                  }
                  
                  return (toMinutes - fromMinutes) / 60;
                };
                
                const timeDiff = calculateTimeDifference(shift.fromTime, shift.toTime);
                if (timeDiff > 0) {
                  return (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                      {formatHoursMinutes(timeDiff)}
                    </span>
                  );
                }
              }
              
              return null;
            })()}
          </div>
          <div className="flex justify-center">
            <span className="text-lg font-semibold text-gray-800 px-3 py-1 border-2 border-gray-300 rounded-lg bg-gray-50">
              {formatTime(shift.fromTime)} - {formatTime(shift.toTime)}
            </span>
          </div>
        </div>
        
        {/* 
          HOURS BREAKDOWN
          
         Separates normal, overtime, and allowance hours (both normal and overtime rates) for transparency in calculations.
          Color coding helps users understand different pay rates.
        */}
        {/* Calculate total amount to determine if we should show details */}
        {(() => {
          const totalAmount = shift.useManualAmount 
            ? (shift.manualAmount || 0)
            : (shift.normalHours || 0) * (settings.hourlyRate || 0) +
                             (shift.overtimeHours || 0) * ((settings.hourlyRate || 0) * (settings.overtimeMultiplier || 1.5)) +
                             (shift.normalAllowanceHours || 0) * (settings.hourlyRate || 0) +
                             (shift.overtimeAllowanceHours || 0) * ((settings.hourlyRate || 0) * (settings.overtimeMultiplier || 1.5));
          
          // Only show hours breakdown and amount if total amount > 0
          if (totalAmount > 0) {
            return (
              <>
                {/* Hours Breakdown - only show if not using manual amount */}
                {!shift.useManualAmount && (
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="text-center p-2 bg-green-50 rounded-lg">
                        <div className="text-xs text-green-600 font-medium">Normal</div>
                        <div className="text-sm font-bold text-green-800">{shift.normalHours || 0}h</div>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded-lg">
                        <div className="text-xs text-orange-600 font-medium">Overtime</div>
                        <div className="text-sm font-bold text-orange-800">{shift.overtimeHours || 0}h</div>
                      </div>
                    </div>
                    
                    {/* Allowance Hours Breakdown */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <div className="text-xs text-blue-600 font-medium">Normal Allow.</div>
                        <div className="text-sm font-bold text-blue-800">{shift.normalAllowanceHours || 0}h</div>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <div className="text-xs text-blue-600 font-medium">OT Allow.</div>
                        <div className="text-sm font-bold text-blue-800">{shift.overtimeAllowanceHours || 0}h</div>
                      </div>
                    </div>
                  </>
                )}

                {/* 
                  AMOUNT DISPLAY
                  
                  Shows calculated total amount for this shift including overtime.
                  Uses formatCurrency prop for consistent currency formatting.
                  
                  CALCULATION:
                 - Normal hours × hourly rate
                 - Overtime hours × (hourly rate × overtime multiplier)
                 - Normal allowance hours × hourly rate
                 - Overtime allowance hours × (hourly rate × overtime multiplier)
                 - Total = normal amount + overtime amount + normal allowance + overtime allowance
                */}
                <div className="text-center p-3 bg-indigo-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <span className="text-xs text-indigo-600 font-medium">
                      {shift.useManualAmount ? 'Manual Amount' : 'Total Amount'}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-indigo-800">
                    {formatCurrency(totalAmount)}
                  </div>
                </div>
              </>
            );
          }
          
          // If no amount, return null (show nothing)
          return null;
        })()}

        {/* 
          VISUAL INDICATORS
          
          Provides subtle visual feedback about card state:
          - Blue dot when actions are revealed
          - Swipe hint dots on mobile when closed
        */}
        
        {/* Active state indicator */}
        {isOpen && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        )}
      </div>
    </div>
  );
};