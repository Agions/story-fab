/**
 * ClipRepurposing — 长视频 → 多短片段自动拆条
 *
 * 核心模块：
 *   clipScorer.ts    — 多维评分引擎（6 维度）
 *   seoGenerator.ts  — SEO 元数据生成
 *   multiExport.ts — 多格式导出
 *   pipeline.ts      — 完整拆条管道编排
 */

export * from './clip-scorer';
export * from './seo-generator';
export * from './multi-export';
export * from './pipeline';
export * from './types';
