/**
 * 解说脚本模板
 * 提供多种专业解说模板
 */

import type { ScriptTemplate, ScriptMetadata } from '@/core/types';

// 基础模板接口
interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  structure: {
    sections: Array<{
      type: 'intro' | 'hook' | 'body' | 'transition' | 'conclusion' | 'cta';
      name: string;
      duration: number; // 占比 (0-1)
      content: string;
      tips: string[];
    }>;
  };
  style: {
    tone: string;
    pace: 'slow' | 'medium' | 'fast';
    formality: 'casual' | 'neutral' | 'formal';
  };
  examples: string[];
}

// 模板库
const TEMPLATES: TemplateConfig[] = [
  // ===== 产品评测类 =====
  {
    id: 'product-review',
    name: '产品深度评测',
    description: '适合电子产品、生活用品等详细评测',
    category: 'product',
    tags: ['评测', '产品', '详细', '专业'],
    structure: {
      sections: [
        {
          type: 'hook',
          name: '开场钩子',
          duration: 0.05,
          content: '用一句话点出产品的核心卖点或痛点',
          tips: ['直击用户痛点', '制造悬念', '提出疑问']
        },
        {
          type: 'intro',
          name: '产品介绍',
          duration: 0.1,
          content: '产品名称、品牌、定位、价格区间',
          tips: ['简明扼要', '突出关键信息', '建立期待']
        },
        {
          type: 'body',
          name: '外观展示',
          duration: 0.15,
          content: '外观设计、材质、做工、尺寸、重量',
          tips: ['多角度展示', '细节特写', '对比参照物']
        },
        {
          type: 'body',
          name: '核心功能',
          duration: 0.25,
          content: '主要功能演示、使用场景、实际效果',
          tips: ['功能逐一演示', '真实使用场景', '前后对比']
        },
        {
          type: 'body',
          name: '性能测试',
          duration: 0.2,
          content: '数据测试、对比测试、极限测试',
          tips: ['客观数据', '横向对比', '真实测试']
        },
        {
          type: 'body',
          name: '优缺点总结',
          duration: 0.1,
          content: '优点3点、缺点2点、适用人群',
          tips: ['客观公正', '具体明确', '有理有据']
        },
        {
          type: 'conclusion',
          name: '购买建议',
          duration: 0.08,
          content: '性价比分析、购买渠道、优惠信息',
          tips: ['给出明确建议', '说明适用人群', '提供购买信息']
        },
        {
          type: 'cta',
          name: '互动引导',
          duration: 0.07,
          content: '提问互动、关注引导、下期预告',
          tips: ['引导评论', '鼓励关注', '预告内容']
        }
      ]
    },
    style: {
      tone: '专业客观',
      pace: 'medium',
      formality: 'neutral'
    },
    examples: [
      '「这款耳机真的值这个价吗？看完这5个测试你就知道了」',
      '「用了30天，我发现了这个手机的3个致命缺点」'
    ]
  },

  // ===== 教程教学类 =====
  {
    id: 'tutorial-step-by-step',
    name: '分步教程',
    description: '适合软件操作、手工制作、烹饪等教程',
    category: 'tutorial',
    tags: ['教程', '步骤', '教学', '操作'],
    structure: {
      sections: [
        {
          type: 'intro',
          name: '成果展示',
          duration: 0.1,
          content: '展示最终效果，激发学习兴趣',
          tips: ['高质量展示', '多角度呈现', '强调实用性']
        },
        {
          type: 'intro',
          name: '准备工作',
          duration: 0.08,
          content: '所需材料、工具、环境准备',
          tips: ['清单式罗列', '替代方案', '注意事项']
        },
        {
          type: 'body',
          name: '步骤一：基础设置',
          duration: 0.15,
          content: '第一步详细操作，关键要点',
          tips: ['慢速演示', '重点标注', '常见错误']
        },
        {
          type: 'body',
          name: '步骤二：核心操作',
          duration: 0.2,
          content: '核心步骤，重点技巧',
          tips: ['详细讲解', '技巧分享', '原理说明']
        },
        {
          type: 'body',
          name: '步骤三：进阶优化',
          duration: 0.15,
          content: '进阶技巧、优化方法、个性化设置',
          tips: ['举一反三', '提供选择', '鼓励创新']
        },
        {
          type: 'body',
          name: '步骤四：常见问题',
          duration: 0.12,
          content: '常见问题及解决方案',
          tips: ['预判问题', '提供方案', '总结规律']
        },
        {
          type: 'conclusion',
          name: '成果验收',
          duration: 0.1,
          content: '成果展示、效果对比、使用建议',
          tips: ['前后对比', '强调效果', '延伸应用']
        },
        {
          type: 'cta',
          name: '互动引导',
          duration: 0.1,
          content: '提问答疑、作品分享、进阶内容',
          tips: ['鼓励实践', '征集作品', '预告进阶']
        }
      ]
    },
    style: {
      tone: '耐心细致',
      pace: 'slow',
      formality: 'casual'
    },
    examples: [
      '「零基础也能学会！5分钟掌握PS抠图技巧」',
      '「3步做出餐厅级别的红烧肉，新手必看」'
    ]
  },

  // ===== 知识科普类 =====
  {
    id: 'knowledge-explainer',
    name: '知识科普',
    description: '适合科学知识、历史人文、生活常识等',
    category: 'knowledge',
    tags: ['科普', '知识', '讲解', '教育'],
    structure: {
      sections: [
        {
          type: 'hook',
          name: '悬念引入',
          duration: 0.08,
          content: '用反常识或有趣的事实引入',
          tips: ['打破认知', '制造好奇', '贴近生活']
        },
        {
          type: 'intro',
          name: '问题提出',
          duration: 0.1,
          content: '明确要解答的问题或现象',
          tips: ['清晰明确', '引发思考', '建立框架']
        },
        {
          type: 'body',
          name: '背景知识',
          duration: 0.15,
          content: '必要的背景知识、概念解释',
          tips: ['循序渐进', '类比解释', '避免术语']
        },
        {
          type: 'body',
          name: '原理解析',
          duration: 0.25,
          content: '核心原理、工作机制、科学解释',
          tips: ['深入浅出', '可视化辅助', '逻辑清晰']
        },
        {
          type: 'body',
          name: '实例佐证',
          duration: 0.15,
          content: '实际案例、历史事件、应用场景',
          tips: ['具体生动', '数据支撑', '多角度论证']
        },
        {
          type: 'body',
          name: '延伸拓展',
          duration: 0.12,
          content: '相关知识、发展趋势、未解之谜',
          tips: ['拓展视野', '引发兴趣', '启发思考']
        },
        {
          type: 'conclusion',
          name: '要点回顾',
          duration: 0.08,
          content: '核心要点总结、关键信息回顾',
          tips: ['简明扼要', '强化记忆', '逻辑闭环']
        },
        {
          type: 'cta',
          name: '思考引导',
          duration: 0.07,
          content: '开放问题、延伸阅读、互动讨论',
          tips: ['启发思考', '推荐资源', '鼓励讨论']
        }
      ]
    },
    style: {
      tone: '严谨有趣',
      pace: 'medium',
      formality: 'neutral'
    },
    examples: [
      '「为什么飞机窗户是圆的？这个设计救了无数人的命」',
      '「量子力学到底是什么？5分钟让你不再困惑」'
    ]
  },

  // ===== 故事叙事类 =====
  {
    id: 'story-narrative',
    name: '故事叙事',
    description: '适合个人经历、品牌故事、案例分析等',
    category: 'story',
    tags: ['故事', '叙事', '情感', '经历'],
    structure: {
      sections: [
        {
          type: 'hook',
          name: '情境引入',
          duration: 0.08,
          content: '用场景或冲突引入故事',
          tips: ['营造氛围', '建立共鸣', '设置悬念']
        },
        {
          type: 'intro',
          name: '人物背景',
          duration: 0.1,
          content: '人物介绍、背景设定、关系说明',
          tips: ['简洁有力', '突出特点', '建立情感']
        },
        {
          type: 'body',
          name: '故事开端',
          duration: 0.15,
          content: '事件起因、初始状态、目标设定',
          tips: ['铺垫充分', '动机明确', '引发期待']
        },
        {
          type: 'body',
          name: '发展转折',
          duration: 0.2,
          content: '情节发展、遇到困难、关键转折',
          tips: ['节奏变化', '冲突升级', '情感起伏']
        },
        {
          type: 'body',
          name: '高潮解决',
          duration: 0.18,
          content: '问题解决、高潮时刻、情感释放',
          tips: ['张力十足', '情感饱满', '令人难忘']
        },
        {
          type: 'body',
          name: '结局收尾',
          duration: 0.12,
          content: '故事结局、后续发展、影响意义',
          tips: ['圆满收尾', '留下余韵', '点明主题']
        },
        {
          type: 'conclusion',
          name: '感悟升华',
          duration: 0.1,
          content: '个人感悟、经验总结、价值提炼',
          tips: ['真情实感', '引发共鸣', '传递价值']
        },
        {
          type: 'cta',
          name: '情感互动',
          duration: 0.07,
          content: '邀请分享、情感共鸣、持续关注',
          tips: ['真诚邀请', '情感连接', '建立关系']
        }
      ]
    },
    style: {
      tone: '情感真挚',
      pace: 'medium',
      formality: 'casual'
    },
    examples: [
      '「从负债100万到年入千万，我的创业血泪史」',
      '「那个改变我一生的陌生人，谢谢你」'
    ]
  },

  // ===== 新闻评论类 =====
  {
    id: 'news-commentary',
    name: '新闻评论',
    description: '适合热点事件、社会话题、行业动态等',
    category: 'news',
    tags: ['新闻', '评论', '热点', '观点'],
    structure: {
      sections: [
        {
          type: 'hook',
          name: '热点引入',
          duration: 0.08,
          content: '用最新数据或震撼事实引入',
          tips: ['时效性强', '数据有力', '引发关注']
        },
        {
          type: 'intro',
          name: '事件概述',
          duration: 0.12,
          content: '事件背景、时间线、关键人物',
          tips: ['客观陈述', '信息完整', '条理清晰']
        },
        {
          type: 'body',
          name: '多方观点',
          duration: 0.2,
          content: '不同立场观点、各方反应',
          tips: ['客观呈现', '多方平衡', '避免偏见']
        },
        {
          type: 'body',
          name: '深度分析',
          duration: 0.25,
          content: '深层原因、影响分析、趋势预测',
          tips: ['观点鲜明', '论据充分', '逻辑严密']
        },
        {
          type: 'body',
          name: '案例佐证',
          duration: 0.12,
          content: '类似案例、历史对比、数据支撑',
          tips: ['案例典型', '对比有力', '数据准确']
        },
        {
          type: 'conclusion',
          name: '观点总结',
          duration: 0.1,
          content: '核心观点、价值判断、建议呼吁',
          tips: ['立场明确', '有理有据', '建设性强']
        },
        {
          type: 'cta',
          name: '讨论引导',
          duration: 0.08,
          content: '开放讨论、观点征集、持续关注',
          tips: ['鼓励表达', '理性讨论', '持续关注']
        },
        {
          type: 'cta',
          name: '信息补充',
          duration: 0.05,
          content: '信息来源、更新说明、相关推荐',
          tips: ['信息透明', '及时更新', '延伸推荐']
        }
      ]
    },
    style: {
      tone: '理性客观',
      pace: 'fast',
      formality: 'formal'
    },
    examples: [
      '「XX事件背后：我们忽视了什么？」',
      '「深度解读：这个政策将如何影响你的生活」'
    ]
  },

  // ===== 娱乐搞笑类 =====
  {
    id: 'entertainment-funny',
    name: '娱乐搞笑',
    description: '适合搞笑段子、趣味挑战、娱乐吐槽等',
    category: 'entertainment',
    tags: ['娱乐', '搞笑', '轻松', '趣味'],
    structure: {
      sections: [
        {
          type: 'hook',
          name: '笑点前置',
          duration: 0.1,
          content: '用梗或笑点快速抓住注意力',
          tips: ['节奏快', '包袱响', '出其不意']
        },
        {
          type: 'intro',
          name: '主题引入',
          duration: 0.08,
          content: '主题说明、背景介绍、预期效果',
          tips: ['简洁明了', '制造期待', '铺垫笑点']
        },
        {
          type: 'body',
          name: '内容展开',
          duration: 0.35,
          content: '主要内容、笑点密集、节奏紧凑',
          tips: ['笑点密集', '节奏变化', '出其不意']
        },
        {
          type: 'body',
          name: '高潮反转',
          duration: 0.2,
          content: '意外反转、神展开、高潮笑点',
          tips: ['反转有力', '意料之外', '情理之中']
        },
        {
          type: 'conclusion',
          name: '收尾点睛',
          duration: 0.1,
          content: '总结升华、callback、神回复',
          tips: ['callback', '点睛之笔', '余味悠长']
        },
        {
          type: 'cta',
          name: '互动引导',
          duration: 0.1,
          content: '求赞求关注、征集梗、下期预告',
          tips: ['自然融入', '不尴尬', '期待感']
        }
      ]
    },
    style: {
      tone: '幽默风趣',
      pace: 'fast',
      formality: 'casual'
    },
    examples: [
      '「当我试图在爸妈面前装酷...」',
      '「挑战24小时不说中文，结果...」'
    ]
  },

  // ===== Vlog 记录类 =====
  {
    id: 'vlog-daily',
    name: 'Vlog 日常',
    description: '适合日常生活、旅行记录、工作分享等',
    category: 'vlog',
    tags: ['Vlog', '日常', '记录', '生活'],
    structure: {
      sections: [
        {
          type: 'intro',
          name: '开场问候',
          duration: 0.08,
          content: '打招呼、介绍今天、设定场景',
          tips: ['亲切自然', '快速入题', '建立连接']
        },
        {
          type: 'body',
          name: '场景一',
          duration: 0.2,
          content: '第一个场景/活动、细节展示',
          tips: ['画面丰富', '细节生动', '氛围营造']
        },
        {
          type: 'body',
          name: '场景二',
          duration: 0.2,
          content: '第二个场景/活动、过渡自然',
          tips: ['过渡流畅', '节奏变化', '内容充实']
        },
        {
          type: 'body',
          name: '场景三',
          duration: 0.2,
          content: '第三个场景/活动、高潮部分',
          tips: ['重点突出', '情感丰富', '记忆点']
        },
        {
          type: 'body',
          name: '幕后花絮',
          duration: 0.12,
          content: '幕后故事、搞笑瞬间、真实反应',
          tips: ['真实有趣', '拉近距离', '增加好感']
        },
        {
          type: 'conclusion',
          name: '今日总结',
          duration: 0.1,
          content: '感受分享、收获总结、明日预告',
          tips: ['真情实感', '积极向上', '期待明天']
        },
        {
          type: 'cta',
          name: '互动告别',
          duration: 0.1,
          content: '提问互动、求关注、温馨告别',
          tips: ['自然亲切', '不刻意', '温暖收尾']
        }
      ]
    },
    style: {
      tone: '亲切自然',
      pace: 'medium',
      formality: 'casual'
    },
    examples: [
      '「东京24小时：一个人的美食之旅」',
      '「程序员的一天：除了写代码我还做了什么」'
    ]
  }
];

