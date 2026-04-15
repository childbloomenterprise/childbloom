import { useEffect } from 'react';
import useUiStore from '../../stores/uiStore';

export default function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts);
  const removeToast = useUiStore((s) => s.removeToast);

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 z-50 space-y-2">
      {toasts.map((toast) =>
        toast.type === 'drBloom' ? (
          <DrBloomToast key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ) : (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        )
      )}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, []);

  const styles = {
    success: 'bg-forest-700 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-forest-600 text-white',
    warning: 'bg-amber-500 text-white',
  };

  const icons = {
    success: 'M5 13l4 4L19 7',
    error: 'M6 18L18 6M6 6l12 12',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  };

  return (
    <div className={`px-4 py-3 rounded-xl shadow-lifted flex items-center gap-3 min-w-[300px] animate-toast-in ${styles[toast.type] || styles.info}`}>
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[toast.type] || icons.info} />
      </svg>
      <span className="text-caption font-medium flex-1">{toast.message}</span>
      <button onClick={onDismiss} className="opacity-70 hover:opacity-100 transition-opacity" aria-label="Dismiss">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function DrBloomToast({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, toast.duration || 12000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-cream-50 border-l-[3px] border-forest-700 rounded-r-xl shadow-lifted px-4 py-3.5 min-w-[300px] max-w-sm animate-toast-in">
      <div className="flex items-start gap-2.5">
        <div className="w-6 h-6 bg-forest-700 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-micro font-bold text-forest-600 uppercase tracking-wider mb-1.5">Dr. Bloom</p>
          <p className="font-serif text-sm text-gray-700 leading-relaxed italic">{toast.message}</p>
          {toast.onLink && (
            <button
              type="button"
              onClick={() => { onDismiss(); toast.onLink(); }}
              className="text-xs text-forest-600 hover:text-forest-800 underline mt-2 inline-block"
            >
              {toast.linkLabel || 'Chat with Dr. Bloom →'}
            </button>
          )}
        </div>
        <button onClick={onDismiss} className="text-gray-300 hover:text-gray-500 text-lg leading-none flex-shrink-0 ml-1">×</button>
      </div>
    </div>
  );
}
