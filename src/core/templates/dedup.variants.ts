/**
 * 去重策略变体库
 * 提供多种去重策略，自动随机选择
 */

import type { ScriptData, ScriptSegment } from '@/core/types';

// 去重策略变体类型
export type DedupVariantType =
  | 'conservative'   // 保守型：最小改动
  | 'balanced'       // 平衡型：适度改写
  | 'aggressive'     // 激进型：大幅改写
  | 'creative'       // 创意型：完全重写
  | 'academic'       // 学术型：正式化改写
  | 'casual'         //  casual型：口语化改写
  | 'poetic'         // 诗意型：文学化改写
  | 'technical';     // 技术型：专业化改写

// 去重变体配置
export interface DedupVariant {
  id: DedupVariantType;
  name: string;
  description: string;
  intensity: number; // 0-1，改写强度
  strategies: string[];
  synonymRatio: number; // 同义词替换比例
  restructuring: boolean; // 是否重构句式
  expansion: boolean; // 是否扩展内容
  contraction: boolean; // 是否精简内容
}

// 去重变体定义
export const DEDUP_VARIANTS: Record<DedupVariantType, DedupVariant> = {
  conservative: {
    id: 'conservative',
    name: '保守型',
    description: '最小化改动，保持原意和结构',
    intensity: 0.2,
    strategies: ['synonym_replace', 'minor_reorder'],
    synonymRatio: 0.3,
    restructuring: false,
    expansion: false,
    contraction: false
  },

  balanced: {
    id: 'balanced',
    name: '平衡型',
    description: '适度改写，平衡原创性和可读性',
    intensity: 0.5,
    strategies: ['synonym_replace', 'sentence_restructure', 'transition_change'],
    synonymRatio: 0.5,
    restructuring: true,
    expansion: false,
    contraction: false
  },

  aggressive: {
    id: 'aggressive',
    name: '激进型',
    description: '大幅改写，最大化原创性',
    intensity: 0.8,
    strategies: ['synonym_replace', 'sentence_restructure', 'paragraph_reorder', 'voice_change', 'perspective_shift'],
    synonymRatio: 0.7,
    restructuring: true,
    expansion: true,
    contraction: true
  },

  creative: {
    id: 'creative',
    name: '创意型',
    description: '完全重写，注入新观点',
    intensity: 1.0,
    strategies: ['complete_rewrite', 'new_examples', 'fresh_metaphors', 'different_angle'],
    synonymRatio: 0.9,
    restructuring: true,
    expansion: true,
    contraction: true
  },

  academic: {
    id: 'academic',
    name: '学术型',
    description: '正式化改写，增加学术性',
    intensity: 0.6,
    strategies: ['formal_vocabulary', 'passive_voice', 'citation_style', 'technical_terms'],
    synonymRatio: 0.6,
    restructuring: true,
    expansion: true,
    contraction: false
  },

  casual: {
    id: 'casual',
    name: '口语型',
    description: '口语化改写，更接地气',
    intensity: 0.5,
    strategies: ['colloquial_phrases', 'rhetorical_questions', 'personal_pronouns', 'contractions'],
    synonymRatio: 0.4,
    restructuring: true,
    expansion: false,
    contraction: true
  },

  poetic: {
    id: 'poetic',
    name: '诗意型',
    description: '文学化改写，增加修辞',
    intensity: 0.7,
    strategies: ['metaphors', 'parallelism', 'rhythm', 'imagery', 'emotional_language'],
    synonymRatio: 0.6,
    restructuring: true,
    expansion: true,
    contraction: false
  },

  technical: {
    id: 'technical',
    name: '技术型',
    description: '专业化改写，精确表达',
    intensity: 0.6,
    strategies: ['precise_terminology', 'logical_structure', 'data_driven', 'step_by_step'],
    synonymRatio: 0.5,
    restructuring: true,
    expansion: true,
    contraction: false
  }
};

