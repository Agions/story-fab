/**
 * useCommentarySession — Session lifecycle management
 *
 * - Creates session on videoPath change, destroys on unmount
 * - Manages selectedStyle state
 * - Uses useDirectorStatus internally
 */

import { useState, useEffect, useRef } from 'react';
import { createCommentarySession, destroyCommentarySession } from '@/core/services/commentary';
import { logger } from '@/shared/utils/logging';
import type { ScriptStylePreset } from '@/core/types/commentary';
import { useDirectorStatus, UseDirectorStatusResult } from './useDirectorStatus';

interface UseCommentarySessionResult {
  sessionId: string | null;
  directorStatus: UseDirectorStatusResult['directorStatus'];
  progressPct: number;
  currentState: UseDirectorStatusResult['currentState'];
  isPolling: UseDirectorStatusResult['isPolling'];
  isReady: boolean;
  startAnalysis: () => Promise<void>;
  resetSession: () => void;
  selectedStyle: ScriptStylePreset;
  setSelectedStyle: (style: ScriptStylePreset) => void;
}

export function useCommentarySession(
  videoPath: string,
  selectedStyle: ScriptStylePreset,
  disabled: boolean,
): UseCommentarySessionResult {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const director = useDirectorStatus(sessionId);

  // Create session on videoPath or style change
  useEffect(() => {
    if (!videoPath || disabled) {
      // Cleanup existing session
      const sid = sessionIdRef.current;
      if (sid) {
        destroyCommentarySession(sid).catch(logger.error);
        sessionIdRef.current = null;
        setSessionId(null);
      }
      return;
    }

    const init = async () => {
      try {
        const sid = await createCommentarySession(videoPath, selectedStyle);
        setSessionId(sid);
        sessionIdRef.current = sid;
      } catch (e) {
        logger.error('[useCommentarySession] 创建会话失败:', e);
      }
    };

    init();

    return () => {
      const sid = sessionIdRef.current;
      if (sid) {
        destroyCommentarySession(sid).catch(logger.error);
        sessionIdRef.current = null;
      }
    };
  }, [videoPath, disabled, selectedStyle]);

  const startAnalysis = async () => {
    // Placeholder for startCommentaryAnalysis - called externally
    // The session is already created, this just triggers analysis
  };

  const resetSession = () => {
    const sid = sessionIdRef.current;
    if (sid) {
      destroyCommentarySession(sid).catch(logger.error);
      sessionIdRef.current = null;
      setSessionId(null);
    }
  };

  const isReady = sessionId !== null && (director.currentState === 'idle' || director.currentState === 'ready');

  return {
    sessionId,
    directorStatus: director.directorStatus,
    progressPct: director.progressPct,
    currentState: director.currentState,
    isPolling: director.isPolling,
    isReady,
    startAnalysis,
    resetSession,
    selectedStyle,
    setSelectedStyle: () => {}, // controlled externally
  };
}