/**
 * Mock Provider — 用于测试
 */
import type { RequestConfig, AIResponse } from './types';

export async function mockCall(config: RequestConfig): Promise<AIResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    content: `这是一个模拟生成的脚本内容。

【开场】
大家好！今天我们要聊的是一个非常有趣的话题。

【主体内容】
首先，让我们了解一下基本概念。这个话题涉及很多方面，包括：
1. 核心原理
2. 实际应用
3. 注意事项

【总结】
希望大家喜欢这个视频，有任何问题欢迎在评论区留言！

感谢观看，我们下期再见！`,
    usage: { prompt_tokens: 500, completion_tokens: 300, total_tokens: 800 },
    model: config.model,
  };
}
