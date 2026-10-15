import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

interface ToastNotificationProps {
  isOpen: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  isOpen,
  message,
  type = 'success',
  duration = 3000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'error':
        return <X className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Check className="w-5 h-5 text-green-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-green-50 border-green-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-green-800';
    }
  };

  const toastContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-[99999] pointer-events-none"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}
    >
      <div 
        className={`${getBackgroundColor()} border-2 rounded-2xl shadow-2xl max-w-sm w-full mx-4 pointer-events-auto`}
        style={{
          transform: isAnimating ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(16px)',
          opacity: isAnimating ? 1 : 0,
          transition: 'all 0.3s ease-out'
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className={`text-center font-medium ${getTextColor()}`}>
              {message}
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={handleClose}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(toastContent, document.body);
};
