/**
 * 成本追踪服务
 * 监控和优化 LLM/视频生成成本
 */

import { LLM_MODELS } from '@/core/constants';

// 成本记录
export interface CostRecord {
  id: string;
  type: 'llm' | 'video' | 'audio' | 'storage';
  provider: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  cost: number; // USD
  duration?: number; // ms
  timestamp: string;
  metadata?: Record<string, any>;
}

// 成本统计
export interface CostStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byType: Record<string, number>;
  byProvider: Record<string, number>;
  byModel: Record<string, number>;
}

// 成本预算
export interface CostBudget {
  daily: number;
  weekly: number;
  monthly: number;
  alerts: {
    daily: number; // 百分比阈值
    weekly: number;
    monthly: number;
  };
}

// 模型成本配置 (USD per 1K tokens)
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-5': { input: 0.005, output: 0.015 },
  'gpt-5-mini': { input: 0.0005, output: 0.0015 },

  // Anthropic
  'claude-4-sonnet': { input: 0.003, output: 0.015 },
  'claude-4-opus': { input: 0.015, output: 0.075 },

  // 百度
  'ernie-5.0': { input: 0.0012, output: 0.0012 },
  'ernie-speed': { input: 0.0001, output: 0.0001 },

  // 阿里
  'qwen3.5-max': { input: 0.002, output: 0.006 },
  'qwen3.5-plus': { input: 0.0008, output: 0.002 },
  'qwen3.5-turbo': { input: 0.0003, output: 0.0006 },

  // 月之暗面
  'kimi-k2.5': { input: 0.001, output: 0.003 },

  // 智谱
  'glm-5': { input: 0.001, output: 0.003 },

  // MiniMax
  'minimax-m2.5': { input: 0.001, output: 0.003 }
};

// 视频生成成本 (USD per minute)
const VIDEO_COSTS: Record<string, number> = {
  'vidu': 0.5,
  'seedance': 0.4,
  'kling': 0.3,
  'local': 0 // 本地免费
};

class CostService {
  private records: CostRecord[] = [];
  private budget: CostBudget = {
    daily: 50,
    weekly: 300,
    monthly: 1000,
    alerts: {
      daily: 80,
      weekly: 80,
      monthly: 80
    }
  };
  private listeners: Set<(stats: CostStats) => void> = new Set();

