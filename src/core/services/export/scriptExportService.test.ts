import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportScriptToFormat, ScriptExportFormat } from './scriptExportService';

// Mock dependencies — use fn(() => ...) to avoid clearMocks:true wiping mockResolvedValue state
vi.mock('@/services/tauri', () => ({
  saveFile: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('../../shared/utils/formatting', () => ({
  formatTime: (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  },
  formatDate: () => '2026-04-19',
}));

vi.mock('@/shared/utils/logging', () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { saveFile } from '@/services/tauri';

const makeScript = (segments: Array<{ startTime: number; endTime: number; content: string }>) => ({
  id: 'test-script-001',
  content: segments,
  createdAt: '2026-04-19T10:00:00Z',
  updatedAt: '2026-04-19T12:00:00Z',
});

describe('exportScriptToFormat - TXT format', () => {
  it('should export script as TXT', async () => {
    const script = makeScript([
      { startTime: 0, endTime: 10, content: 'Hello world' },
    ]);
    const result = await exportScriptToFormat(script, ScriptExportFormat.TXT, 'test');
    expect(result).toBe(true);
    expect(saveFile).toHaveBeenCalledWith(
      expect.stringContaining('标题: test-script-001'),
      'test.txt',
      expect.any(Array)
    );
  });

  it('should include script metadata in TXT', async () => {
    const script = makeScript([{ startTime: 0, endTime: 10, content: 'Hello' }]);
    await exportScriptToFormat(script, ScriptExportFormat.TXT, 'my-script');
    const content = vi.mocked(saveFile).mock.calls[0][0] as string;
    expect(content).toContain('创建时间: 2026-04-19');
    expect(content).toContain('最后更新: 2026-04-19');
  });

  it('should sort segments by startTime', async () => {
    const script = makeScript([
      { startTime: 20, endTime: 30, content: 'Later' },
      { startTime: 0, endTime: 10, content: 'First' },
    ]);
    await exportScriptToFormat(script, ScriptExportFormat.TXT, 'test');
    const content = vi.mocked(saveFile).mock.calls[0][0] as string;
    expect(content.indexOf('First')).toBeLessThan(content.indexOf('Later'));
  });

  it('should use default filename if not provided', async () => {
    const script = makeScript([{ startTime: 0, endTime: 10, content: 'test' }]);
    await exportScriptToFormat(script, ScriptExportFormat.TXT);
    expect(vi.mocked(saveFile).mock.calls[0][1]).toContain('脚本_');
  });
});

describe('exportScriptToFormat - SRT format', () => {
  it('should export script as SRT', async () => {
    const script = makeScript([
      { startTime: 0, endTime: 10, content: 'Hello' },
      { startTime: 10, endTime: 20, content: 'World' },
    ]);
    const result = await exportScriptToFormat(script, ScriptExportFormat.SRT, 'test');
    expect(result).toBe(true);
  });

  it('should format SRT timecodes correctly', async () => {
    const script = makeScript([{ startTime: 3661.5, endTime: 3672.3, content: 'One hour' }]);
    await exportScriptToFormat(script, ScriptExportFormat.SRT, 'test');
    const content = vi.mocked(saveFile).mock.calls[0][0] as string;
    // 3661.5s = 01:01:01,500
    expect(content).toContain('01:01:01,500 --> 01:01:12,300');
  });

  it('should use 1-based sequential indices', async () => {
    const script = makeScript([
      { startTime: 0, endTime: 5, content: 'First' },
      { startTime: 5, endTime: 10, content: 'Second' },
    ]);
    await exportScriptToFormat(script, ScriptExportFormat.SRT, 'test');
    const content = vi.mocked(saveFile).mock.calls[0][0] as string;
    expect(content).toContain('1\n');
    expect(content).toContain('2\n');
  });

  it('should include blank line between SRT entries', async () => {
    const script = makeScript([
      { startTime: 0, endTime: 5, content: 'A' },
      { startTime: 5, endTime: 10, content: 'B' },
    ]);
    await exportScriptToFormat(script, ScriptExportFormat.SRT, 'test');
    const content = vi.mocked(saveFile).mock.calls[0][0] as string;
    // After each content there should be double newline
    expect(content).toContain('A\n\n2');
  });
});

describe('exportScriptToFormat - HTML format', () => {
  it('should export script as HTML with DOCTYPE', async () => {
    const script = makeScript([{ startTime: 0, endTime: 10, content: 'Hello' }]);
    const result = await exportScriptToFormat(script, ScriptExportFormat.HTML, 'test');
    expect(result).toBe(true);
    const content = vi.mocked(saveFile).mock.calls[0][0] as string;
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('<html lang="zh-CN">');
  });

  it('should use correct filename for HTML', async () => {
    const script = makeScript([{ startTime: 0, endTime: 10, content: 'test' }]);
    await exportScriptToFormat(script, ScriptExportFormat.HTML, 'my-export');
    expect(vi.mocked(saveFile).mock.calls[0][1]).toBe('my-export.html');
  });

  it('should escape HTML in script content', async () => {
    const script = makeScript([
      { startTime: 0, endTime: 10, content: '<b>Bold</b> & "quoted"' },
    ]);
    await exportScriptToFormat(script, ScriptExportFormat.HTML, 'test');
    const content = vi.mocked(saveFile).mock.calls[0][0] as string;
    expect(content).toContain('&lt;b&gt;Bold&lt;&#x2F;b&gt;');
    expect(content).toContain('&amp;');
    expect(content).toContain('&quot;quoted&quot;');
  });

  it('should escape HTML in script ID/title', async () => {
    const script = { ...makeScript([{ startTime: 0, endTime: 10, content: 'test' }]), id: '<script>alert(1)</script>' };
    await exportScriptToFormat(script, ScriptExportFormat.HTML, 'test');
    const content = vi.mocked(saveFile).mock.calls[0][0] as string;
    expect(content).toContain('&lt;script&gt;');
  });

  it('should include segment timestamps in HTML', async () => {
    const script = makeScript([{ startTime: 0, endTime: 10, content: 'Hello' }]);
    await exportScriptToFormat(script, ScriptExportFormat.HTML, 'test');
    const content = vi.mocked(saveFile).mock.calls[0][0] as string;
    expect(content).toContain('[00:00 - 00:10]');
  });
});

describe('exportScriptToFormat - unsupported format', () => {
  it('should return false for DOCX format', async () => {
    const script = makeScript([{ startTime: 0, endTime: 10, content: 'test' }]);
    const result = await exportScriptToFormat(script, ScriptExportFormat.DOCX, 'test');
    expect(result).toBe(false);
  });

  it('should return false for EXCEL format', async () => {
    const script = makeScript([{ startTime: 0, endTime: 10, content: 'test' }]);
    const result = await exportScriptToFormat(script, ScriptExportFormat.EXCEL, 'test');
    expect(result).toBe(false);
  });
});

describe('exportScriptToFormat - error handling', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return false when saveFile throws', async () => {
    vi.mocked(saveFile).mockRejectedValueOnce(new Error('Disk full'));
    const script = makeScript([{ startTime: 0, endTime: 10, content: 'test' }]);
    const result = await exportScriptToFormat(script, ScriptExportFormat.TXT, 'test');
    expect(result).toBe(false);
  });
});
