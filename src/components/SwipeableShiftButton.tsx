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
    <div style={{ position: 'relative', overflow: 'hidden' }}>
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