// 策略实现库
const STRATEGIES: Record<string, (content: string) => string> = {
  // 同义词替换
  synonym_replace: (content) => {
    const synonyms: Record<string, string[]> = {
      '重要': ['关键', '核心', '主要', '首要', '重大', '至关重要'],
      '很好': ['优秀', '出色', '卓越', '精良', '上乘', '杰出'],
      '很多': ['大量', '众多', '丰富', '繁多', '海量', '不胜枚举'],
      '非常': ['极其', '相当', '十分', '特别', '格外', '尤为'],
      '问题': ['难题', '挑战', '困境', '疑虑', '症结', '瓶颈'],
      '方法': ['方案', '策略', '途径', '手段', '方式', '措施'],
      '结果': ['成果', '成效', '效果', '结局', '后果', '产物'],
      '开始': ['启动', '开启', '着手', '开端', '起步', '发轫'],
      '结束': ['完成', '终结', '收尾', '落幕', '达成', '告终'],
      '增加': ['提升', '增长', '扩大', '增强', '添加', '拓展'],
      '减少': ['降低', '削减', '缩小', '减弱', '精简', '压缩'],
      '简单': ['简易', '便捷', '轻松', ' straightforward', ' uncomplicated', '简明'],
      '复杂': ['繁杂', '繁琐', '困难', '棘手', '错综复杂', '盘根错节'],
      '快速': ['迅速', '快捷', '高速', '敏捷', '飞快', '疾速'],
      '缓慢': ['渐进', '逐步', '缓慢', '迟缓', '徐徐', '循序渐进'],
      '明显': ['显著', '突出', '醒目', '清晰', '明确', '昭然若揭'],
      '可能': ['或许', '也许', '大概', '或然', '说不定', '兴许'],
      '一定': ['必然', '肯定', '必定', '确定', '毫无疑问', '毋庸置疑'],
      '因为': ['由于', '鉴于', '基于', '考虑到', '缘于', '归因于'],
      '所以': ['因此', '因而', '故而', '于是', '从而', '由此可见']
    };

    let result = content;
    for (const [word, alternatives] of Object.entries(synonyms)) {
      const regex = new RegExp(word, 'g');
      if (regex.test(result) && Math.random() < 0.5) {
        const replacement = alternatives[Math.floor(Math.random() * alternatives.length)];
        result = result.replace(regex, replacement);
      }
    }
    return result;
  },

  // 句式重构
  sentence_restructure: (content) => {
    const patterns = [
      // 主动变被动
      { from: /(.+?)让(.+?)(.+)/g, to: '$2被$1$3' },
      { from: /(.+?)使(.+?)(.+)/g, to: '$2被$1$3' },
      // 肯定变双重否定
      { from: /(.+?)必须(.+)/g, to: '$1不得不$2' },
      { from: /(.+?)一定(.+)/g, to: '$1非$2不可' },
      // 陈述变反问
      { from: /(.+?)是(.+)/g, to: '$1难道不是$2吗' },
      // 长句拆分
      { from: /(.+?)，(.+?)，(.+)/g, to: '$1。$2。$3' }
    ];

    let result = content;
    for (const pattern of patterns) {
      if (Math.random() < 0.3) {
        result = result.replace(pattern.from, pattern.to);
      }
    }
    return result;
  },

  // 段落重排
  paragraph_reorder: (content) => {
    const paragraphs = content.split(/\n\n/);
    if (paragraphs.length < 3) return content;

    // 保持首段和尾段，打乱中间
    const first = paragraphs[0];
    const last = paragraphs[paragraphs.length - 1];
    const middle = paragraphs.slice(1, -1);

    for (let i = middle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [middle[i], middle[j]] = [middle[j], middle[i]];
    }

    return [first, ...middle, last].join('\n\n');
  },

  // 视角转换
  perspective_shift: (content) => {
    const shifts = [
      { from: /我们认为/g, to: '从用户角度来看' },
      { from: /我觉得/g, to: '客观地说' },
      { from: /大家/g, to: '用户' },
      { from: /你们/g, to: '各位' }
    ];

    let result = content;
    for (const shift of shifts) {
      result = result.replace(shift.from, shift.to);
    }
    return result;
  },

  // 语气词变化
  transition_change: (content) => {
    const transitions = [
      ['接下来', '然后', '随后', '接着', '在此之后'],
      ['首先', '第一', '首要的是', '一开始'],
      ['最后', '最终', '归根结底', '总而言之'],
      ['此外', '另外', '除此之外', '不仅如此'],
      ['因此', '所以', '由此可见', '于是']
    ];

    let result = content;
    for (const group of transitions) {
      const original = group[0];
      const alternatives = group.slice(1);
      const regex = new RegExp(original, 'g');
      if (regex.test(result) && Math.random() < 0.5) {
        const replacement = alternatives[Math.floor(Math.random() * alternatives.length)];
        result = result.replace(regex, replacement);
      }
    }
    return result;
  },

  // 正式词汇
  formal_vocabulary: (content) => {
    const formal: Record<string, string> = {
      '好': '优良',
      '坏': '不良',
      '大': '显著',
      '小': '细微',
      '快': '迅速',
      '慢': '迟缓',
      '多': '大量',
      '少': '少量'
    };

    let result = content;
    for (const [informal, formalWord] of Object.entries(formal)) {
      const regex = new RegExp(informal, 'g');
      if (Math.random() < 0.3) {
        result = result.replace(regex, formalWord);
      }
    }
    return result;
  },

  // 口语化
  colloquial_phrases: (content) => {
    const colloquial: Record<string, string> = {
      '因此': '所以',
      '然而': '不过',
      '此外': '还有',
      '综上所述': '总的来说',
      '值得注意的是': '有意思的是'
    };

    let result = content;
    for (const [formal, colloq] of Object.entries(colloquial)) {
      const regex = new RegExp(formal, 'g');
      if (Math.random() < 0.4) {
        result = result.replace(regex, colloq);
      }
    }
    return result;
  },

  // 修辞手法
  metaphors: (content) => {
    const metaphors = [
      { pattern: /像(.+?)一样/, replacement: '宛如$1' },
      { pattern: /非常重要/, replacement: '至关重要，如同基石' },
      { pattern: /快速发展/, replacement: '如雨后春笋般迅猛发展' }
    ];

    let result = content;
    for (const m of metaphors) {
      if (Math.random() < 0.2) {
        result = result.replace(m.pattern, m.replacement);
      }
    }
    return result;
  }
};

