import { describe, it, expect } from 'vitest';
import { AppError } from '@/shared/errors';
import { TauriBridgeError, TauriCommand } from '@/core/tauri/invoke';
import { ServiceError } from '@/core/services/providers/base-service';
import { normalizeError, isRetryable } from './normalize';

describe('normalizeError', () => {
  it('returns AppError as-is', () => {
    const original = new AppError('APP_TEST', 'test', { severity: 'warning' });
    const result = normalizeError(original);
    expect(result).toBe(original);
  });

  it('normalizes TauriBridgeError → AppError with bridge context', () => {
    const tauriErr = TauriBridgeError.fromInvoke(
      TauriCommand.CHECK_FFMPEG,
      new Error('FFmpeg failed'),
    );
    const result = normalizeError(tauriErr);
    expect(result).toBeInstanceOf(AppError);
    expect(result.code).toBe('APP_TAURI_BRIDGE');
    expect(result.context).toMatchObject({
      bridge: {
        command: TauriCommand.CHECK_FFMPEG,
        retryable: false,
      },
    });
  });

  it('preserves retryable flag from TauriBridgeError', () => {
    const tauriErr = new TauriBridgeError(
      'busy',
      TauriCommand.EXPORT_VIDEO,
      undefined,
      true, // retryable
    );
    const result = normalizeError(tauriErr);
    expect(result.retryable).toBe(true);
    expect(result.severity).toBe('warning');
  });

  it('normalizes ServiceError → preserves code and statusCode', () => {
    const svcErr = new ServiceError('API failed', 'API_RATE_LIMIT', 429);
    const result = normalizeError(svcErr);
    expect(result).toBeInstanceOf(AppError);
    expect(result.code).toBe('API_RATE_LIMIT');
    expect(result.statusCode).toBe(429);
    expect(result.context).toMatchObject({
      service: { code: 'API_RATE_LIMIT', statusCode: 429 },
    });
  });

  it('normalizes generic Error → fallback code', () => {
    const result = normalizeError(new Error('boom'), 'APP_CUSTOM');
    expect(result.code).toBe('APP_CUSTOM');
    expect(result.message).toBe('boom');
    expect(result.originalError).toBeInstanceOf(Error);
  });

  it('normalizes string error', () => {
    const result = normalizeError('just a string');
    expect(result.message).toBe('just a string');
    expect(result.code).toBe('APP_UNKNOWN');
  });

  it('normalizes null/undefined gracefully', () => {
    const result = normalizeError(null);
    expect(result.message).toBe('Unknown error');
    expect(result.code).toBe('APP_UNKNOWN');
  });

  it('normalizes object error', () => {
    const result = normalizeError({ foo: 'bar' });
    expect(result.message).toBe('Unknown error');
  });
});

describe('isRetryable', () => {
  it('returns true for retryable TauriBridgeError', () => {
    const tauriErr = new TauriBridgeError(
      'busy',
      TauriCommand.EXPORT_VIDEO,
      undefined,
      true,
    );
    expect(isRetryable(tauriErr)).toBe(true);
  });

  it('returns false for generic Error', () => {
    expect(isRetryable(new Error('boom'))).toBe(false);
  });

  it('returns true for AppError with retryable=true', () => {
    const appErr = new AppError('APP_TEST', 'test', { retryable: true });
    expect(isRetryable(appErr)).toBe(true);
  });
});
