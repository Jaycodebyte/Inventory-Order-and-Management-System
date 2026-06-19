import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', type = 'danger' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Dialog Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full z-10 p-4 sm:p-6 transform transition-all animate-slide-in mx-4 sm:mx-0">
        <div className="flex gap-4">
          {/* Warn Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 
            ${type === 'danger' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}
          `}>
            <AlertTriangle className="w-5 h-5" />
          </div>

          {/* Texts */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Buttons Action Group */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 font-medium rounded-xl text-sm transition"
          >
            Cancel
          </button>
          
          <button
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-white font-medium rounded-xl text-sm transition
              ${type === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-500 hover:bg-amber-600'}
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
