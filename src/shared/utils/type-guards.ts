import type { DirectorPlan, DirectorStatusResponse } from '@/types';
import type { WhisperResult } from '@/core/services/subtitle/whisper-service';
import type { TtsBackend } from '@/core/services/ai/voice-synthesis-service';

/** Check if a value is a non-null object (not array) */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validate DirectorPlan from Rust IPC.
 * Checks required fields: id, summary (strings), confidence (number),
 * keyPoints (string array), warnings (string array).
 */
export function isDirectorPlan(value: unknown): value is DirectorPlan {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.summary === 'string' &&
    typeof value.confidence === 'number' &&
    Array.isArray(value.keyPoints) &&
    Array.isArray(value.warnings)
  );
}

/**
 * Validate DirectorStatusResponse from Rust IPC.
 * Checks required fields: sessionId and state are strings.
 */
export function isDirectorStatusResponse(value: unknown): value is DirectorStatusResponse {
  if (!isRecord(value)) return false;
  return (
    typeof value.sessionId === 'string' &&
    typeof value.state === 'string'
  );
}

/**
 * Validate Rust Whisper response shape.
 * Checks: language (string), duration_ms (number),
 * segments array with start_ms, end_ms, text on each element.
 */
export function isWhisperResult(value: unknown): value is WhisperResult {
  if (!isRecord(value)) return false;
  if (typeof value.language !== 'string') return false;
  if (typeof value.duration_ms !== 'number') return false;
  if (!Array.isArray(value.segments)) return false;
  return value.segments.every(
    (s: unknown) =>
      isRecord(s) &&
      typeof s.start_ms === 'number' &&
      typeof s.end_ms === 'number' &&
      typeof s.text === 'string',
  );
}

/**
 * Validate TTS backend array shape.
 * Each element must have name, label, description as strings.
 */
export function isTtsBackendArray(value: unknown): value is TtsBackend[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item: unknown) =>
      isRecord(item) &&
      typeof item.name === 'string' &&
      typeof item.label === 'string' &&
      typeof item.description === 'string',
  );
}

/**
 * Guard: value is Record<string, unknown>.
 * Returns true for non-null, non-array objects.
 */
export function isRecordOfStringUnknown(value: unknown): value is Record<string, unknown> {
  return isRecord(value);
}
