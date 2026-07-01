/**
 * useDirectorStatus — Director state polling with exponential backoff
 *
 * - Initial poll every 2s
 * - After 3 consecutive failures: delay = min(2000 * 2^failCount, 16000)
 * - Stop after 5 consecutive failures (return error state)
 * - Auto-stop when state === 'done' or state === 'idle' (non-initial)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getCommentaryStatus } from '@/core/services/commentary';
import { logger } from '@/shared/utils/logging';
import type { DirectorStatusResponse, DirectorState } from '@/types';

const INITIAL_INTERVAL_MS = 2000;
const MAX_INTERVAL_MS = 16000;
const MAX_FAILURES = 5;
const BACKOFF_THRESHOLD = 3; // start backoff after 3 consecutive failures

export interface UseDirectorStatusResult {
  directorStatus: DirectorStatusResponse | null;
  progressPct: number;
  currentState: DirectorState;
  error: string | null;
  isPolling: boolean;
}

export function useDirectorStatus(sessionId: string | null): UseDirectorStatusResult {
  const [directorStatus, setDirectorStatus] = useState<DirectorStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const failureCountRef = useRef(0);
  const currentIntervalRef = useRef(INITIAL_INTERVAL_MS);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stoppedRef = useRef(false);

  const clearPolling = useCallback(() => {
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setDirectorStatus(null);
      setError(null);
      failureCountRef.current = 0;
      currentIntervalRef.current = INITIAL_INTERVAL_MS;
      stoppedRef.current = false;
      clearPolling();
      return;
    }

    failureCountRef.current = 0;
    currentIntervalRef.current = INITIAL_INTERVAL_MS;
    stoppedRef.current = false;
    setIsPolling(true);

    const poll = async () => {
      if (stoppedRef.current) return;

      try {
        const status = await getCommentaryStatus(sessionId);
        setDirectorStatus(status);
        setError(null);
        failureCountRef.current = 0;
        currentIntervalRef.current = INITIAL_INTERVAL_MS;

        // Auto-stop on terminal states (only after first successful poll)
        if (status.state === 'done' || status.state === 'idle') {
          stoppedRef.current = true;
          clearPolling();
          return;
        }

        // Reschedule with current interval
        clearPolling();
        intervalIdRef.current = setInterval(poll, currentIntervalRef.current);
      } catch (e) {
        failureCountRef.current += 1;
        const failures = failureCountRef.current;
        logger.error(`[useDirectorStatus] Poll failed (${failures}/${MAX_FAILURES}):`, e);

        if (failures >= MAX_FAILURES) {
          stoppedRef.current = true;
          clearPolling();
          setError('连续失败，已停止轮询');
          return;
        }

        // Apply exponential backoff after BACKOFF_THRESHOLD failures
        if (failures >= BACKOFF_THRESHOLD) {
          const newInterval = Math.min(
            INITIAL_INTERVAL_MS * Math.pow(2, failures - BACKOFF_THRESHOLD + 1),
            MAX_INTERVAL_MS
          );
          currentIntervalRef.current = newInterval;
          clearPolling();
          intervalIdRef.current = setInterval(poll, newInterval);
        }
      }
    };

    // Initial poll
    poll();
    intervalIdRef.current = setInterval(poll, currentIntervalRef.current);

    return clearPolling;
  }, [sessionId, clearPolling]);

  return {
    directorStatus,
    progressPct: directorStatus?.progressPct ?? 0,
    currentState: directorStatus?.state ?? 'idle',
    error,
    isPolling,
  };
}