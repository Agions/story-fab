/**
 * 去重模板库
 * 用于检测和去除重复内容，提高原创性
 */

import type { ScriptSegment, ScriptData } from '@/core/types';
import { dedupVariantService, type DedupVariant } from './dedup.variants';

// 去重策略类型
export type DedupStrategy = 'exact' | 'semantic' | 'structural' | 'template';

// 重复检测结果
export interface DuplicateResult {
  id: string;
  type: 'exact' | 'similar' | 'template';
  source: {
    segmentId: string;
    content: string;
    startTime: number;
  };
  target: {
    segmentId: string;
    content: string;
    startTime: number;
  };
  similarity: number;
  suggestion: string;
}

// 去重配置
export interface DedupConfig {
  enabled: boolean;
  strategies: DedupStrategy[];
  threshold: number;
  autoFix: boolean;
  preserveMeaning: boolean;
  // 自动变体选择
  autoVariant: boolean;
  variantIntensity?: number;
}

// 原创性报告结果
export interface OriginalityReport {
  score: number;
  duplicates: DuplicateResult[];
  suggestions: string[];
}

// 常用短语库（用于检测模板化内容）
const COMMON_PHRASES = {
  // 开场套话
  intro: [
    '大家好，欢迎来到',
    '今天给大家带来',
    '今天要和大家分享',
    '相信很多人都有过这样的经历',
    '不知道大家有没有发现',
    '今天我们要聊的是',
    '最近我发现',
    '今天给大家推荐'
  ],
  // 过渡套话
  transition: [
    '接下来我们看看',
    '那么接下来',
    '说完这个，我们再来看看',
    '不仅如此',
    '更重要的是',
    '除此之外',
    '另外值得一提的是'
  ],
  // 结尾套话
  conclusion: [
    '好了，今天的分享就到这里',
    '以上就是今天的全部内容',
    '希望今天的分享对你有帮助',
    '如果你觉得有用，记得点赞收藏',
    '我们下期再见',
    '感谢大家的观看'
  ],
  // 强调套话
  emphasis: [
    '非常重要',
    '值得注意的是',
    '关键点在于',
    '这里需要特别注意',
    '这一点很关键',
    '千万不要忽视'
  ],
  // 主观评价
  subjective: [
    '我觉得',
    '个人认为',
    '在我看来',
    '说实话',
    '老实说',
    '坦白讲',
    '不得不说'
  ]
};

// 同义词替换库
const SYNONYMS: Record<string, string[]> = {
  '重要': ['关键', '核心', '主要', '首要', '重大'],
  '很好': ['优秀', '出色', '卓越', '精良', '上乘'],
  '很多': ['大量', '众多', '丰富', '繁多', '海量'],
  '非常': ['极其', '相当', '十分', '特别', '格外'],
  '问题': ['难题', '挑战', '困境', '疑虑', '症结'],
  '方法': ['方案', '策略', '途径', '手段', '方式'],
  '结果': ['成果', '成效', '效果', '结局', '后果'],
  '开始': ['启动', '开启', '着手', '开端', '起步'],
  '结束': ['完成', '终结', '收尾', '落幕', '达成'],
  '增加': ['提升', '增长', '扩大', '增强', '添加'],
  '减少': ['降低', '削减', '缩小', '减弱', '精简'],
  '简单': ['简易', '便捷', '轻松', ' straightforward', ' uncomplicated'],
  '复杂': ['繁杂', '繁琐', '困难', '棘手', '错综复杂'],
  '快速': ['迅速', '快捷', '高速', '敏捷', '飞快'],
  '缓慢': ['渐进', '逐步', '缓慢', '迟缓', '徐徐'],
  '明显': ['显著', '突出', '醒目', '清晰', '明确'],
  '可能': ['或许', '也许', '大概', '或然', '说不定'],
  '一定': ['必然', '肯定', '必定', '确定', '毫无疑问'],
  '因为': ['由于', '鉴于', '基于', '考虑到', '缘于'],
  '所以': ['因此', '因而', '故而', '于是', '从而']
};

