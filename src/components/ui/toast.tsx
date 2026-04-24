"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader } from "lucide-react";
import styles from "./toast.module.css";

type ToastType = "success" | "error" | "warning" | "info" | "loading";

interface Toast {
  id: string;
  type: ToastType;
  content: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (opts: { type: ToastType; content: string; duration?: number; key?: string }) => void;
  destroy: (key?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const typeIcons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={16} className="text-green-500" />,
    error: <AlertCircle size={16} className="text-red-500" />,
    warning: <AlertTriangle size={16} className="text-yellow-500" />,
    info: <Info size={16} className="text-blue-500" />,
    loading: <Loader size={16} className="animate-spin text-gray-500" />,
  };

  return (
    <div className={styles.toastItem} data-type={toast.type}>
      <div className={styles.toastIcon}>{typeIcons[toast.type]}</div>
      <div className={styles.toastContent}>{toast.content}</div>
      {toast.type !== "loading" && (
        <button className={styles.toastClose} onClick={onClose}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    setMounted(true);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback((opts: { type: ToastType; content: string; duration?: number; key?: string }) => {
    const id = opts.key || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = opts.duration ?? (opts.type === "error" ? 6000 : 3000);

    if (opts.key) {
      removeToast(id);
    }

    setToasts(prev => [...prev, { id, type: opts.type, content: opts.content, duration }]);

    if (duration > 0) {
      const timer = setTimeout(() => removeToast(id), duration);
      timersRef.current.set(id, timer);
    }
  }, [removeToast]);

  // Subscribe to notify events
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    import('../../shared/utils/notify').then(({ subscribeToToast }) => {
      cleanup = subscribeToToast((event) => {
        addToast(event);
      });
    });
    return () => cleanup?.();
  }, [addToast]);

  const ctx: ToastContextValue = {
    toast: addToast,
    destroy: (key) => {
      if (key) {
        removeToast(key);
      }
    },
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {mounted &&
        createPortal(
          <div className={styles.toastContainer}>
            {toasts.map(t => (
              <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
            ))}
          </div>,
          window.document.body
        )}
    </ToastContext.Provider>
  );
}
