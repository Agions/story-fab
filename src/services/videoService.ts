import { invoke } from '@tauri-apps/api/tauri';
import { message } from 'antd';
import { v4 as uuidv4 } from 'uuid';

/**
 * 检查FFmpeg是否已安装
 * @returns 包含安装状态和版本信息的对象
 */
export const checkFFmpegInstallation = async (): Promise<{installed: boolean; version?: string}> => {
  try {
    const result = await invoke('check_ffmpeg') as {installed: boolean; version?: string};
    return result;
  } catch (error) {
    console.error('检查FFmpeg安装状态失败:', error);
    return {installed: false};
  }
};

/**
 * 确保FFmpeg已安装，如果未安装则显示提示
 * @returns 是否已安装FFmpeg
 */
export const ensureFFmpegInstalled = async (): Promise<boolean> => {
  const { installed, version } = await checkFFmpegInstallation();
  
  if (!installed) {
    message.error('操作失败：未检测到FFmpeg，请先安装FFmpeg后再试');
    return false;
  }
  
  console.log('FFmpeg已安装:', version);
  return true;
};

/**
 * 视频元数据接口
 */
export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
}

export interface KeyFrame {
  id: string;
  timestamp: number;
  path: string;
  description?: string;
}

/**
 * 分析视频文件并返回视频元数据
 * @param videoPath 视频文件路径
 * @returns 视频元数据
 */
export const analyzeVideo = async (videoPath: string): Promise<VideoMetadata> => {
  try {
    if (!videoPath) {
      throw new Error('视频路径不能为空');
    }
    
    // 先检查FFmpeg是否已安装
    if (!(await ensureFFmpegInstalled())) {
      throw new Error('未安装FFmpeg');
    }

    console.log('分析视频:', videoPath);
    const metadata = await invoke('analyze_video', { path: videoPath });
    console.log('视频分析结果:', metadata);
    
    return metadata as VideoMetadata;
  } catch (error) {
    console.error('分析视频失败:', error);
    let userMessage = '视频分析失败，请稍后再试';

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('未安装FFmpeg')) {
      userMessage = '分析失败：未检测到 FFmpeg，请确保已正确安装并配置到系统 PATH。';
    } else if (errorMessage.includes('运行ffprobe失败')) {
       userMessage = '分析失败：无法执行 ffprobe 命令，请检查 FFmpeg 是否完整安装。';
    } else if (errorMessage.includes('ffprobe命令执行失败')) {
       userMessage = '分析失败：ffprobe 执行出错，可能是视频文件损坏或格式不支持。';
    } else if (errorMessage.includes('解析JSON失败')) {
      userMessage = '分析失败：无法解析视频元数据。';
    } else if (errorMessage.includes('无法获取视频流信息') || errorMessage.includes('未找到视频流')) {
      userMessage = '分析失败：无法识别视频流信息。';
    } else if (errorMessage.includes('路径不能为空')) {
      userMessage = '错误：视频路径无效。';
    }

    message.error(userMessage);
    throw new Error(userMessage);
  }
};

/**
 * 从视频中提取关键帧
 * @param videoPath 视频文件路径
 * @param options 选项 (间隔秒数，最大帧数等)
 * @returns 关键帧数组
 */
export const extractKeyFrames = async (
  videoPath: string, 
  options: { interval?: number; maxFrames?: number } = {}
): Promise<KeyFrame[]> => {
  try {
    if (!videoPath) {
      throw new Error('视频路径不能为空');
    }
    
    // 先检查FFmpeg是否已安装
    if (!(await ensureFFmpegInstalled())) {
      throw new Error('未安装FFmpeg');
    }

    const { interval = 10, maxFrames = 10 } = options;
    console.log(`提取关键帧: ${videoPath}, 间隔: ${interval}秒, 最大帧数: ${maxFrames}`);

    const framePaths = await invoke('extract_key_frames', { 
      path: videoPath,
      count: maxFrames
    }) as string[];

    // 转换为关键帧对象
    const keyFrames: KeyFrame[] = framePaths.map((path, index) => ({
      id: uuidv4(),
      timestamp: index * interval,
      path,
      description: ''
    }));

    console.log(`成功提取了 ${keyFrames.length} 个关键帧`);
    return keyFrames;
  } catch (error) {
    console.error('提取关键帧失败:', error);
    let userMessage = '提取关键帧失败，请确保视频文件可访问且FFmpeg已安装';
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('未安装FFmpeg')) {
      userMessage = '提取关键帧失败：未检测到 FFmpeg，请确保已正确安装并配置到系统 PATH。';
    }
    
    message.error(userMessage);
    throw error;
  }
};

/**
 * 从视频生成缩略图
 * @param videoPath 视频文件路径
 * @param time 缩略图时间点(秒)
 * @returns 缩略图路径
 */