// 句式变换模板
const SENTENCE_PATTERNS = {
  // 主动变被动
  activeToPassive: [
    { from: /(.+?)让(.+?)(.+)/, to: '$2被$1$3' },
    { from: /(.+?)使(.+?)(.+)/, to: '$2被$1$3' }
  ],
  // 肯定变双重否定
  affirmativeToDoubleNegative: [
    { from: /(.+?)必须(.+)/, to: '$1不得不$2' },
    { from: /(.+?)一定(.+)/, to: '$1非$2不可' }
  ],
  // 陈述变反问
  statementToRhetorical: [
    { from: /(.+?)是(.+)/, to: '$1难道不是$2吗' },
    { from: /(.+?)可以(.+)/, to: '$1不是可以$2吗' }
  ],
  // 长句拆分
  longSentenceSplit: [
    { from: /(.+?)，(.+?)，(.+)/, to: '$1。$2。$3' }
  ],
  // 短句合并
  shortSentenceMerge: [
    { from: /(.+?)。(.+?)。/, to: '$1，$2。' }
  ]
};

class DedupService {
  private config: DedupConfig;

  constructor(config: Partial<DedupConfig> = {}) {
    this.config = {
      enabled: true,
      strategies: ['exact', 'semantic', 'template'],
      threshold: 0.7,
      autoFix: false,
      preserveMeaning: true,
      autoVariant: true, // 默认启用自动变体
      ...config
    };
  }

  /**
   * 检测脚本中的重复内容
   */
  detectDuplicates(script: ScriptData): DuplicateResult[] {
    const duplicates: DuplicateResult[] = [];
    const segments = script.segments;

    // 1. 精确匹配检测
    if (this.config.strategies.includes('exact')) {
      duplicates.push(...this.detectExactDuplicates(segments));
    }

    // 2. 语义相似检测
    if (this.config.strategies.includes('semantic')) {
      duplicates.push(...this.detectSemanticDuplicates(segments));
    }

    // 3. 模板化内容检测
    if (this.config.strategies.includes('template')) {
      duplicates.push(...this.detectTemplateContent(segments));
    }

    // 4. 结构重复检测
    if (this.config.strategies.includes('structural')) {
      duplicates.push(...this.detectStructuralDuplicates(segments));
    }

    // 去重并按相似度排序
    return this.deduplicateResults(duplicates)
      .sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * 精确匹配检测
   */
  private detectExactDuplicates(segments: ScriptSegment[]): DuplicateResult[] {
    const duplicates: DuplicateResult[] = [];
    const contentMap = new Map<string, string>();

    for (const segment of segments) {
      const normalized = this.normalizeText(segment.content);

      if (contentMap.has(normalized)) {
        const existingId = contentMap.get(normalized)!;
        const existing = segments.find(s => s.id === existingId)!;

        duplicates.push({
          id: `dup_exact_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: 'exact',
          source: {
            segmentId: existing.id,
            content: existing.content,
            startTime: existing.startTime
          },
          target: {
            segmentId: segment.id,
            content: segment.content,
            startTime: segment.startTime
          },
          similarity: 1.0,
          suggestion: '内容完全重复，建议删除或合并'
        });
      } else {
        contentMap.set(normalized, segment.id);
      }
    }

    return duplicates;
  }

  /**
   * 语义相似检测
   */
  private detectSemanticDuplicates(segments: ScriptSegment[]): DuplicateResult[] {
    const duplicates: DuplicateResult[] = [];

    for (let i = 0; i < segments.length; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        const similarity = this.calculateSimilarity(
          segments[i].content,
          segments[j].content
        );

        if (similarity >= this.config.threshold) {
          duplicates.push({
            id: `dup_semantic_${Date.now()}_${i}_${j}`,
            type: 'similar',
            source: {
              segmentId: segments[i].id,
              content: segments[i].content,
              startTime: segments[i].startTime
            },
            target: {
              segmentId: segments[j].id,
              content: segments[j].content,
              startTime: segments[j].startTime
            },
            similarity,
            suggestion: this.generateSuggestion(similarity)
          });
        }
      }
    }

    return duplicates;
  }

  /**
   * 模板化内容检测
   */
  private detectTemplateContent(segments: ScriptSegment[]): DuplicateResult[] {
    const duplicates: DuplicateResult[] = [];

    for (const segment of segments) {
      for (const [category, phrases] of Object.entries(COMMON_PHRASES)) {
        for (const phrase of phrases) {
          if (segment.content.includes(phrase)) {
            duplicates.push({
              id: `dup_template_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              type: 'template',
              source: {
                segmentId: segment.id,
                content: phrase,
                startTime: segment.startTime
              },
              target: {
                segmentId: segment.id,
                content: segment.content,
                startTime: segment.startTime
              },
              similarity: 0.5,
              suggestion: `检测到${category}套话，建议替换为更原创的表达`
            });
          }
        }
      }
    }