  /**
   * 记录 LLM 成本
   */
  recordLLMCost(
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    metadata?: Record<string, any>
  ): CostRecord {
    const costConfig = MODEL_COSTS[model] || { input: 0.001, output: 0.003 };
    const cost = (inputTokens / 1000) * costConfig.input +
                 (outputTokens / 1000) * costConfig.output;

    const record: CostRecord = {
      id: `llm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'llm',
      provider,
      model,
      inputTokens,
      outputTokens,
      cost,
      timestamp: new Date().toISOString(),
      metadata
    };

    this.records.push(record);
    this.checkBudgetAlert();
    this.notifyListeners();

    return record;
  }

  /**
   * 记录视频生成成本
   */
  recordVideoCost(
    provider: string,
    duration: number, // seconds
    resolution: string,
    metadata?: Record<string, any>
  ): CostRecord {
    const costPerMinute = VIDEO_COSTS[provider] || 0.5;
    const cost = (duration / 60) * costPerMinute;

    const record: CostRecord = {
      id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'video',
      provider,
      cost,
      duration: duration * 1000,
      timestamp: new Date().toISOString(),
      metadata: { ...metadata, resolution }
    };

    this.records.push(record);
    this.checkBudgetAlert();
    this.notifyListeners();

    return record;
  }

  /**
   * 获取成本统计
   */
  getStats(): CostStats {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats: CostStats = {
      total: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      byType: {},
      byProvider: {},
      byModel: {}
    };

    for (const record of this.records) {
      const recordDate = new Date(record.timestamp);
      const cost = record.cost;

      stats.total += cost;
      stats.byType[record.type] = (stats.byType[record.type] || 0) + cost;
      stats.byProvider[record.provider] = (stats.byProvider[record.provider] || 0) + cost;

      if (record.model) {
        stats.byModel[record.model] = (stats.byModel[record.model] || 0) + cost;
      }

      if (recordDate >= today) {
        stats.today += cost;
      }
      if (recordDate >= weekAgo) {
        stats.thisWeek += cost;
      }
      if (recordDate >= monthAgo) {
        stats.thisMonth += cost;
      }
    }

    return stats;
  }

  /**
   * 检查预算告警
   */
  private checkBudgetAlert(): void {
    const stats = this.getStats();

    const dailyPercent = (stats.today / this.budget.daily) * 100;
    const weeklyPercent = (stats.thisWeek / this.budget.weekly) * 100;
    const monthlyPercent = (stats.thisMonth / this.budget.monthly) * 100;

    if (dailyPercent >= this.budget.alerts.daily) {
      console.warn(`⚠️ 日预算告警: ${dailyPercent.toFixed(1)}%`);
    }
    if (weeklyPercent >= this.budget.alerts.weekly) {
      console.warn(`⚠️ 周预算告警: ${weeklyPercent.toFixed(1)}%`);
    }
    if (monthlyPercent >= this.budget.alerts.monthly) {
      console.warn(`⚠️ 月预算告警: ${monthlyPercent.toFixed(1)}%`);
    }
  }

  /**
   * 设置预算
   */
  setBudget(budget: Partial<CostBudget>): void {
    this.budget = { ...this.budget, ...budget };
  }

  /**
   * 获取预算
   */
  getBudget(): CostBudget {
    return this.budget;
  }

  /**
   * 获取模型建议
   */
  getModelSuggestion(
    taskComplexity: 'simple' | 'standard' | 'complex' | 'creative',
    budgetConstraint?: 'low' | 'medium' | 'high'
  ): { model: string; provider: string; estimatedCost: number } {
    const suggestions: Record<string, Array<{ model: string; provider: string; cost: number }>> = {
      simple: [
        { model: 'qwen3.5-turbo', provider: 'alibaba', cost: 0.0003 },
        { model: 'ernie-speed', provider: 'baidu', cost: 0.0001 },
        { model: 'kimi-k2.5', provider: 'moonshot', cost: 0.001 }
      ],
      standard: [
        { model: 'qwen3.5-plus', provider: 'alibaba', cost: 0.0008 },
        { model: 'kimi-k2.5', provider: 'moonshot', cost: 0.001 },
        { model: 'glm-5', provider: 'zhipu', cost: 0.001 }
      ],
      complex: [
        { model: 'qwen3.5-max', provider: 'alibaba', cost: 0.002 },
        { model: 'gpt-5', provider: 'openai', cost: 0.005 },
        { model: 'claude-4-sonnet', provider: 'anthropic', cost: 0.003 }
      ],
      creative: [
        { model: 'kimi-k2.5', provider: 'moonshot', cost: 0.001 },
        { model: 'claude-4-sonnet', provider: 'anthropic', cost: 0.003 },
        { model: 'gpt-5', provider: 'openai', cost: 0.005 }
      ]
    };

    const options = suggestions[taskComplexity] || suggestions.standard;

    if (budgetConstraint === 'low') {
      const cheapest = options.reduce((min, curr) => curr.cost < min.cost ? curr : min);
      return { ...cheapest, estimatedCost: cheapest.cost };
    }

    if (budgetConstraint === 'high') {
      const best = options[options.length - 1];
      return { ...best, estimatedCost: best.cost };
    }

    // 默认选择平衡的
    const balanced = options[Math.floor(options.length / 2)];
    return { ...balanced, estimatedCost: balanced.cost };
  }

  /**
   * 获取成本优化建议
   */
  getOptimizationSuggestions(): string[] {
    const stats = this.getStats();
    const suggestions: string[] = [];

    // 分析成本分布
    const llmCost = stats.byType['llm'] || 0;
    const videoCost = stats.byType['video'] || 0;
    const totalCost = stats.total;

    if (totalCost === 0) return ['暂无成本数据，开始使用后会生成优化建议'];

    // LLM 成本占比过高
    if (llmCost / totalCost > 0.6) {
      suggestions.push('💡 LLM 成本占比超过 60%，建议：\n' +
        '  - 启用响应缓存\n' +
        '  - 使用模型分级策略（简单任务用 Turbo 模型）\n' +
        '  - 压缩提示词长度');
    }

    // 视频成本占比过高
    if (videoCost / totalCost > 0.3) {
      suggestions.push('💡 视频生成成本较高，建议：\n' +
        '  - 使用智能参数选择\n' +
        '  - 优先使用本地生成\n' +
        '  - 降低分辨率和帧率');
    }

    // 检查高成本模型使用
    const highCostModels = ['gpt-5', 'claude-4-opus', 'qwen3.5-max'];
    for (const model of highCostModels) {
      if (stats.byModel[model] && stats.byModel[model] > totalCost * 0.3) {
        suggestions.push(`💡 ${model} 使用成本较高，建议评估是否可以降级到 Plus 或 Turbo 模型`);
      }
    }

    return suggestions.length > 0 ? suggestions : ['✅ 成本结构良好，暂无优化建议'];
  }

  /**
   * 导出成本报告
   */
  exportReport(): string {
    const stats = this.getStats();
    const suggestions = this.getOptimizationSuggestions();

    return `
# ClipFlow 成本报告

生成时间: ${new Date().toLocaleString('zh-CN')}

## 成本概览

| 周期 | 成本 (USD) | 占比 |
|------|-----------|------|
| 今日 | $${stats.today.toFixed(2)} | ${((stats.today / this.budget.daily) * 100).toFixed(1)}% |
| 本周 | $${stats.thisWeek.toFixed(2)} | ${((stats.thisWeek / this.budget.weekly) * 100).toFixed(1)}% |
| 本月 | $${stats.thisMonth.toFixed(2)} | ${((stats.thisMonth / this.budget.monthly) * 100).toFixed(1)}% |
| 总计 | $${stats.total.toFixed(2)} | - |

## 成本分布

### 按类型
${Object.entries(stats.byType).map(([type, cost]) => `- ${type}: $${cost.toFixed(2)}`).join('\n')}

### 按提供商
${Object.entries(stats.byProvider).map(([provider, cost]) => `- ${provider}: $${cost.toFixed(2)}`).join('\n')}

### 按模型
${Object.entries(stats.byModel).map(([model, cost]) => `- ${model}: $${cost.toFixed(2)}`).join('\n')}

## 优化建议

${suggestions.join('\n\n')}

---
*报告由 ClipFlow 成本追踪服务生成*
    `.trim();
  }

  /**
   * 订阅统计更新
   */
  subscribe(listener: (stats: CostStats) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知订阅者
   */
  private notifyListeners(): void {
    const stats = this.getStats();
    this.listeners.forEach(listener => listener(stats));
  }

  /**
   * 清空记录
   */
  clear(): void {
    this.records = [];
    this.notifyListeners();
  }

  /**
   * 持久化到本地存储
   */
  saveToStorage(): void {
    try {
      localStorage.setItem('reelforge_cost_records', JSON.stringify(this.records));
      localStorage.setItem('reelforge_cost_budget', JSON.stringify(this.budget));
    } catch (error) {
      console.error('保存成本记录失败:', error);
    }
  }

  /**
   * 从本地存储加载
   */
  loadFromStorage(): boolean {
    try {
      const records = localStorage.getItem('reelforge_cost_records');
      const budget = localStorage.getItem('reelforge_cost_budget');

      if (records) {
        this.records = JSON.parse(records);
      }
      if (budget) {
        this.budget = JSON.parse(budget);
      }

      return true;
    } catch (error) {
      console.error('加载成本记录失败:', error);
      return false;
    }
  }
}

// 导出单例
export const costService = new CostService();
export default CostService;

// 导出类型
export type { CostRecord, CostStats, CostBudget };