export const generateThumbnail = async (
  videoPath: string, 
  time: number = 1
): Promise<string> => {
  try {
    if (!videoPath) {
      throw new Error('视频路径不能为空');
    }
    
    // 先检查FFmpeg是否已安装
    if (!(await ensureFFmpegInstalled())) {
      throw new Error('未安装FFmpeg');
    }

    console.log(`生成视频缩略图: ${videoPath}, 时间点: ${time}秒`);
    const thumbnailPath = await invoke('generate_thumbnail', { 
      path: videoPath
    }) as string;

    console.log('缩略图生成成功:', thumbnailPath);
    return thumbnailPath;
  } catch (error) {
    console.error('生成缩略图失败:', error);
    let userMessage = '生成缩略图失败，请确保视频文件可访问且FFmpeg已安装';
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('未安装FFmpeg')) {
      userMessage = '生成缩略图失败：未检测到 FFmpeg，请确保已正确安装并配置到系统 PATH。';
    }
    
    message.error(userMessage);
    throw error;
  }
};

/**
 * 视频片段接口
 */
export interface VideoSegment {
  start: number;
  end: number;
  type?: string;
  content?: string;
}

/**
 * 剪辑视频
 * @param inputPath 输入视频路径 
 * @param outputPath 输出视频路径 
 * @param segments 视频片段数组
 * @param options 剪辑选项
 * @returns 是否剪辑成功
 */
export const cutVideo = async (
  inputPath: string, 
  outputPath: string, 
  segments: VideoSegment[],
  options?: {
    quality?: string,
    format?: string,
    transition?: string,
    transitionDuration?: number,
    volume?: number,
    addSubtitles?: boolean
  }
): Promise<boolean> => {
  try {
    // 先检查FFmpeg是否已安装
    if (!(await ensureFFmpegInstalled())) {
      throw new Error('未安装FFmpeg');
    }
    
    console.log('开始剪辑视频:', inputPath, '输出:', outputPath);
    console.log('片段:', segments);
    console.log('选项:', options);
    
    await invoke('cut_video', {
      input_path: inputPath,
      output_path: outputPath,
      segments,
      quality: options?.quality,
      format: options?.format,
      transition: options?.transition,
      transition_duration: options?.transitionDuration,
      volume: options?.volume,
      add_subtitles: options?.addSubtitles
    });
    
    console.log('视频剪辑完成');
    message.success('视频剪辑完成');
    return true;
  } catch (error) {
    console.error('视频剪辑失败:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : String(error);
      
    // 用户友好的错误信息
    let friendlyMessage = '视频剪辑失败';
    if (errorMessage.includes('未安装FFmpeg')) {
      friendlyMessage = '剪辑失败：未检测到 FFmpeg，请确保已正确安装并配置到系统 PATH。';
    }
    
    message.error(friendlyMessage);
    throw new Error(friendlyMessage);
  }
};

/**
 * 预览指定片段
 * @param inputPath 输入视频路径
 * @param segment 要预览的片段
 * @param options 预览选项
 * @returns 临时预览文件路径
 */
export const previewSegment = async (
  inputPath: string,
  segment: VideoSegment,
  options?: {
    transition?: string,
    transitionDuration?: number,
    volume?: number,
    addSubtitles?: boolean
  }
): Promise<string> => {
  try {
    // 先检查FFmpeg是否已安装
    if (!(await ensureFFmpegInstalled())) {
      throw new Error('未安装FFmpeg');
    }
    
    console.log('预览片段:', segment);
    
    // 修正函数名称，确保与Rust函数名匹配
    const previewPath = await invoke<string>('generate_preview', {
      input_path: inputPath,
      segment,
      transition: options?.transition,
      transition_duration: options?.transitionDuration,
      volume: options?.volume,
      add_subtitles: options?.addSubtitles
    });
    
    console.log('预览文件路径:', previewPath);
    return previewPath;
  } catch (error) {
    console.error('生成预览失败:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : String(error);
      
    let friendlyMessage = '生成预览失败';
    if (errorMessage.includes('未安装FFmpeg')) {
      friendlyMessage = '预览失败：未检测到 FFmpeg，请确保已正确安装并配置到系统 PATH。';
    }
    
    message.error(friendlyMessage);
    throw new Error(friendlyMessage);
  }
};

/**
 * 格式化视频时长为人类可读格式
 * @param durationInSeconds 时长（秒）
 * @returns 格式化后的时长字符串（如 01:23:45）
 */
export const formatDuration = (durationInSeconds: number): string => {
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = Math.floor(durationInSeconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
};

/**
 * 格式化分辨率为人类可读格式
 * @param width 宽度
 * @param height 高度
 * @returns 格式化后的分辨率字符串（如 1920x1080）
 */
export const formatResolution = (width: number, height: number): string => {
  // 常见分辨率别名
  if (width === 3840 && height === 2160) {
    return `${width}x${height} (4K UHD)`;
  } else if (width === 2560 && height === 1440) {
    return `${width}x${height} (2K QHD)`;
  } else if (width === 1920 && height === 1080) {
    return `${width}x${height} (1080p)`;
  } else if (width === 1280 && height === 720) {
    return `${width}x${height} (720p)`;
  } else if (width === 720 && height === 480) {
    return `${width}x${height} (480p)`;
  } else {
    return `${width}x${height}`;
  }
}; 