import axios from 'axios';
import { getApiKey } from './tauriService';
import { VideoAnalysis, Script, ScriptSegment } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// OpenAI API客户端
const createOpenAIClient = async () => {
  const apiKey = await getApiKey('openai');
  
  if (!apiKey) {
    throw new Error('缺少OpenAI API密钥，请在设置中配置');
  }
  
  return axios.create({
    baseURL: 'https://api.openai.com/v1',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  });
};

// 分析视频内容
export const analyzeVideoContent = async (videoAnalysis: VideoAnalysis): Promise<VideoAnalysis> => {
  try {
    const client = await createOpenAIClient();
    
    // 构建提示
    const prompt = `
      分析以下视频内容:
      
      标题: ${videoAnalysis.title}
      时长: ${videoAnalysis.duration}秒
      
      关键时刻:
      ${videoAnalysis.keyMoments.map(moment => 
        `- 时间点: ${moment.timestamp}秒, 描述: ${moment.description}`
      ).join('\n')}
      
      请为这段视频提供更详细的分析，包括情绪变化、叙事结构、建议主题等。
    `;
    
    const response = await client.post('/chat/completions', {
      model: 'gpt-5.2',
      messages: [
        { role: 'system', content: '你是一位专业的视频分析师和脚本撰写专家' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    });
    
    const analysis = response.data.choices[0].message.content;
    
    // 更新分析结果
    return {
      ...videoAnalysis,
      summary: videoAnalysis.summary + '\n\nAI分析:\n' + analysis
    };
  } catch (error) {
    console.error('视频内容分析失败:', error);
    throw error;
  }
};

// 生成视频脚本
export const generateScript = async (
  videoAnalysis: VideoAnalysis,
  style: string = '简洁专业'
): Promise<Script> => {
  try {
    const client = await createOpenAIClient();
    
    // 构建提示
    const prompt = `
      请根据以下视频分析为我生成一个${style}风格的解说脚本:
      
      视频标题: ${videoAnalysis.title}
      时长: ${videoAnalysis.duration}秒
      
      摘要: ${videoAnalysis.summary}
      
      关键时刻:
      ${videoAnalysis.keyMoments.map(moment => 
        `- 时间点: ${moment.timestamp}秒, 描述: ${moment.description}, 重要性: ${moment.importance}/10`
      ).join('\n')}
      
      情绪变化:
      ${videoAnalysis.emotions.map(emotion => 
        `- 时间点: ${emotion.timestamp}秒, 情绪: ${emotion.type}, 强度: ${emotion.intensity}`
      ).join('\n')}
      
      请生成一个分段的脚本，每个片段包含开始时间、结束时间和对应的解说文本。脚本应该与视频内容紧密匹配，并突出关键时刻。
      脚本语言风格应该是${style}的。
    `;
    
    const response = await client.post('/chat/completions', {
      model: 'gpt-5.2',
      messages: [
        { role: 'system', content: '你是一位专业的视频脚本撰写专家，擅长生成引人入胜、精确的视频解说脚本。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    });
    
    const scriptContent = response.data.choices[0].message.content;
    
    // 解析AI生成的脚本内容为结构化数据
    const segments = parseScriptContent(scriptContent, videoAnalysis.id);
    
    // 创建脚本对象
    return {
      id: uuidv4(),
      videoId: videoAnalysis.id,
      content: segments,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('脚本生成失败:', error);
    throw error;
  }
};

// 解析AI生成的脚本文本为结构化数据
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const parseScriptContent = (content: string, _videoId: string): ScriptSegment[] => {
  const segments: ScriptSegment[] = [];
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  
  let currentSegment: Partial<ScriptSegment> = {};
  
  for (const line of lines) {
    // 尝试匹配时间戳格式 "[00:10 - 00:30]" 或类似格式
    const timeRegex = /\[(\d+):?(\d*)\s*-\s*(\d+):?(\d*)\]/;
    const timeMatch = line.match(timeRegex);
    
    if (timeMatch) {
      // 如果已有一个处理中的片段，保存它
      if (currentSegment.content) {
        segments.push({
          id: uuidv4(),
          startTime: currentSegment.startTime || 0,
          endTime: currentSegment.endTime || 0,
          content: currentSegment.content,
          type: currentSegment.type || 'narration'
        });
      }
      
      // 解析时间戳
      const startMin = parseInt(timeMatch[1]) || 0;
      const startSec = parseInt(timeMatch[2]) || 0;
      const endMin = parseInt(timeMatch[3]) || 0;
      const endSec = parseInt(timeMatch[4]) || 0;
      
      // 创建新片段
      currentSegment = {
        startTime: startMin * 60 + startSec,
        endTime: endMin * 60 + endSec,
        content: '',
        type: 'narration'
      };
    } else if (currentSegment.startTime !== undefined) {
      // 添加内容到当前片段
      if (currentSegment.content) {
        currentSegment.content += ' ' + line.trim();
      } else {
        currentSegment.content = line.trim();
      }
    }
  }
  
  // 处理最后一个片段
  if (currentSegment.content) {
    segments.push({
      id: uuidv4(),
      startTime: currentSegment.startTime || 0,
      endTime: currentSegment.endTime || 0,
      content: currentSegment.content,
      type: currentSegment.type || 'narration'
    });
  }
  
  return segments;
};

// 优化脚本
export const polishScript = async (script: Script, style: string): Promise<Script> => {
  try {
    const client = await createOpenAIClient();
    
    // 构建提示
    const segmentsText = script.content.map(segment => 
      `[${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}] ${segment.content}`
    ).join('\n\n');
    
    const prompt = `
      请帮我优化以下视频解说脚本，使其更加${style}:
      
      ${segmentsText}
      
      请保持相同的时间戳结构，只修改内容使其更加${style}，更加引人入胜。
    `;
    
    const response = await client.post('/chat/completions', {
      model: 'gpt-5.2',
      messages: [
        { role: 'system', content: '你是一位专业的视频脚本优化专家，擅长改进脚本质量并保持原有结构。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    });
    
    const polishedContent = response.data.choices[0].message.content;
    
    // 解析优化后的脚本
    const polishedSegments = parseScriptContent(polishedContent, script.videoId);
    
    // 创建优化后的脚本
    return {
      ...script,
      content: polishedSegments,
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('脚本优化失败:', error);
    throw error;
  }
};

// 格式化时间 (秒 -> mm:ss)
const formatTime = (seconds: number): string => {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}; 