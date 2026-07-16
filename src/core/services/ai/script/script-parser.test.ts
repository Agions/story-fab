/**
 * script-parser 测试
 *
 * Stage 9 PR-3：脚本解析纯函数覆盖
 */
import { describe, it, expect } from 'vitest';
import { parseScriptContent, createScriptDraft, formatScriptToText } from './script-parser';

describe('parseScriptContent', () => {
  it('returns empty array for empty content', () => {
    expect(parseScriptContent('')).toEqual([]);
  });

  it('returns empty array for plain text without timestamps', () => {
    // This parser only handles timestamped content like [0:00] text
    const result = parseScriptContent('Hello world without timestamps');
    expect(result).toEqual([]);
  });

  it('parses single timestamped segment', () => {
    const result = parseScriptContent('[0:00] Hello world');
    expect(result.length).toBe(1);
    expect(result[0]?.content).toBe('Hello world');
    expect(result[0]?.startTime).toBe(0);
  });

  it('parses multiple timestamped segments', () => {
    const result = parseScriptContent('[0:00] First\n\n[0:05] Second\n\n[0:10] Third');
    expect(result.length).toBe(3);
    expect(result[0]?.content).toBe('First');
    expect(result[1]?.content).toBe('Second');
    expect(result[2]?.content).toBe('Third');
  });

  it('parses M:SS timestamps correctly', () => {
    const result = parseScriptContent('[1:30] One minute thirty');
    expect(result[0]?.startTime).toBe(90);
  });

  it('generates unique ids for each segment', () => {
    const result = parseScriptContent('[0:00] A\n\n[0:05] B\n\n[0:10] C');
    const ids = new Set(result.map((s) => s.id));
    expect(ids.size).toBe(3);
  });
});

describe('createScriptDraft', () => {
  it('creates draft with all required fields', () => {
    const draft = createScriptDraft('[0:00] First paragraph.\n\n[0:05] Second paragraph.', 'proj-1');
    expect(draft.projectId).toBe('proj-1');
    expect(draft.id).toBeDefined();
    expect(draft.createdAt).toBeDefined();
    expect(draft.updatedAt).toBeDefined();
    expect(draft.fullText).toContain('First paragraph');
    expect(draft.fullText).toContain('Second paragraph');
  });

  it('joins content into fullText', () => {
    const draft = createScriptDraft('[0:00] A\n\n[0:05] B\n\n[0:10] C', 'p');
    expect(draft.fullText).toContain('A');
    expect(draft.fullText).toContain('B');
    expect(draft.fullText).toContain('C');
  });
});

describe('formatScriptToText', () => {
  it('formats segments with content joined by double newline', () => {
    const segments = [
      { id: 's1', startTime: 0, endTime: 5, content: 'First', type: 'narration' as const },
      { id: 's2', startTime: 5, endTime: 10, content: 'Second', type: 'narration' as const },
    ];
    const formatted = formatScriptToText(segments as unknown as Parameters<typeof formatScriptToText>[0]);
    expect(formatted).toBe('First\n\nSecond');
  });

  it('returns empty string for empty segments', () => {
    expect(formatScriptToText([])).toBe('');
  });
});
