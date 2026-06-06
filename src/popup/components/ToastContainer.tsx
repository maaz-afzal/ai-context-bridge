import React, { useEffect, useRef } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
  duration?: number;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove,
  duration = 2000,
}) => {
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    // Cleanup all timers on unmount
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    for (const toast of toasts) {
      if (!timersRef.current.has(toast.id)) {
        const timer = setTimeout(() => {
          onRemove(toast.id);
          timersRef.current.delete(toast.id);
        }, duration);
        timersRef.current.set(toast.id, timer);
      }
    }
  }, [toasts, onRemove, duration]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed z-50 space-y-2 pointer-events-none bottom-4 left-4 right-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-lg shadow-lg p-3 ${getToastStyles(toast.type)} text-white animate-slide-up`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold">{getIcon(toast.type)}</span>
              <span className="text-sm">{toast.message}</span>
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              className="ml-3 text-white transition-opacity opacity-75 hover:opacity-100"
            >
              ×
            </button>
          </div>
          <div className="mt-2 h-0.5 bg-white bg-opacity-30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full animate-shrink"
              style={{ animationDuration: `${duration}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const getToastStyles = (type: string): string => {
  switch (type) {
    case 'success':
      return 'bg-green-500';
    case 'error':
      return 'bg-red-500';
    case 'warning':
      return 'bg-yellow-500';
    default:
      return 'bg-blue-500';
  }
};

const getIcon = (type: string): string => {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✗';
    case 'warning':
      return '⚠';
    default:
      return 'ℹ';
  }
};
