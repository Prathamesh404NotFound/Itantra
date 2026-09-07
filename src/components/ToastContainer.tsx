import React from 'react';
import { ToastNotification } from '../types';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="System notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2 sm:p-0"
    >
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';
        const isSuccess = toast.type === 'success';

        let bgClass = 'bg-[#FFFFFF] border-[#E8E0D5] text-[#26211E]';
        let icon = <Info className="w-4 h-4 text-[#B45309] shrink-0" />;

        if (isError) {
          bgClass = 'bg-[#FFF5F5] border-[#FED7D7] text-[#9B1C1C]';
          icon = <XCircle className="w-4 h-4 text-[#DC2626] shrink-0" />;
        } else if (isWarning) {
          bgClass = 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]';
          icon = <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />;
        } else if (isSuccess) {
          bgClass = 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]';
          icon = <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            id={`toast_${toast.id}`}
            role="alert"
            className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-2xl border shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 ${bgClass}`}
          >
            <div className="mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold leading-snug">{toast.title}</h4>
              <p className="text-[11px] opacity-90 mt-0.5 leading-normal">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="p-1 -mr-1 -mt-1 rounded-lg text-current opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
