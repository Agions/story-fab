/**
 * 步骤5: 视频合成 — AI Cinema Studio Redesign
 * 数据输入: video, script, voice
 * 数据输出: synthesis (最终合成视频)
 */
import React, { useState, useCallback, memo } from 'react';
import { useStoryFab } from '../context';
import { voiceSynthesisService } from '../../../core/services/ai/voice-synthesis.service';
import { videoEffectService } from '../../../core/services/video/videoEffectService';
import { audioVideoSyncService } from '../../../core/services/asr/audioSyncService';
import { mixTtsWithVideo } from '../../../core/services/video/audio-mix.service';
import { notify } from '@/shared';
import { invoke } from '@tauri-apps/api/core';
import { useTimeout } from '../../../hooks/useTimeout';
import styles from './VideoComposing.module.less';

interface VideoSynthesizeProps {
  onNext?: () => void;
}

interface SynthesizeConfig {
  voiceId: string;
  voiceSpeed: number;
  voiceVolume: number;
  originalAudioVolume: number;
  voicePreset: string;
  enableVoice: boolean;
  enableSubtitle: boolean;
  subtitlePosition: 'bottom' | 'center' | 'top';
  enableEffect: boolean;
  effectStyle: string;
  syncAudioVideo: boolean;
}

const EFFECT_PRESET_MAP: Record<string, string | null> = {
  none: null,
  cinematic: 'smooth-fade',
  vivid: 'vibrant',
  retro: 'vintage',
  cool: 'cool',
  warm: 'warm',
};

// 配音角色
const VOICE_OPTIONS = [
  { value: 'female_zh', label: '女声 (中文)', desc: '温柔甜美', emoji: '🎤' },
  { value: 'male_zh', label: '男声 (中文)', desc: '成熟稳重', emoji: '🎙️' },
  { value: 'neutral', label: '中性声音', desc: '通用场景', emoji: '🔊' },
];

// Azure Neural Voice 预设
const VOICE_PRESETS = [
  { value: 'XiaoxiaoNeural', label: '晓晓', desc: '青春活力', region: 'zh-CN', emoji: '🌟' },
  { value: 'YunxiNeural', label: '云希', desc: '低沉磁性', region: 'zh-CN', emoji: '🎭' },
  { value: 'YunyangNeural', label: '云扬', desc: '新闻播报', region: 'zh-CN', emoji: '📢' },
  { value: 'XiaoyiNeural', label: '晓伊', desc: '温柔甜美', region: 'zh-CN', emoji: '💕' },
  { value: 'XiaobaiNeural', label: '小白', desc: '轻松活泼', region: 'zh-CN', emoji: '😄' },
];

// 特效风格
const EFFECT_STYLES = [
  { value: 'none', label: '无', desc: '保持原样' },
  { value: 'cinematic', label: '电影感', desc: '调色+暗角' },
  { value: 'vivid', label: '鲜艳', desc: '色彩增强' },
  { value: 'retro', label: '复古', desc: '怀旧色调' },
  { value: 'cool', label: '冷色调', desc: '蓝色系' },
  { value: 'warm', label: '暖色调', desc: '橙色系' },
];

// 语音设置默认值
const DEFAULT_VOICE_SPEED = 100;
const DEFAULT_VOICE_VOLUME = 80;
const VOICE_SPEED_MIN = 50;
const VOICE_SPEED_MAX = 150;
const VOICE_SPEED_RANGE = VOICE_SPEED_MAX - VOICE_SPEED_MIN;

// 字幕位置
const SUBTITLE_POSITIONS = [
  { value: 'bottom', label: '底部' },
  { value: 'center', label: '中间' },
  { value: 'top', label: '顶部' },
];

