/**
 * 脚本解析器
 * 职责：解析 AI 生成的脚本文本为结构化数据
 *
 * 重构说明：
 * - 从原 scriptService.ts (548行) 中提取解析逻辑
 * - 职责单一，便于维护和测试
 */

import type { ScriptSegment as CoreScriptSegment } from '@/core/types';

// ============================================
// 类型定义
// ============================================
// ============================================
// 脚本解析
// ============================================

/**
 * 解析脚本文本为段落数组
 * @param scriptText AI 生成的脚本文本
 * @returns 解析后的段落数组
 */
export function parseScriptContent(scriptText: string): CoreScriptSegment[] {
  const lines = scriptText.split('\n');
  const segments: CoreScriptSegment[] = [];
  const timestampRegex = /\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/;

  let currentContent = '';
  let currentStartTime = 0;
  let currentEndTime = 0;
  let currentType: CoreScriptSegment['type'] = 'narration';
  let hasCurrentSegment = false;

  // 保存当前段落
  const saveSegment = () => {
    if (hasCurrentSegment && currentContent.trim()) {
      segments.push({
        id: crypto.randomUUID(),
        startTime: currentStartTime,
        endTime: currentEndTime,
        content: currentContent.trim(),
        type: currentType,
      });
      currentContent = '';
      hasCurrentSegment = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(timestampRegex);
    if (match) {
      // 保存前一个段落
      saveSegment();

      // 解析新段落
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      currentStartTime = minutes * 60 + seconds;
      currentEndTime = currentStartTime + 10;
      currentContent = trimmed.replace(timestampRegex, '').trim();
      hasCurrentSegment = true;

      // 检测段落类型
      currentType = detectSegmentType(currentContent);
    } else if (hasCurrentSegment) {
      // 追加内容到当前段落
      currentContent += ' ' + trimmed;
      currentEndTime += 2;
    }
  }

  // 保存最后一个段落
  saveSegment();

  return segments;
}

/**
 * 检测段落类型
 * @param content 段落内容
 * @returns 段落类型
 */
function detectSegmentType(content: string): CoreScriptSegment['type'] {
  if (content.includes('旁白') || content.toLowerCase().includes('narration')) {
    return 'narration';
  }
  if (content.includes('对话') || content.toLowerCase().includes('dialogue')) {
    return 'dialogue';
  }
  if (content.includes('描述') || content.toLowerCase().includes('description')) {
    return 'description';
  }
  return 'narration';
}

/**
 * 格式化脚本为完整文本
 * @param segments 段落数组
 * @returns 完整文本
 */
export function formatScriptToText(segments: CoreScriptSegment[]): string {
  return segments.map((s) => s.content).join('\n\n');
}

/**
 * 创建脚本草稿
 * @param content 原始文本
 * @param projectId 项目 ID
 * @returns 脚本草稿对象
 */
export function createScriptDraft(content: string, projectId: string): {
  id: string;
  projectId: string;
  content: CoreScriptSegment[];
  fullText: string;
  createdAt: string;
  updatedAt: string;
} {
  const segments = parseScriptContent(content);
  return {
    id: crypto.randomUUID(),
    projectId,
    content: segments,
    fullText: formatScriptToText(segments),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
