import type { ScriptSegment, ScriptData } from '@/core/types';

export type DedupStrategy = 'exact' | 'semantic' | 'structural' | 'template';

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

export interface DedupConfig {
  enabled: boolean;
  strategies: DedupStrategy[];
  threshold: number;
  autoFix: boolean;
  preserveMeaning: boolean;
  autoVariant: boolean;
  variantIntensity?: number;
}

export interface OriginalityReport {
  score: number;
  duplicates: DuplicateResult[];
  suggestions: string[];
}

export const COMMON_PHRASES = {
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
  transition: [
    '接下来我们看看',
    '那么接下来',
    '说完这个，我们再来看看',
    '不仅如此',
    '更重要的是',
    '除此之外',
    '另外值得一提的是'
  ],
  conclusion: [
    '好了，今天的分享就到这里',
    '以上就是今天的全部内容',
    '希望今天的分享对你有帮助',
    '如果你觉得有用，记得点赞收藏',
    '我们下期再见',
    '感谢大家的观看'
  ],
  emphasis: [
    '非常重要',
    '值得注意的是',
    '关键点在于',
    '这里需要特别注意',
    '这一点很关键',
    '千万不要忽视'
  ],
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

export const SYNONYMS: Record<string, string[]> = {
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

export const SENTENCE_PATTERNS = {
  activeToPassive: [
    { from: /(.+?)让(.+?)(.+)/, to: '$2被$1$3' },
    { from: /(.+?)使(.+?)(.+)/, to: '$2被$1$3' }
  ],
  affirmativeToDoubleNegative: [
    { from: /(.+?)必须(.+)/, to: '$1不得不$2' },
    { from: /(.+?)一定(.+)/, to: '$1非$2不可' }
  ],
  statementToRhetorical: [
    { from: /(.+?)是(.+)/, to: '$1难道不是$2吗' },
    { from: /(.+?)可以(.+)/, to: '$1不是可以$2吗' }
  ],
  longSentenceSplit: [
    { from: /(.+?)，(.+?)，(.+)/, to: '$1。$2。$3' }
  ],
  shortSentenceMerge: [
    { from: /(.+?)。(.+?)。/, to: '$1，$2。' }
  ]
};

export const ALTERNATIVE_PHRASES: Record<string, string[]> = {
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
