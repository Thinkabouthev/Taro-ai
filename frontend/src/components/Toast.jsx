import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isInfo = toast.type === 'info';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-fadeIn transition-all">
      <div className={`p-4 rounded-xl border shadow-lg flex items-start gap-3 bg-white ${
        isError ? 'border-red-200 text-red-900' : isInfo ? 'border-blue-200 text-blue-900' : 'border-gray-200 text-gray-900'
      }`}>
        <div className="flex-shrink-0 mt-0.5">
          {isError ? (
            <AlertCircle className="w-5 h-5 text-red-600" />
          ) : isInfo ? (
            <Info className="w-5 h-5 text-blue-600" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          )}
        </div>
        <div className="flex-1">
          {toast.title && (
            <h4 className="text-sm font-semibold leading-tight">{toast.title}</h4>
          )}
          <p className="text-xs text-gray-600 mt-0.5">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-700 p-0.5 rounded cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
