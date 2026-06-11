import { useEffect, useRef } from 'react';
import { Toast } from '../../types';

interface Props {
  toasts: Toast[];
  onRemove: (id: string) => void;
  duration?: number;
}

const STYLES: Record<Toast['type'], string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
};

const ICONS: Record<Toast['type'], string> = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
};

export const ToastContainer = ({ toasts, onRemove, duration = 1500 }: Props) => {
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    []
  );

  useEffect(() => {
    for (const toast of toasts) {
      if (!timers.current.has(toast.id)) {
        const t = setTimeout(() => {
          onRemove(toast.id);
          timers.current.delete(toast.id);
        }, duration);
        timers.current.set(toast.id, t);
      }
    }
  }, [toasts, onRemove, duration]);

  if (!toasts.length) return null;

  return (
    <div className="fixed z-50 space-y-2 pointer-events-none bottom-4 left-4 right-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-lg shadow-lg p-3 text-white animate-slide-up ${STYLES[toast.type]}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold">{ICONS[toast.type]}</span>
              <span className="text-sm">{toast.message}</span>
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              className="ml-3 opacity-75 hover:opacity-100"
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
