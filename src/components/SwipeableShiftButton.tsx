import React, { useRef, useState } from 'react';

interface SwipeableShiftButtonProps {
  children: React.ReactNode;
  isSelected: boolean;
  isExcluded: boolean;
  onClick: () => void;
  onToggleExclude: () => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const SwipeableShiftButton: React.FC<SwipeableShiftButtonProps> = ({
  children,
  isSelected,
  isExcluded,
  onClick,
  onToggleExclude,
  disabled,
  className,
  style
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const SWIPE_THRESHOLD = 80; // pixels to trigger swipe
  const MAX_SWIPE = 100; // maximum swipe distance

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isSelected) return; // Only allow swipe on selected shifts
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
    
    // Only allow left swipe (negative direction)
    if (diff < 0) {
      setTranslateX(Math.max(-MAX_SWIPE, diff));
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || !isSelected) return;
    setIsDragging(false);
    
    const diff = currentX.current - startX.current;
    if (diff < -SWIPE_THRESHOLD) {
      // Swipe left - toggle exclude
      onToggleExclude();
      setTranslateX(0);
    } else {
      // Not enough swipe - reset
      setTranslateX(0);
    }
  };

  const handleClick = () => {
    // Only trigger click if not swiping
    if (Math.abs(translateX) < 10) {
      onClick();
    }
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '0.5rem' }}>
      {/* Swipe indicator overlay */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: `${MAX_SWIPE}px`,
            backgroundColor: isExcluded ? '#ef4444' : '#10b981',
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
              color: isExcluded ? '#ef4444' : '#10b981',
              fontWeight: 600,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              border: 'none'
            }}
          >
            {isExcluded ? 'Overtime' : 'Normal'}
          </div>
        </div>
      )}
      
      {/* Main button */}
      <button
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        disabled={disabled}
        className={className}
        style={{
          ...style,
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
