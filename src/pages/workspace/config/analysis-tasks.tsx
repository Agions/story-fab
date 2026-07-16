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
import { Camera, Type, Mic, SmilePlus, FileText } from 'lucide-react';

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
    icon: <Camera size={18} />,
    desc: '自动识别视频中的不同场景',
  },
  {
    key: 'ocr',
    label: 'OCR 文字识别',
    icon: <Type size={18} />,
    desc: '提取视频中的文字内容（即将上线）',
  },
  {
    key: 'asr',
    label: '语音转写',
    icon: <Mic size={18} />,
    desc: '将语音转换为文字',
  },
  {
    key: 'emotion',
    label: '情感分析',
    icon: <SmilePlus size={18} />,
    desc: '分析视频的情感倾向',
  },
  {
    key: 'summary',
    label: '内容摘要',
    icon: <FileText size={18} />,
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
