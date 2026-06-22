/**
 * AI 分析任务配置
 * 职责：定义 AI 分析阶段的所有任务及其配置
 *
 * 重构说明：
 * - 从原 AIVisualizer.tsx (570行) 中提取任务配置
 * - 职责单一：只负责任务配置数据
 * - 集中管理任务列表、图标和描述
 */

import React from 'react';

// ============================================
// 类型定义
// ============================================

interface AnalysisTask {
  key: string;
  label: string;
  icon: React.ReactNode;
  desc: string;
}

// ============================================
// 任务配置
// ============================================

/**
 * 分析任务列表
 * 包含：场景识别、OCR、ASR、情感分析、摘要等
 */
export const ANALYSIS_TASKS: AnalysisTask[] = [
  {
    key: 'scene',
    label: '场景识别',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
    desc: '自动识别视频中的不同场景',
  },
  {
    key: 'ocr',
    label: 'OCR 文字识别',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7V4h16v3M9 20h6M12 4v16" />
      </svg>
    ),
    desc: '提取视频中的文字内容（即将上线）',
  },
  {
    key: 'asr',
    label: '语音转写',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
      </svg>
    ),
    desc: '将语音转换为文字',
  },
  {
    key: 'emotion',
    label: '情感分析',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
      </svg>
    ),
    desc: '分析视频的情感倾向',
  },
  {
    key: 'summary',
    label: '内容摘要',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10,9 9,9 8,9" />
      </svg>
    ),
    desc: '生成视频内容摘要',
  },
];

/**
 * 任务图标映射（按 key 索引）
 */
export const TASK_ICONS: Record<string, React.ReactNode> = ANALYSIS_TASKS.reduce(
  (acc, task) => {
    acc[task.key] = task.icon;
    return acc;
  },
  {} as Record<string, React.ReactNode>
);
