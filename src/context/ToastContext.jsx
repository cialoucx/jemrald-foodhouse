import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ msg: '', err: false, show: false });

  const showToast = useCallback((msg, err = false) => {
    setToast({ msg, err, show: true });
  }, []);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={`toast ${toast.err ? 'err' : ''} ${toast.show ? 'show' : ''}`}>
        {toast.msg}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
