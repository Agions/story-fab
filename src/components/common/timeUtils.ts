/**
 * Shared time formatting utilities
 */

/**
 * Formats seconds into MM:SS.CC format (minutes:seconds.centiseconds)
 * Used for display in timeline and highlight markers
 */
export function formatTime(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const cs = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}