class ScriptTemplateService {
  /**
   * 获取所有模板
   */
  getAllTemplates(): ScriptTemplate[] {
    return TEMPLATES.map(t => this.convertToScriptTemplate(t));
  }

  /**
   * 按分类获取模板
   */
  getTemplatesByCategory(category: string): ScriptTemplate[] {
    return TEMPLATES
      .filter(t => t.category === category)
      .map(t => this.convertToScriptTemplate(t));
  }

  /**
   * 按标签搜索模板
   */
  searchTemplates(query: string): ScriptTemplate[] {
    const lowerQuery = query.toLowerCase();
    return TEMPLATES
      .filter(t =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
      .map(t => this.convertToScriptTemplate(t));
  }

  /**
   * 获取模板详情
   */
  getTemplateById(id: string): ScriptTemplate | null {
    const template = TEMPLATES.find(t => t.id === id);
    return template ? this.convertToScriptTemplate(template) : null;
  }

  /**
   * 获取推荐模板
   */
  getRecommendedTemplates(videoInfo?: any, preferences?: any): ScriptTemplate[] {
    // 基于视频信息和用户偏好推荐模板
    // 这里简化处理，返回前3个模板
    return TEMPLATES.slice(0, 3).map(t => ({
      ...this.convertToScriptTemplate(t),
      recommended: true
    }));
  }

  /**
   * 获取模板分类
   */
  getCategories(): Array<{ id: string; name: string; count: number }> {
    const categories = TEMPLATES.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryNames: Record<string, string> = {
      product: '产品评测',
      tutorial: '教程教学',
      knowledge: '知识科普',
      story: '故事叙事',
      news: '新闻评论',
      entertainment: '娱乐搞笑',
      vlog: 'Vlog 日常'
    };

    return Object.entries(categories).map(([id, count]) => ({
      id,
      name: categoryNames[id] || id,
      count
    }));
  }

  /**
   * 应用模板生成脚本结构
   */
  applyTemplate(
    templateId: string,
    params: {
      topic: string;
      duration: number;
      keywords?: string[];
      customSections?: any[];
    }
  ): {
    structure: any[];
    metadata: Partial<ScriptMetadata>;
    estimatedDuration: number;
  } {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`模板不存在: ${templateId}`);
    }

