/**
 * 视频合成自定义 Hook
 * 职责：封装视频合成的业务逻辑，与 UI 分离
 *
 * 重构说明：
 * - 从原 VideoComposing.tsx (716行) 中提取业务逻辑
 * - 职责单一：管理合成状态、进度和业务调用
 * - 便于测试和复用
 */

import { useState, useCallback } from 'react';
import { voiceSynthesisService } from '@/core/services/ai/voice-synthesis-service';
import { videoEffectService } from '@/core/services/video/video-effect-service';
import { audioVideoSyncService } from '@/core/services/asr/audioSyncService';
import { mixTtsWithVideo } from '@/core/services/video/audioMixService';
import { tauri } from '@/core/tauri';
import { notify } from '@/shared';
import { useTimeout } from '@/hooks/useTimeout';
import { EFFECT_PRESET_MAP } from '../composeConfig';
import type { SynthesizeConfig } from '../composeConfig';
import { DEFAULT_SYNTHESIZE_CONFIG } from '../composeConfig';

// ============================================
// Hook 状态类型
// ============================================
// ============================================
// Hook 操作类型
// ============================================
// ============================================
// Hook 参数
// ============================================

interface SynthesizeParams {
  /** 是否有视频 */
  hasVideo: boolean;
  /** 当前脚本内容 */
  scriptContent: string;
  /** 当前视频路径 */
  videoPath?: string;
  /** 当前配音 URL */
  voiceUrl?: string;
  /** 进度回调 */
  onProgress?: (progress: number) => void;
  /** 完成回调 */
  onComplete?: (finalVideoPath: string) => void;
}

// ============================================
// 自定义 Hook
// ============================================

/**
 * 视频合成 Hook
 * @returns 状态和操作方法
 */
export function useVideoSynthesize() {
  const [synthesizing, setSynthesizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [config, setConfig] = useState<SynthesizeConfig>(DEFAULT_SYNTHESIZE_CONFIG);
  const timeout = useTimeout();

  /**
   * 更新配置
   * @param updates 部分配置更新
   */
  const updateConfig = useCallback((updates: Partial<SynthesizeConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * 生成配音
   * @param scriptContent 脚本内容
   * @returns 配音结果
   */
  const generateVoice = useCallback(
    async (scriptContent: string) => {
      if (!scriptContent) {
        notify.warning('请先生成文案');
        return null;
      }

      try {
        const voiceResult = await voiceSynthesisService.synthesize(
          scriptContent,
          {
            voice: config.voiceId,
            rate: config.voiceSpeed / 100,
            volume: config.voiceVolume / 100,
          },
          (p: { progress: number }) => {
            setProgress(Math.round(p.progress));
          }
        );

        notify.success('配音生成成功！');
        return voiceResult;
      } catch (error) {
        notify.error(error, '配音生成失败');
        return null;
      }
    },
    [config.voiceId, config.voiceSpeed, config.voiceVolume]
  );

  /**
   * 校验合成输入
   * @param params 合成参数
   * @returns 是否通过校验
   */
  const validateSynthesizeInput = useCallback(
    (params: SynthesizeParams): boolean => {
      if (!params.hasVideo) {
        notify.warning('请先上传视频');
        return false;
      }
      if (!params.scriptContent && config.enableVoice) {
        notify.warning('请先生成文案');
        return false;
      }
      return true;
    },
    [config.enableVoice]
  );

  /**
   * 确保语音已生成
   * @param params 合成参数
   * @returns 是否就绪
   */
  const ensureVoiceGenerated = useCallback(
    async (params: SynthesizeParams): Promise<boolean> => {
      if (!config.enableVoice) return true;
      if (params.voiceUrl) return true;

      const result = await generateVoice(params.scriptContent);
      return result !== null;
    },
    [config.enableVoice, generateVoice]
  );

  /**
   * 应用视频特效
   * @param onProgress 进度回调
   */
  const applyVideoEffect = useCallback(
    async (onProgress?: (p: number) => void): Promise<void> => {
      if (!config.enableEffect) return;
      onProgress?.(60);

      const presetId = EFFECT_PRESET_MAP[config.effectStyle];
      if (presetId) {
        await videoEffectService.applyPreset(presetId);
      } else {
        await videoEffectService.reset();
      }
    },
    [config.enableEffect, config.effectStyle]
  );

  /**
   * 混音 TTS 配音到视频
   * @param params 合成参数
   * @param onProgress 进度回调
   * @returns 混音后的视频路径
   */
  const mixAudioIfNeeded = useCallback(
    async (params: SynthesizeParams, onProgress?: (p: number) => void): Promise<string | null> => {
      if (!config.enableVoice || !params.voiceUrl || !params.videoPath) {
        return null;
      }
      onProgress?.(75);

      // 提取：获取导出目录（已提取为独立工具函数职责）
      const outputDir = await tauri.getExportDir().catch(() => '');
      const outputPath = outputDir
        ? `${outputDir}/mix_${Date.now()}.mp4`
        : `${params.videoPath.replace(/\.[^.]+$/, '')}_mixed.mp4`;

      // 音视频同步检测
      const syncResult = await audioVideoSyncService.autoSync(
        params.videoPath,
        params.voiceUrl
      ).catch(() => null);

      if (!syncResult) {
        notify.warning('音视频同步检测失败，将使用默认偏移');
      }

      const offsetSeconds = syncResult?.offset ? syncResult.offset / 1000 : 0;

      // 执行混音
      const mixed = await mixTtsWithVideo({
        ttsAudioPath: params.voiceUrl,
        videoPath: params.videoPath,
        outputPath,
        ttsVolume: config.voiceVolume / 100,
        backgroundVolume: 0.3,
        offset: offsetSeconds,
      });

      return mixed.outputPath;
    },
    [config.enableVoice, config.voiceVolume]
  );

  /**
   * 执行视频合成
   * @param params 合成参数
   * @returns 是否成功
   */
  const synthesize = useCallback(
    async (params: SynthesizeParams): Promise<boolean> => {
      // 1. 校验输入
      if (!validateSynthesizeInput(params)) return false;

      setSynthesizing(true);
      setProgress(0);

      const onProgress = params.onProgress || setProgress;

      try {
        // 2. 确保语音已生成
        onProgress(20);
        const voiceReady = await ensureVoiceGenerated(params);
        if (!voiceReady) {
          setSynthesizing(false);
          return false;
        }

        // 3. 应用视频特效
        if (config.enableSubtitle) onProgress(40);
        await applyVideoEffect(onProgress);

        // 4. 混音
        const mixedVideoPath = await mixAudioIfNeeded(params, onProgress);

        if (!params.videoPath) {
          setSynthesizing(false);
          return false;
        }

        // 5. 完成
        onProgress(100);
        const finalVideoPath: string =
          mixedVideoPath || `${params.videoPath}?synthesized=${Date.now()}`;

        params.onComplete?.(finalVideoPath);

        return true;
      } catch (error) {
        notify.error(error, '视频合成失败');
        return false;
      } finally {
        setSynthesizing(false);
      }
    },
    [
      validateSynthesizeInput,
      ensureVoiceGenerated,
      applyVideoEffect,
      mixAudioIfNeeded,
      config.enableSubtitle,
    ]
  );

  return {
    // 状态
    synthesizing,
    progress,
    config,
    // 操作
    updateConfig,
    generateVoice,
    synthesize,
    // 工具
    timeout,
  };
}
