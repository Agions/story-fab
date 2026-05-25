/**
 * sonner-compatible toast API shim
 * Wraps the internal notify emitter from @/shared/utils/notify
 */
import { notify } from '@/shared/utils/notify'

// sonner-style API: toast.success / toast.error / toast.warning / toast.info / toast.loading
const toast = {
  success: (message: string, _opts?: { duration?: number }) => {
    notify.success(message)
    return message
  },
  error: (message: string, _opts?: { duration?: number }) => {
    notify.error(new Error(message), '操作失败')
    return message
  },
  warning: (message: string, _opts?: { duration?: number }) => {
    notify.warning(message)
    return message
  },
  info: (message: string, _opts?: { duration?: number }) => {
    notify.info(message)
    return message
  },
  loading: (message: string, _opts?: { id?: string }) => {
    notify.loading(message, _opts?.id ?? message)
    return _opts?.id ?? message
  },
  dismiss: (_key?: string) => {
    notify.destroy(_key)
  },
}

export { toast }