// 去重变体服务
class DedupVariantService {
  private usedVariants: Set<DedupVariantType> = new Set();

  /**
   * 随机选择变体（不重复）
   */
  selectVariant(exclude?: DedupVariantType[]): DedupVariant {
    const available = Object.values(DEDUP_VARIANTS).filter(
      v => !this.usedVariants.has(v.id) && !exclude?.includes(v.id)
    );

    if (available.length === 0) {
      // 重置已使用
      this.usedVariants.clear();
      return this.selectVariant(exclude);
    }

    const selected = available[Math.floor(Math.random() * available.length)];
    this.usedVariants.add(selected.id);
    return selected;
  }

  /**
   * 根据强度选择变体
   */
  selectByIntensity(intensity: number): DedupVariant {
    const variants = Object.values(DEDUP_VARIANTS);
    const sorted = variants.sort((a, b) =>
      Math.abs(a.intensity - intensity) - Math.abs(b.intensity - intensity)
    );
    return sorted[0];
  }

  /**
   * 应用变体策略
   */
  applyVariant(content: string, variant: DedupVariant): string {
    let result = content;

    // 应用每个策略
    for (const strategy of variant.strategies) {
      if (STRATEGIES[strategy]) {
        result = STRATEGIES[strategy](result);
      }
    }

    return result;
  }

  /**
   * 智能去重（自动选择最佳变体）
   */
  smartDedup(content: string, similarity: number): {
    content: string;
    variant: DedupVariant;
    appliedStrategies: string[];
  } {
    // 根据相似度选择强度
    let intensity: number;
    if (similarity >= 0.8) {
      intensity = 1.0; // 完全重写
    } else if (similarity >= 0.6) {
      intensity = 0.8; // 激进改写
    } else if (similarity >= 0.4) {
      intensity = 0.5; // 平衡改写
    } else {
      intensity = 0.2; // 保守改写
    }

    const variant = this.selectByIntensity(intensity);
    const result = this.applyVariant(content, variant);

    return {
      content: result,
      variant,
      appliedStrategies: variant.strategies
    };
  }

  /**
   * 批量去重（多个变体）
   */
  batchDedup(content: string, count: number = 3): Array<{
    content: string;
    variant: DedupVariant;
  }> {
    const results: Array<{ content: string; variant: DedupVariant }> = [];

    for (let i = 0; i < count; i++) {
      const variant = this.selectVariant();
      const result = this.applyVariant(content, variant);
      results.push({ content: result, variant });
    }

    return results;
  }

  /**
   * 重置已使用变体
   */
  reset(): void {
    this.usedVariants.clear();
  }

  /**
   * 获取所有变体
   */
  getAllVariants(): DedupVariant[] {
    return Object.values(DEDUP_VARIANTS);
  }
}

export const dedupVariantService = new DedupVariantService();
export default dedupVariantService;

// 导出类型
export type { DedupVariant, DedupVariantType };
