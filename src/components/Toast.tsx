import React from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-[#16161A] border border-[#FF5500]/40 text-white shadow-xl shadow-black/60 glow-ember transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="flex items-center gap-2.5 text-sm font-medium">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#FFB800] shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-[#FF5500] shrink-0" />
            )}
            <span className="leading-snug text-zinc-200">{toast.message}</span>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-zinc-400 hover:text-white p-1 rounded transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
