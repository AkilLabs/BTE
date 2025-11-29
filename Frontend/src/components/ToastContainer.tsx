import { useToast } from '../context/ToastContext';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border animate-in fade-in slide-in-from-top-4 duration-300 ${
            toast.type === 'success'
              ? 'bg-green-500/20 border-green-500/50 text-green-200'
              : toast.type === 'error'
              ? 'bg-red-500/20 border-red-500/50 text-red-200'
              : toast.type === 'warning'
              ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200'
              : 'bg-blue-500/20 border-blue-500/50 text-blue-200'
          }`}
        >
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 flex-shrink-0" />}

          <span className="text-sm font-medium max-w-xs">{toast.message}</span>

          <button
            onClick={() => removeToast(toast.id)}
            className="ml-auto text-current hover:opacity-70 transition flex-shrink-0"
            aria-label="Close toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
