/**
 * Minimal toast notification emitter
 * The ToastProvider in src/components/ui/toast.tsx subscribes to these events
 */
type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface ToastEvent {
  type: ToastType;
  content: string;
  duration?: number;
  key?: string;
}

type Listener = (event: ToastEvent) => void;

const listeners = new Set<Listener>();

export function emitToast(event: ToastEvent) {
  listeners.forEach(l => l(event));
}

export function subscribeToToast(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const toErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    const text = error.message.trim();
    return text || fallback;
  }
  if (typeof error === 'string') {
    const text = error.trim();
    return text || fallback;
  }
  return fallback;
};

const MESSAGE_DURATION = 3;

export const notify = {
  success: (content: string, key?: string) => {
    emitToast({ type: 'success', content, duration: MESSAGE_DURATION, key });
  },
  
  error: (error: unknown, fallback: string, key?: string) => {
    emitToast({ 
      type: 'error', 
      content: toErrorMessage(error, fallback), 
      duration: MESSAGE_DURATION * 2,
      key 
    });
  },
  
  warning: (content: string, key?: string) => {
    emitToast({ type: 'warning', content, duration: MESSAGE_DURATION, key });
  },
  
  info: (content: string, key?: string) => {
    emitToast({ type: 'info', content, duration: MESSAGE_DURATION, key });
  },
  
  loading: (content: string, key: string) => {
    emitToast({ type: 'loading', content, duration: 0, key });
  },
  
  destroy: (key?: string) => {
    // For destroy without key, we'd need a more complex system
    // For now, individual toasts handle their own removal via duration
  },
};
