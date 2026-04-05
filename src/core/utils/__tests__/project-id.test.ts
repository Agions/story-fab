import { describe, expect, it } from 'vitest';
import { buildProjectIdCandidates, normalizeProjectId } from '../project-id';

describe('project-id utils', () => {
  it('normalizeProjectId should trim and remove .json suffix', () => {
    expect(normalizeProjectId('  abc-123.json  ')).toBe('abc-123');
    expect(normalizeProjectId('abc-123')).toBe('abc-123');
  });

  it('buildProjectIdCandidates should include decoded and basename variants', () => {
    const candidates = buildProjectIdCandidates(
      '/tmp/cutdeck%2Fproject-01.json'
    );
    expect(candidates).toContain('project-01');
    expect(candidates).toContain('project-01.json'.replace(/\.json$/i, ''));
  });

  it('buildProjectIdCandidates should de-duplicate values', () => {
    const candidates = buildProjectIdCandidates('demo.json');
    expect(candidates).toEqual(['demo']);
  });

  it('buildProjectIdCandidates should handle encoded filename safely', () => {
    const candidates = buildProjectIdCandidates('my%20project.json');
    expect(candidates).toContain('my project');
    expect(candidates).toContain('my%20project');
  });

  it('buildProjectIdCandidates should return empty array for empty input', () => {
    expect(buildProjectIdCandidates('')).toEqual([]);
    expect(buildProjectIdCandidates('   ')).toEqual([]);
  });
});
