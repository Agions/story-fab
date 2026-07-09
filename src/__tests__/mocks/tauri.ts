/**
 * Unified Tauri invoke mock factory for frontend tests.
 *
 * Usage:
 *   import { mockTauriInvoke } from '@/__tests__/mocks/tauri';
 *   vi.mock('@/core/tauri', () => mockTauriInvoke());
 *
 *   // Then in test:
 *   const mocked = vi.mocked(tauri.invoke);
 *   mocked.mockResolvedValue({ code: 0, data: result, message: 'ok' });
 */

import { vi } from 'vitest';
import type { TauriCommand } from '@/core/tauri';

export interface MockTauriInvokeReturn {
  invoke: ReturnType<typeof vi.fn>;
  TauriCommand: Record<string, unknown>;
  reset: () => void;
}

export interface MockTauriInvokeOptions {
  /** Default return value for successful invocations */
  defaultReturn?: { code: number; data: unknown; message: string };
  /** Pre-configured responses keyed by command name */
  responses?: Partial<Record<TauriCommand, unknown>>;
  /** Whether invoke should reject by default */
  shouldReject?: boolean;
  /** Default error message for rejected invocations */
  errorMessage?: string;
}

const DEFAULT_SUCCESS = { code: 0 as const, data: null, message: 'ok' };

/**
 * Creates a mock Tauri module factory compatible with vi.mock().
 */
export function mockTauriInvoke(
  options: MockTauriInvokeOptions = {},
): MockTauriInvokeReturn {
  const {
    defaultReturn = DEFAULT_SUCCESS,
    responses = {},
    shouldReject = false,
    errorMessage = 'Tauri invoke failed',
  } = options;

  const invokeFn = vi.fn(async (_command: string, _args?: Record<string, unknown>) => {
    if (shouldReject) {
      throw new Error(errorMessage);
    }
    return { ...defaultReturn, data: responses[_command as TauriCommand] ?? defaultReturn.data };
  });

  const module = {
    invoke: invokeFn,
    TauriCommand: {},
  };

  return {
    invoke: invokeFn,
    TauriCommand: module.TauriCommand,
    reset: () => invokeFn.mockClear(),
  };
}

/**
 * Helper to create a mocked response with the standard API envelope.
 */
export function apiResponse<T>(data: T, message = 'ok'): { code: number; data: T; message: string } {
  return { code: 0, data, message };
}

/**
 * Helper to create a mocked error response with the standard API envelope.
 */
export function apiError(message = 'error', code = 1): { code: number; data: null; message: string } {
  return { code, data: null, message };
}
