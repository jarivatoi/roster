import React, { useRef, useState } from 'react';

export type ShiftMode = 'normal' | 'overtime' | 'publicHoliday';

interface SwipeableShiftButtonProps {
  children: React.ReactNode;
  isSelected: boolean;
  mode: ShiftMode;
  /** Whether this shift has overtime hours configured (enables swipe-left) */
  hasOvertime: boolean;
  /** Whether this shift has public holiday hours configured (enables swipe-right) */
  hasPublicHoliday: boolean;
  onClick: () => void;
  onSetMode: (mode: ShiftMode) => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const SwipeableShiftButton: React.FC<SwipeableShiftButtonProps> = ({
  children,
  isSelected,
  mode,
  hasOvertime,
  hasPublicHoliday,
  onClick,
  onSetMode,
  disabled,
  className,
  style
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isMouseDragging = useRef(false);
  const SWIPE_THRESHOLD = 60;
  const MAX_SWIPE = 100;

  // Can we swipe in each direction?
  const canSwipeLeft = isSelected;   // swipe left → overtime (always available when selected)
  const canSwipeRight = isSelected && hasPublicHoliday; // swipe right → public holiday (only if configured)

  const clampDrag = (diff: number) => {
    let min = -MAX_SWIPE;
    let max = MAX_SWIPE;
    if (!canSwipeLeft) min = 0;   // don't allow left drag
    if (!canSwipeRight) max = 0;  // don't allow right drag
    return Math.max(min, Math.min(max, diff));
  };

  // ---- Touch handlers (mobile) ----
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isSelected) return;
    const touch = e.touches[0];
    startX.current = touch.clientX;
    currentX.current = touch.clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isSelected) return;
    const touch = e.touches[0];
    currentX.current = touch.clientX;
    const diff = currentX.current - startX.current;
    setTranslateX(clampDrag(diff));
  };

  const handleTouchEnd = () => {
    if (!isDragging || !isSelected) return;
    setIsDragging(false);
    const diff = currentX.current - startX.current;

    if (diff < -SWIPE_THRESHOLD && canSwipeLeft) {
      // Swipe left: toggle between normal and overtime
      // If in PH mode, go to normal first (not directly to overtime)
      if (mode === 'publicHoliday') {
        onSetMode('normal');
      } else {
        onSetMode(mode === 'normal' ? 'overtime' : 'normal');
      }
    } else if (diff > SWIPE_THRESHOLD && canSwipeRight) {
      // Swipe right: toggle between normal and publicHoliday
      // If in overtime mode, go to normal first (not directly to PH)
      if (mode === 'overtime') {
        onSetMode('normal');
      } else {
        onSetMode(mode === 'publicHoliday' ? 'normal' : 'publicHoliday');
      }
    }
    setTranslateX(0);
  };

  // ---- Pointer handlers (laptop / trackpad / desktop) ----
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isSelected) return;
    if (e.pointerType === 'touch') return;
    e.preventDefault();
    (e.target as HTMLButtonElement).setPointerCapture(e.pointerId);
    isMouseDragging.current = true;
    startX.current = e.clientX;
    currentX.current = e.clientX;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isMouseDragging.current || !isSelected) return;
    if (e.pointerType === 'touch') return;
    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;
    setTranslateX(clampDrag(diff));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isMouseDragging.current || !isSelected) return;
    if (e.pointerType === 'touch') return;
    isMouseDragging.current = false;
    setIsDragging(false);

    const diff = currentX.current - startX.current;
    if (diff < -SWIPE_THRESHOLD && canSwipeLeft) {
      // Swipe left: toggle between normal and overtime
      // If in PH mode, go to normal first (not directly to overtime)
      if (mode === 'publicHoliday') {
        onSetMode('normal');
      } else {
        onSetMode(mode === 'normal' ? 'overtime' : 'normal');
      }
    } else if (diff > SWIPE_THRESHOLD && canSwipeRight) {
      // Swipe right: toggle between normal and publicHoliday
      // If in overtime mode, go to normal first (not directly to PH)
      if (mode === 'overtime') {
        onSetMode('normal');
      } else {
        onSetMode(mode === 'publicHoliday' ? 'normal' : 'publicHoliday');
      }
    }
    setTranslateX(0);
  };

  const handleClick = () => {
    if (Math.abs(translateX) < 10) {
      onClick();
    }
  };

  // Overlay labels show the mode the button will switch TO
  // LEFT overlay is revealed when swiping RIGHT (toggles normal <-> publicHoliday)
  // RIGHT overlay is revealed when swiping LEFT (toggles normal <-> overtime)
  const leftOverlayLabel = mode === 'publicHoliday' ? 'Normal' : 'Public Holiday';
  const rightOverlayLabel = mode === 'normal' ? 'Overtime' : 'Normal';
  
  // Overlay background colors match the TARGET mode
  const leftOverlayBg = mode === 'publicHoliday' ? '#1f2937' : '#10b981'; // BLACK for Normal, GREEN for PH
  const rightOverlayBg = mode === 'normal' ? '#ef4444' : '#1f2937'; // RED for Overtime, BLACK for Normal

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '0.5rem' }}>
      {/* LEFT overlay — revealed when button slides RIGHT (Public Holiday) */}
      {isSelected && hasPublicHoliday && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: `${MAX_SWIPE}px`,
            backgroundColor: leftOverlayBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '6px 14px',
              color: leftOverlayBg,
              fontWeight: 600,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              border: 'none',
              textAlign: 'center',
              whiteSpace: 'normal',
              lineHeight: '1.2',
              maxWidth: '80px'
            }}
          >
            {leftOverlayLabel}
          </div>
        </div>
      )}

      {/* RIGHT overlay — revealed when button slides LEFT (Overtime) */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: `${MAX_SWIPE}px`,
            backgroundColor: rightOverlayBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '6px 14px',
              color: rightOverlayBg,
              fontWeight: 600,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              border: 'none',
              textAlign: 'center',
              whiteSpace: 'nowrap'
            }}
          >
            {rightOverlayLabel}
          </div>
        </div>
      )}

      {/* Main button */}
      <button
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        disabled={disabled}
        className={className}
        style={{
          ...style,
          touchAction: 'pan-y',
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s',
          position: 'relative',
          zIndex: 2
        }}
      >
        {children}
      </button>
    </div>
  );
};
