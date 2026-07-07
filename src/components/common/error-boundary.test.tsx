import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorBoundary } from './error-boundary';
import { logger } from '../../shared/utils/logging';

vi.mock('../../shared/utils/logging', () => ({
  logger: { error: vi.fn() },
}));

const Thrower = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) throw new Error('Test error');
  return <button>Working</button>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <button>Working</button>
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: 'Working' })).toBeInTheDocument();
  });

  it('should catch child error and show default error UI', () => {
    render(
      <ErrorBoundary>
        <Thrower shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should show custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom</div>}>
        <Thrower shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });

  it('should call logger.error when catching an error', () => {
    render(
      <ErrorBoundary>
        <Thrower shouldThrow />
      </ErrorBoundary>
    );
    expect(logger.error).toHaveBeenCalledWith(
      '[ErrorBoundary] 渲染异常',
      expect.objectContaining({ error: 'Test error' })
    );
  });

  it('should include name in log label when provided', () => {
    render(
      <ErrorBoundary name="TestComp">
        <Thrower shouldThrow />
      </ErrorBoundary>
    );
    expect(logger.error).toHaveBeenCalledWith(
      '[TestComp] 渲染异常',
      expect.objectContaining({ error: 'Test error' })
    );
  });

  it('should support function fallback receiving error + reset', async () => {
    const fallback = vi.fn((_: Error, __: () => void) => (
      <div data-testid="fn-fallback">fn</div>
    ));
    render(
      <ErrorBoundary fallback={fallback}>
        <Thrower shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('fn-fallback')).toBeInTheDocument();
    expect(fallback).toHaveBeenCalled();
  });

  it('should reset error state when reset button is clicked', async () => {
    render(
      <ErrorBoundary>
        <Thrower shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /重试/ }));
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