    return duplicates;
  }

  /**
   * 结构重复检测
   */
  private detectStructuralDuplicates(segments: ScriptSegment[]): DuplicateResult[] {
    const duplicates: DuplicateResult[] = [];

    // 检测相似的句式结构
    for (let i = 0; i < segments.length; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        const structureSimilarity = this.calculateStructureSimilarity(
          segments[i].content,
          segments[j].content
        );

        if (structureSimilarity >= this.config.threshold) {
          duplicates.push({
            id: `dup_structural_${Date.now()}_${i}_${j}`,
            type: 'similar',
            source: {
              segmentId: segments[i].id,
              content: segments[i].content,
              startTime: segments[i].startTime
            },
            target: {
              segmentId: segments[j].id,
              content: segments[j].content,
              startTime: segments[j].startTime
            },
            similarity: structureSimilarity,
            suggestion: '句式结构相似，建议变换表达方式'
          });
        }
      }
    }

    return duplicates;
  }

  /**
   * 计算文本相似度
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const normalized1 = this.normalizeText(text1);
    const normalized2 = this.normalizeText(text2);

    // 使用编辑距离计算相似度
    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);

    return 1 - distance / maxLength;
  }

  /**
   * 计算结构相似度
   */
  private calculateStructureSimilarity(text1: string, text2: string): number {
    // 提取句式特征
    const features1 = this.extractStructureFeatures(text1);
    const features2 = this.extractStructureFeatures(text2);

    // 计算特征重合度
    const intersection = features1.filter(f => features2.includes(f));
    const union = [...new Set([...features1, ...features2])];

    return intersection.length / union.length;
  }

  /**
   * 提取结构特征
   */
  private extractStructureFeatures(text: string): string[] {
    const features: string[] = [];

    // 检测句式模式
    if (/^(.+?)是(.+?)$/.test(text)) features.push('是字句');
    if (/^(.+?)让(.+?)$/.test(text)) features.push('使令句');
    if (/^(.+?)可以(.+?)$/.test(text)) features.push('可能句');
    if (/^(.+?)有(.+?)$/.test(text)) features.push('存在句');
    if (/^(.+?)在(.+?)$/.test(text)) features.push('处所句');

    // 检测连接词
    if (text.includes('因为') || text.includes('由于')) features.push('因果');
    if (text.includes('但是') || text.includes('然而')) features.push('转折');
    if (text.includes('而且') || text.includes('并且')) features.push('递进');
    if (text.includes('如果') || text.includes('假如')) features.push('假设');

    return features;
  }

  /**
   * 编辑距离算法
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str1.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[str1.length][str2.length];
  }

  /**
   * 标准化文本
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[\s，。！？、；：""''（）【】]/g, '')
      .trim();
  }

  /**
   * 生成建议
   */
  private generateSuggestion(similarity: number): string {
    if (similarity >= 0.9) {
      return '内容高度相似，建议完全重写';
    } else if (similarity >= 0.8) {
      return '内容较为相似，建议大幅修改';
    } else if (similarity >= 0.7) {
      return '内容有一定相似度，建议调整表达方式';
    }
    return '建议检查内容原创性';
  }

  /**
   * 去重结果
   */
  private deduplicateResults(results: DuplicateResult[]): DuplicateResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = `${result.source.segmentId}-${result.target.segmentId}`;
      const reverseKey = `${result.target.segmentId}-${result.source.segmentId}`;

      if (seen.has(key) || seen.has(reverseKey)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  /**
   * 自动修复重复内容
   */
  autoFix(script: ScriptData): ScriptData {
    const duplicates = this.detectDuplicates(script);
    let fixedSegments = [...script.segments];

    for (const dup of duplicates) {
      const targetIndex = fixedSegments.findIndex(
        s => s.id === dup.target.segmentId
      );

      if (targetIndex >= 0) {
        switch (dup.type) {
          case 'exact':
            // 完全重复：删除或合并
            fixedSegments = this.mergeSegments(fixedSegments, dup);
            break;

          case 'similar':
            // 相似内容：改写
            fixedSegments[targetIndex] = this.rewriteSegment(
              fixedSegments[targetIndex],
              dup.similarity
            );
            break;

          case 'template':
            // 模板化内容：替换套话
            fixedSegments[targetIndex] = this.replaceTemplatePhrases(
              fixedSegments[targetIndex]
            );
            break;
        }
      }
    }

    return {
      ...script,
      segments: fixedSegments,
      content: fixedSegments.map(s => s.content).join('\n\n'),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * 合并段落
   */
  private mergeSegments(
    segments: ScriptSegment[],
    duplicate: DuplicateResult
  ): ScriptSegment[] {
    const sourceIndex = segments.findIndex(s => s.id === duplicate.source.segmentId);
    const targetIndex = segments.findIndex(s => s.id === duplicate.target.segmentId);

    if (sourceIndex >= 0 && targetIndex >= 0) {
      // 合并内容
      segments[sourceIndex] = {
        ...segments[sourceIndex],
        content: `${segments[sourceIndex].content} ${segments[targetIndex].content}`,
        endTime: segments[targetIndex].endTime
      };

      // 删除重复段落
      segments.splice(targetIndex, 1);
    }

    return segments;
  }

  /**
   * 改写段落（使用自动变体）
   */
  private rewriteSegment(segment: ScriptSegment, similarity: number): ScriptSegment {
    let content = segment.content;

    // 如果启用自动变体，使用变体服务
    if (this.config.autoVariant) {
      const result = dedupVariantService.smartDedup(content, similarity);
      content = result.content;
    } else {
      // 根据相似度决定改写程度
      if (similarity >= 0.9) {
        content = this.completeRewrite(content);
      } else if (similarity >= 0.8) {
        content = this.majorRewrite(content);
      } else {
        content = this.minorRewrite(content);
      }
    }

    return {
      ...segment,
      content,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * 完全重写
   */
  private completeRewrite(content: string): string {
    // 使用同义词替换 + 句式变换
    let rewritten = content;

    // 同义词替换
    for (const [word, alternatives] of Object.entries(SYNONYMS)) {
      const regex = new RegExp(word, 'g');
      if (regex.test(rewritten)) {
        const replacement = alternatives[Math.floor(Math.random() * alternatives.length)];
        rewritten = rewritten.replace(regex, replacement);
      }
    }

    // 句式变换
    for (const patterns of Object.values(SENTENCE_PATTERNS)) {
      for (const pattern of patterns) {
        rewritten = rewritten.replace(pattern.from, pattern.to as string);
      }
    }

    return rewritten;
  }

  /**
   * 大幅改写
   */
  private majorRewrite(content: string): string {
    // 主要进行同义词替换
    let rewritten = content;

    for (const [word, alternatives] of Object.entries(SYNONYMS)) {
      const regex = new RegExp(word, 'g');
      if (regex.test(rewritten) && Math.random() > 0.5) {
        const replacement = alternatives[Math.floor(Math.random() * alternatives.length)];
        rewritten = rewritten.replace(regex, replacement);
      }
    }

    return rewritten;
  }

  /**
   * 轻微改写
   */
  private minorRewrite(content: string): string {
    // 调整语序，添加过渡词
    const transitions = ['此外', '同时', '另外', '值得一提的是'];
    const transition = transitions[Math.floor(Math.random() * transitions.length)];

    if (!content.startsWith(transition)) {
      return `${transition}，${content}`;
    }

    return content;
  }

  /**
   * 替换模板化短语
   */
  private replaceTemplatePhrases(segment: ScriptSegment): ScriptSegment {
    let content = segment.content;

    for (const [category, phrases] of Object.entries(COMMON_PHRASES)) {
      for (const phrase of phrases) {
        if (content.includes(phrase)) {
          const replacement = this.getAlternativePhrase(category, phrase);
          content = content.replace(phrase, replacement);
        }
      }
    }

    return {
      ...segment,
      content,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * 获取替代表达
   */
  private getAlternativePhrase(category: string, original: string): string {
    const alternatives: Record<string, string[]> = {
      intro: [
        '欢迎来到本期内容',
        '很高兴在这里见到你',
        '今天我们来探讨',
        '这期内容我们要聊',
        '让我们开始今天的分享'
      ],
      transition: [
        '接下来',
        '然后',
        '随后',
        '接着',
        '在此之后'
      ],
      conclusion: [
        '这就是今天的全部',
        '感谢你的观看',
        '希望对你有所帮助',
        '期待下次再见',
        '祝你有美好的一天'
      ],
      emphasis: [
        '这一点很关键',
        '值得重点关注',
        '这是核心所在',
        '不容忽视',
        '必须牢记'
      ],
      subjective: [
        '从我的角度来看',
        '基于我的经验',
        '据我观察',
        '以我的理解',
        '从我的立场出发'
      ]
    };

    const categoryAlternatives = alternatives[category] || [original];
    const filtered = categoryAlternatives.filter(a => a !== original);

    if (filtered.length > 0) {
      return filtered[Math.floor(Math.random() * filtered.length)];
    }

    return original;
  }

  /**
   * 生成原创性报告
   */
  generateOriginalityReport(script: ScriptData): OriginalityReport {
    const duplicates = this.detectDuplicates(script);

    // 计算原创性分数
    const totalSegments = script.segments.length;
    const duplicateCount = new Set(duplicates.map(d => d.target.segmentId)).size;
    const score = Math.max(0, 100 - (duplicateCount / totalSegments) * 100);

    // 生成建议
    const suggestions: string[] = [];

    if (score < 60) {
      suggestions.push('原创性较低，建议大幅修改内容');
    } else if (score < 80) {
      suggestions.push('原创性一般，建议优化重复段落');
    }

    const templateCount = duplicates.filter(d => d.type === 'template').length;
    if (templateCount > 0) {
      suggestions.push(`检测到 ${templateCount} 处模板化表达，建议使用更原创的语言`);
    }

    const exactCount = duplicates.filter(d => d.type === 'exact').length;
    if (exactCount > 0) {
      suggestions.push(`检测到 ${exactCount} 处完全重复内容，建议删除或合并`);
    }

    return {
      score: Math.round(score),
      duplicates,
      suggestions
    };
  }
}

export const dedupService = new DedupService();
export default dedupService;

// 导出类型
export type { DedupConfig, DuplicateResult, DedupStrategy, OriginalityReport };
