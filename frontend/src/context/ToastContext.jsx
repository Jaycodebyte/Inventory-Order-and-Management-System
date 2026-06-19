import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const toastCounter = useRef(0);

  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-dismiss after 4 seconds
    const timerId = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
    
    return timerId;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      
      {/* Toast Overlay Container */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 sm:left-auto sm:right-5 sm:translate-x-0 z-50 flex flex-col gap-2 pointer-events-none w-[calc(100%-2rem)] sm:w-80">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 w-full p-4 rounded-xl shadow-lg border text-white transform transition-all duration-300 translate-y-0 opacity-100 animate-slide-in
              ${toast.type === 'success' ? 'bg-emerald-600 border-emerald-500' : ''}
              ${toast.type === 'error' ? 'bg-rose-600 border-rose-500' : ''}
              ${toast.type === 'warning' ? 'bg-amber-600 border-amber-500' : ''}
              ${toast.type === 'info' ? 'bg-blue-600 border-blue-500' : ''}
            `}
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
            {(toast.type === 'warning' || toast.type === 'info') && <Info className="w-5 h-5 shrink-0" />}
            
            <p className="text-sm font-medium flex-1 leading-snug">{toast.message}</p>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/80 hover:text-white transition shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return useMemo(() => ({
    success: (msg) => context.addToast(msg, 'success'),
    error: (msg) => context.addToast(msg, 'error'),
    warning: (msg) => context.addToast(msg, 'warning'),
  }), [context.addToast]);
};