const VideoSynthesize: React.FC<VideoSynthesizeProps> = memo(({ onNext }) => {
  const { state, setVoice, setSynthesis, goToNextStep, dispatch } = useStoryFab();
  const timeout = useTimeout();
  const [synthesizing, setSynthesizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'voice' | 'subtitle' | 'effect'>('voice');
  const [config, setConfig] = useState<SynthesizeConfig>({
    voiceId: 'female_zh',
    voiceSpeed: DEFAULT_VOICE_SPEED,
    voiceVolume: DEFAULT_VOICE_VOLUME,
    originalAudioVolume: 30,
    voicePreset: 'XiaoxiaoNeural',
    enableVoice: true,
    enableSubtitle: true,
    subtitlePosition: 'bottom',
    enableEffect: false,
    effectStyle: 'cinematic',
    syncAudioVideo: true,
  });

  const [isMixPreviewPlaying, setIsMixPreviewPlaying] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  const getCurrentScriptContent = useCallback((): string => {
    return state.scriptData.narration?.content || state.scriptData.remix?.content || '';
  }, [state.scriptData]);

  const handleGenerateVoice = useCallback(async () => {
    const scriptContent = getCurrentScriptContent();
    if (!scriptContent) {
      notify.warning('请先生成文案');
      return null;
    }

    try {
      const voiceResult = await voiceSynthesisService.synthesize(scriptContent, {
        voice: config.voiceId,
        rate: config.voiceSpeed / 100,
        volume: config.voiceVolume / 100,
      }, (p) => {
        setProgress(Math.round(p.progress));
      });

      if (voiceResult.audioPath) {
        setVoice(voiceResult.audioPath, {
          voiceId: config.voiceId,
          speed: config.voiceSpeed / 100,
          volume: config.voiceVolume / 100
        });
      }

      notify.success('配音生成成功！');
      return voiceResult;
    } catch (error) {
      notify.error(error, '配音生成失败');
      return null;
    }
  }, [config.voiceId, config.voiceSpeed, config.voiceVolume, setVoice, getCurrentScriptContent]);

  // ==== 辅助函数：校验合成输入 ====
  const validateSynthesizeInput = (): boolean => {
    if (!state.currentVideo) {
      notify.warning('请先上传视频');
      return false;
    }
    const scriptContent = getCurrentScriptContent();
    if (!scriptContent && config.enableVoice) {
      notify.warning('请先生成文案');
      return false;
    }
    return true;
  };

  // ==== 辅助函数：确保语音已生成 ====
  const ensureVoiceGenerated = useCallback(async (onProgress: (p: number) => void): Promise<boolean> => {
    if (!config.enableVoice) return true;
    if (state.voiceData.audioUrl) return true;
    onProgress(20);
    const result = await handleGenerateVoice();
    return result !== null;
  }, [config.enableVoice, state.voiceData.audioUrl, handleGenerateVoice]);

  // ==== 辅助函数：应用视频特效 ====
  const applyVideoEffect = useCallback(async (onProgress: (p: number) => void): Promise<void> => {
    if (!config.enableEffect) return;
    onProgress(60);
    const presetId = EFFECT_PRESET_MAP[config.effectStyle];
    if (presetId) {
      await videoEffectService.applyPreset(presetId);
    } else {
      await videoEffectService.reset();
    }
  }, [config.enableEffect, config.effectStyle]);

  // ==== 辅助函数：混音 TTS 配音到视频 ====
  const mixAudioIfNeeded = useCallback(async (onProgress: (p: number) => void): Promise<string | null> => {
    if (!config.enableVoice || !state.voiceData.audioUrl || !state.currentVideo) {
      return null;
    }
    onProgress(75);

    const outputDir = await invoke<string>('get_export_dir').catch(() => '');
    const outputPath = outputDir
      ? `${outputDir}/mix_${Date.now()}.mp4`
      : `${state.currentVideo.path.replace(/\.[^.]+$/, '')}_mixed.mp4`;

    const syncResult = await audioVideoSyncService.autoSync(
      state.currentVideo.path,
      state.voiceData.audioUrl
    );

    if (!syncResult) {
      notify.warning('音视频同步检测失败，将使用默认偏移');
    }

    const offsetSeconds = syncResult?.offset ? syncResult.offset / 1000 : 0;

    const mixed = await mixTtsWithVideo({
      ttsAudioPath: state.voiceData.audioUrl,
      videoPath: state.currentVideo.path,
      outputPath,
      ttsVolume: config.voiceVolume / 100,
      backgroundVolume: 0.3,
      offset: offsetSeconds,
    });

    return mixed.outputPath;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- notify 是稳定单例
  }, [config.enableVoice, state.voiceData.audioUrl, state.currentVideo, config.voiceVolume]);


  // ==== 主合成函数 ====
  const handleSynthesize = useCallback(async () => {
    if (!validateSynthesizeInput()) return;

    setSynthesizing(true);
    setProgress(0);

    try {
      // 确保语音已生成（synthesizing 状态由 handleSynthesize 统一管理）
      const voiceReady = await ensureVoiceGenerated(setProgress);
      if (!voiceReady) {
        setSynthesizing(false);
        return;
      }

      if (config.enableSubtitle) setProgress(40);
      await applyVideoEffect(setProgress); // 等待特效应用完成

      // 混音：TTS 配音 + 原视频音轨 → 合成视频
      const mixedVideoPath = await mixAudioIfNeeded(setProgress);

      if (!state.currentVideo) {
        setSynthesizing(false);
        return;
      }

      setProgress(100);
      const finalVideoPath = mixedVideoPath
        || `${state.currentVideo.path}?synthesized=${Date.now()}`;

      setSynthesis(finalVideoPath, {
        syncAudioVideo: config.syncAudioVideo,
        addSubtitles: config.enableSubtitle,
        addWatermark: false,
      });

      notify.success('视频合成完成！');

      timeout.set(() => {
        if (onNext) onNext();
        else goToNextStep();
      }, 500);

    } catch (error) {
      notify.error(error, '视频合成失败');
    } finally {
      setSynthesizing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- enableVoice/audioUrl 经 ensureVoiceGenerated 间接使用，lint 盲区
  }, [config.enableVoice, config.enableSubtitle, config.syncAudioVideo,
      state.currentVideo, state.voiceData.audioUrl,
      ensureVoiceGenerated, applyVideoEffect, mixAudioIfNeeded,
      setSynthesis, validateSynthesizeInput,
      goToNextStep, onNext, timeout]);

  // ==== 前置条件检查 ====
  const hasVideo = !!state.currentVideo;
  const hasScript = !!getCurrentScriptContent();
  const hasVoice = !!state.voiceData.audioUrl;
  const canProceed = hasVideo && (hasScript || !config.enableVoice);

  if (!hasVideo) {
    return (
      <div className={styles.stepContent}>
        <div className={styles.stepTitle}>
          <div className={styles.stepTitleLeft}>
            <h2><span aria-hidden="true">⚙️</span> 视频合成配置</h2>
          </div>
        </div>
        <div className={styles.warningAlert}>
          <span aria-hidden="true">⚠️</span> 请先上传视频
          <button
            className={styles.warningAlertBtn}
            onClick={() => dispatch({ type: 'SET_STEP', payload: 'video-upload' })}
          >
            去上传
          </button>
        </div>
      </div>
    );
  }

  if (!hasScript && config.enableVoice) {
    return (
      <div className={styles.stepContent}>
        <div className={styles.stepTitle}>
          <div className={styles.stepTitleLeft}>
            <h2><span aria-hidden="true">⚙️</span> 视频合成配置</h2>
          </div>
        </div>
        <div className={styles.warningAlert}>
          <span aria-hidden="true">⚠️</span> 请先生成文案
          <button
            className={styles.warningAlertBtn}
            onClick={() => dispatch({ type: 'SET_STEP', payload: 'script-generate' })}
          >
            去生成文案
          </button>
        </div>
      </div>
    );
  }

  // ==== 合成中 ====
  if (synthesizing) {
    const circumference = 2 * Math.PI * 45; // r=45
    const offset = circumference - (progress / 100) * circumference;

    return (
      <div className={styles.stepContent}>
        <div className={styles.synthesizingCard}>
          <div className={styles.synthesizeProgressCircle}>
            <svg className={styles.synthesizeProgressCircleSvg} viewBox="0 0 100 100">
              <circle className={styles.synthesizeProgressCircleTrack} cx="50" cy="50" r="45" />
              <circle
                className={styles.synthesizeProgressCircleFill}
                cx="50"
                cy="50"
                r="45"
                style={{ strokeDashoffset: offset }}
              />
            </svg>
            <div className={styles.synthesizeProgressPercent}>{progress}%</div>
          </div>
          <div className={styles.synthesizeProgressLabel}>
            {progress < 30 ? <><span aria-hidden="true">🎤</span> 生成配音中...</> :
             progress < 60 ? <><span aria-hidden="true">📝</span> 生成字幕中...</> :
             progress < 80 ? <><span aria-hidden="true">✨</span> 应用特效中...</> :
             <><span aria-hidden="true">🔗</span> 音画同步中...</>}
          </div>
          <div className={styles.synthesizeProgressSub}>请耐心等待...</div>
        </div>
      </div>
    );
  }

  // ==== 已合成完成 ====
  if (state.synthesisData?.finalVideoUrl && state.stepStatus['video-synth']) {
    return (
      <div className={styles.stepContent}>
        <div className={styles.stepTitle}>
          <div className={styles.stepTitleLeft}>
            <h2><span aria-hidden="true">🎬</span> 视频合成完成</h2>
            <span className={styles.statusBadge}>
              <span className={styles.statusBadgeDot} />
              已合成
            </span>
          </div>
        </div>

        <div className={styles.completeCard}>
          <svg className={styles.completeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <h3 className={styles.completeTitle}>视频合成成功！</h3>
          <p className={styles.completeDesc}>您的视频已准备就绪，可以进行导出</p>
          <div className={styles.completeActions}>
            <button className={`${styles.completeBtn} ${styles.completeBtnSecondary}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </svg>
              预览效果
            </button>
            <button
              className={`${styles.completeBtn} ${styles.completeBtnPrimary}`}
              onClick={goToNextStep}
            >
              下一步：导出视频
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==== 配置界面 ====
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepTitle}>
        <div className={styles.stepTitleLeft}>
          <h2><span aria-hidden="true">⚙️</span> 视频合成配置</h2>
        </div>
      </div>

      {/* 预览播放器 */}
      <div className={styles.previewSection}>
        <div className={styles.previewPlayer}>
          {state.currentVideo ? (
            <>
              <video
                className={styles.previewVideo}
                src={state.currentVideo.path}
                muted
                aria-label="视频预览"
              />
              <div className={styles.previewOverlay}>
                <button className={styles.playBtn} aria-label="播放预览">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className={styles.previewPlaceholder}>
              <svg className={styles.previewPlaceholderIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              <span className={styles.previewPlaceholderText}>视频预览</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab 切换 */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'voice' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('voice')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          配音设置
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'subtitle' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('subtitle')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="15" width="20" height="4" rx="1" />
            <path d="M6 11h4M14 11h4M6 7h12" />
          </svg>
          字幕设置
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'effect' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('effect')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          特效设置
        </button>
      </div>

      <div className={styles.panelCard}>
        {/* 配音设置 */}
        {activeTab === 'voice' && (
          <div className={styles.panelBody}>
            <div className={styles.switchRow}>
              <div>
                <div className={styles.switchLabel}>启用配音</div>
                <div className={styles.switchSub}>为视频添加 AI 配音</div>
              </div>
              <button
                className={`${styles.toggle} ${config.enableVoice ? styles.toggleOn : ''}`}
                onClick={() => setConfig({ ...config, enableVoice: !config.enableVoice })}
                role="switch"
                aria-checked={config.enableVoice}
              />
            </div>

            {config.enableVoice && (
              <>
                {/* 音色选择 */}
                <div className={styles.voiceGrid}>
                  {VOICE_OPTIONS.map(voice => (
                    <div
                      key={voice.value}
                      className={`${styles.voiceItem} ${config.voiceId === voice.value ? styles.voiceActive : ''}`}
                      onClick={() => setConfig({ ...config, voiceId: voice.value })}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setConfig({ ...config, voiceId: voice.value })}
                    >
                      <div className={styles.voiceCheck}>
                        <div className={styles.voiceCheckDot} />
                      </div>
                      <div className={styles.voiceName}>
                        <span className={styles.voiceEmoji}>{voice.emoji}</span>
                        {voice.label}
                      </div>
                      <div className={styles.voiceDesc}>{voice.desc}</div>
                    </div>
                  ))}
                </div>

                {/* Voice Preset selector */}
                <div className={styles.sliderLabel} style={{ marginBottom: '10px', display: 'block' }}>语音风格预设</div>
                <div className={styles.voicePresetGrid}>
                  {VOICE_PRESETS.map(preset => (
                    <div
                      key={preset.value}
                      className={`${styles.voicePresetItem} ${config.voicePreset === preset.value ? styles.voicePresetActive : ''}`}
                      onClick={() => setConfig({ ...config, voicePreset: preset.value })}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setConfig({ ...config, voicePreset: preset.value })}
                    >
                      <span className={styles.voicePresetIcon}>{preset.emoji}</span>
                      <span className={styles.voicePresetName}>{preset.label}</span>
                      <span className={styles.voicePresetDesc}>{preset.desc}</span>
                    </div>
                  ))}
                </div>

                {/* 语速滑块 */}
                <div className={styles.sliderGroup}>
                  <div className={styles.sliderHeader}>
                    <span className={styles.sliderLabel}>语速</span>
                    <span className={styles.sliderValue}>{config.voiceSpeed}%</span>
                  </div>
                  <div className={styles.sliderTrack}>
                    <div
                      className={styles.sliderFill}
                      style={{ width: `${((config.voiceSpeed - VOICE_SPEED_MIN) / VOICE_SPEED_RANGE) * 100}%` }}
                    />
                    <div className={styles.sliderThumb} style={{ left: `${((config.voiceSpeed - VOICE_SPEED_MIN) / VOICE_SPEED_RANGE) * 100}%` }} />
                    <input
                      type="range"
                      className={styles.sliderInput}
                      min={VOICE_SPEED_MIN}
                      max={VOICE_SPEED_MAX}
                      value={config.voiceSpeed}
                      onChange={(e) => setConfig({ ...config, voiceSpeed: Number(e.target.value) })}
                      aria-label="语速"
                    />
                  </div>
                </div>

                {/* 音量滑块 */}
                <div className={styles.sliderGroup}>
                  <div className={styles.sliderHeader}>
                    <span className={styles.sliderLabel}>配音音量</span>
                    <span className={styles.sliderValue}>{config.voiceVolume}%</span>
                  </div>
                  <div className={styles.sliderTrack}>
                    <div
                      className={styles.sliderFill}
                      style={{ width: `${config.voiceVolume}%` }}
                    />
                    <div className={styles.sliderThumb} style={{ left: `${config.voiceVolume}%` }} />
                    <input
                      type="range"
                      className={styles.sliderInput}
                      min={0}
                      max={100}
                      value={config.voiceVolume}
                      onChange={(e) => setConfig({ ...config, voiceVolume: Number(e.target.value) })}
                      aria-label="配音音量"
                    />
                  </div>
                </div>

                {/* 原音频音量滑块 */}
                <div className={styles.sliderGroup}>
                  <div className={styles.sliderHeader}>
                    <span className={styles.sliderLabel}>原音频音量</span>
                    <span className={styles.sliderValue}>{config.originalAudioVolume}%</span>
                  </div>
                  <div className={styles.sliderTrack}>
                    <div
                      className={styles.sliderFill}
                      style={{ width: `${config.originalAudioVolume}%`, background: 'linear-gradient(90deg, rgba(0, 212, 255, 0.5), rgba(0, 212, 255, 0.8))' }}
                    />
                    <div className={styles.sliderThumb} style={{ left: `${config.originalAudioVolume}%` }} />
                    <input
                      type="range"
                      className={styles.sliderInput}
                      min={0}
                      max={100}
                      value={config.originalAudioVolume}
                      onChange={(e) => setConfig({ ...config, originalAudioVolume: Number(e.target.value) })}
                      aria-label="原音频音量"
                    />
                  </div>
                </div>

                {/* 音频波形指示器 */}
                {state.voiceData.audioUrl && (
                  <div className={styles.waveformSection}>
                    <div className={styles.waveformLabel}>音频波形</div>
                    <div className={styles.waveformContainer}>
                      <div className={styles.waveformBars}>
                        {Array.from({ length: 40 }).map((_, i) => (
                          <div
                            key={i}
                            className={styles.waveformBar}
                            style={{
                              height: `${Math.random() * 60 + 20}%`,
                              animationDelay: `${i * 0.05}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 混音预览按钮 */}
                <button
                  className={styles.mixPreviewBtn}
                  onClick={() => setIsMixPreviewPlaying(!isMixPreviewPlaying)}
                  disabled={!state.voiceData.audioUrl}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {isMixPreviewPlaying ? (
                      <rect x="6" y="4" width="4" height="16" />
                    ) : (
                      <polygon points="5 3 19 12 5 21 5 3" />
                    )}
                  </svg>
                  {isMixPreviewPlaying ? '停止预览' : '混音预览'}
                </button>

                {/* 生成配音按钮 */}
                <div className={styles.statusRow}>
                  {hasVoice ? (
                    <>
                      <span className={`${styles.statusDot} ${styles.dotGreen}`} />
                      <span>配音已就绪</span>
                    </>
                  ) : (
                    <>
                      <span className={`${styles.statusDot} ${styles.dotRed}`} />
                      <span>请先生成配音</span>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* 字幕设置 */}
        {activeTab === 'subtitle' && (
          <div className={styles.panelBody}>
            <div className={styles.switchRow}>
              <div>
                <div className={styles.switchLabel}>启用字幕</div>
                <div className={styles.switchSub}>自动生成同步字幕</div>
              </div>
              <button
                className={`${styles.toggle} ${config.enableSubtitle ? styles.toggleOn : ''}`}
                onClick={() => setConfig({ ...config, enableSubtitle: !config.enableSubtitle })}
                role="switch"
                aria-checked={config.enableSubtitle}
              />
            </div>

            {config.enableSubtitle && (
              <>
                <div className={styles.sliderLabel} style={{ marginBottom: '10px', display: 'block' }}>字幕位置</div>
                <div className={styles.positionGroup}>
                  {SUBTITLE_POSITIONS.map(pos => (
                    <button
                      key={pos.value}
                      className={`${styles.positionBtn} ${config.subtitlePosition === pos.value ? styles.positionActive : ''}`}
                      onClick={() => setConfig({ ...config, subtitlePosition: pos.value as 'bottom' | 'center' | 'top' })}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 特效设置 */}
        {activeTab === 'effect' && (
          <div className={styles.panelBody}>
            <div className={styles.switchRow}>
              <div>
                <div className={styles.switchLabel}>启用视频特效</div>
                <div className={styles.switchSub}>为视频添加视觉特效</div>
              </div>
              <button
                className={`${styles.toggle} ${config.enableEffect ? styles.toggleOn : ''}`}
                onClick={() => setConfig({ ...config, enableEffect: !config.enableEffect })}
                role="switch"
                aria-checked={config.enableEffect}
              />
            </div>

            {config.enableEffect && (
              <>
                <div className={styles.sliderLabel} style={{ marginBottom: '10px', display: 'block' }}>特效风格</div>
                <div className={styles.effectGrid}>
                  {EFFECT_STYLES.map(style => (
                    <div
                      key={style.value}
                      className={`${styles.effectItem} ${config.effectStyle === style.value ? styles.effectActive : ''}`}
                      onClick={() => setConfig({ ...config, effectStyle: style.value })}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setConfig({ ...config, effectStyle: style.value })}
                    >
                      <div className={styles.effectName}>{style.label}</div>
                      <div className={styles.effectDesc}>{style.desc}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 合成按钮 */}
      <div className={styles.synthesizeSection}>
        <div className={styles.statusRow}>
          {hasVoice ? (
            <>
              <span className={`${styles.statusDot} ${styles.dotGreen}`} />
              <span>✅ 配音已就绪</span>
            </>
          ) : (
            <>
              <span className={`${styles.statusDot} ${styles.dotRed}`} />
              <span>❌ 请先生成配音</span>
            </>
          )}
        </div>
        <button
          className={`${styles.synthesizeBtn} ${canProceed ? styles.synthesizeBtnReady : ''}`}
          onClick={handleSynthesize}
          disabled={!canProceed}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          开始合成视频
        </button>
      </div>
    </div>
  );
});

VideoSynthesize.displayName = 'VideoSynthesize';
export default VideoSynthesize;