    // 计算各段落时长
    const structure = template.structure.sections.map(section => {
      const sectionDuration = Math.round(params.duration * section.duration);
      const wordCount = Math.round(sectionDuration * 150); // 按每分钟150字计算

      return {
        id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: section.type,
        name: section.name,
        duration: sectionDuration,
        targetWordCount: wordCount,
        content: section.content,
        tips: section.tips,
        prompt: this.generateSectionPrompt(section, params.topic, params.keywords)
      };
    });

    return {
      structure,
      metadata: {
        style: template.style.tone,
        template: templateId,
        templateName: template.name
      },
      estimatedDuration: params.duration
    };
  }

  /**
   * 生成段落提示词
   */
  private generateSectionPrompt(
    section: any,
    topic: string,
    keywords?: string[]
  ): string {
    const keywordText = keywords?.length ? `，关键词：${keywords.join('、')}` : '';

    return `为"${topic}"的${section.name}部分生成内容。

要求：
- ${section.content}
- 时长约 ${Math.round(section.duration * 100)}%${keywordText}
- 风格：${section.type === 'hook' ? '抓人眼球' : section.type === 'body' ? '内容丰富' : '简洁有力'}

写作提示：
${section.tips.map((tip: string) => `- ${tip}`).join('\n')}`;
  }

  /**
   * 转换模板格式
   */
  private convertToScriptTemplate(config: TemplateConfig): ScriptTemplate {
    return {
      id: config.id,
      name: config.name,
      description: config.description,
      category: config.category,
      tags: config.tags,
      structure: config.structure.sections.map(s => ({
        type: s.type,
        name: s.name,
        duration: s.duration,
        description: s.content
      })),
      style: {
        tone: config.style.tone,
        pace: config.style.pace,
        formality: config.style.formality
      },
      examples: config.examples,
      recommended: false
    };
  }
}

export const scriptTemplateService = new ScriptTemplateService();
export default scriptTemplateService;

// 导出类型
export type { TemplateConfig };
