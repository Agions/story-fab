/**
 * 功能配置常量 — AI 三大核心功能（视频解说 / 第一人称 / 混剪）的元数据
 *
 * 集中管理，避免每次渲染重建。
 */
import type { AIFunctionType } from './shared/function-mode-map';
import type { FunctionMode } from './components/function-mode-selector';

export const FUNCTION_CONFIG: Record<AIFunctionType, FunctionMode> = {
  'video-narration': {
    title: 'AI 视频解说',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    description: '对视频内容进行专业解说，适合教程、评测、科普',
    color: '#6b8cce',
    features: ['智能总结要点', '专业术语解释', '逻辑连贯', '多种语气可选'],
    example: '欢迎观看本期内容！今天我们来聊聊这个话题...',
  },
  'first-person': {
    title: 'AI 第一人称',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    description: '以第一人称视角讲述，像主播一样与观众互动',
    color: '#5a9e6f',
    features: ['真实互动感', '情感充沛', '口语化表达', '粉丝粘性高'],
    example: '嘿，朋友们！我是XXX，今天带大家一起体验...',
  },
  remix: {
    title: 'AI 混剪',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="18" r="3" />
        <line x1="6" y1="9" x2="6" y2="15" />
        <line x1="18" y1="9" x2="18" y2="15" />
        <line x1="9" y1="6" x2="15" y2="6" />
        <line x1="9" y1="18" x2="15" y2="18" />
      </svg>
    ),
    description: '自动识别精彩片段，生成节奏感强的混剪视频',
    color: '#c49660',
    features: ['智能片段选取', '节奏感强', '高潮迭起', '自动配音'],
    example: '【开场】就在刚才，发生了这一幕...',
  },
};
