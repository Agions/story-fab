/**
 * 步骤6: 导出视频 — AI Cinema Studio Redesign
 * Split into: exportConfig.ts (constants), useExportHandlers.ts (state/logic), VideoExport.tsx (render)
 */
import React, { memo } from 'react';
import { useStoryFab } from '@/components/StoryFab/context';
import styles from '../VideoExport.module.less';
import { useExportHandlers } from './use-export-handlers';
import { NoSynthesisAlert } from './no-synthesis-alert';
import { ExportCompleteCard } from './export-complete-card';
import { ExportingPanel } from './exporting-panel';
import {
  FORMAT_OPTIONS,
  QUALITY_OPTIONS,
  RESOLUTION_OPTIONS,
  FPS_OPTIONS,
  PLATFORM_PRESETS,
} from './export-config';

interface VideoExportProps {
  onComplete?: () => void;
}

const VideoExport: React.FC<VideoExportProps> = memo(({ onComplete }) => {
  const { state, setExportSettings, setStep } = useStoryFab();

  const {
    exporting,
    progress,
    progressStage,
    etaSeconds,
    exported,
    selectedPlatform,
    batchMode,
    selectedPlatforms,
    config,
    estimateFileSize,
    getEstimatedFileSize,
    setConfig,
    setSelectedPlatform,
    setBatchMode,
    handleExport,
    handleBatchExport,
    handleCancel,
    togglePlatformSelection,
  } = useExportHandlers({
    state: {
      synthesisData: state.synthesisData?.finalVideoUrl
        ? { finalVideoUrl: state.synthesisData.finalVideoUrl ?? undefined }
        : undefined,
      currentVideo: state.currentVideo?.duration != null
        ? { duration: state.currentVideo.duration }
        : undefined,
      exportSettings: state.exportSettings ?? undefined,
    },
    onExportSettingsChange: setExportSettings,
    onComplete,
  });

  // Platform preset handler
  const applyPlatformPreset = (platform: (typeof PLATFORM_PRESETS)[number]) => {
    setSelectedPlatform(platform.value);
    setConfig(prev => ({
      ...prev,
      resolution: platform.resolution as typeof config.resolution,
    }));
  };

  const hasSynthesis = !!state.synthesisData?.finalVideoUrl;

  // ── 前置条件检查：未合成时显示空状态 ─────────────────────────────
  if (!hasSynthesis) {
    return <NoSynthesisAlert onNavigateToSynth={() => setStep('video-synth')} />;
  }

  // ── 导出完成 ─────────────────────────────────────────────────
  if (exported) {
    return (
      <ExportCompleteCard
        meta={{
          format: config.format,
          resolution: config.resolution,
          fps: config.fps,
          estimatedSize: estimateFileSize(),
        }}
      />
    );
  }

  // ── 导出中 ──────────────────────────────────────────────────
  if (exporting) {
    return (
      <ExportingPanel
        progress={{ percent: progress, stageLabel: progressStage, etaSeconds }}
        onCancel={handleCancel}
      />
    );
  }

  // ── 配置界面 ─────────────────────────────────────────────────
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepTitle}>
        <div className={styles.stepTitleLeft}>
          <h2>📤 导出设置</h2>
          <div className={styles.tagGroup}>
            <span className={styles.tag}>{config.format.toUpperCase()}</span>
            <span className={styles.tag}>{config.resolution}</span>
            <span className={styles.tag}>{config.fps}fps</span>
          </div>
        </div>
      </div>

      <div className={styles.columns}>
        {/* Left: Settings panel */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <svg className={styles.cardHeaderIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <h3 className={styles.cardTitle}>导出配置</h3>
          </div>

          <div className={styles.cardBody}>
            {/* Platform presets */}
            <div className={styles.platformSection}>
              <div className={styles.sectionHeaderRow}>
                <span className={styles.sectionLabel}>发布平台</span>
                <button
                  className={`${styles.batchModeToggle} ${batchMode ? styles.batchModeActive : ''}`}
                  onClick={() => setBatchMode(!batchMode)}
                >
                  {batchMode ? '取消批量' : '批量导出'}
                </button>
              </div>
              <div className={styles.platformGrid}>
                {PLATFORM_PRESETS.map(platform => (
                  <div
                    key={platform.value}
                    className={`${styles.platformItem} ${selectedPlatform === platform.value || (batchMode && selectedPlatforms.includes(platform.value)) ? styles.platformActive : ''}`}
                    onClick={() => batchMode ? togglePlatformSelection(platform.value) : applyPlatformPreset(platform)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && (batchMode ? togglePlatformSelection(platform.value) : applyPlatformPreset(platform))}
                  >
                    <span className={styles.platformEmoji}>{platform.emoji}</span>
                    <span className={styles.platformName}>{platform.label}</span>
                    {batchMode && selectedPlatforms.includes(platform.value) && (
                      <span className={styles.platformCheck}>✓</span>
                    )}
                  </div>
                ))}
              </div>
              {batchMode && selectedPlatforms.length > 0 && (
                <div className={styles.batchTip}>
                  已选择 {selectedPlatforms.length} 个平台，点击「批量导出」开始
                </div>
              )}
              {selectedPlatform && (
                <div className={styles.platformTip}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {PLATFORM_PRESETS.find(p => p.value === selectedPlatform)?.tips}
                </div>
              )}
            </div>

            {/* Format */}
            <div className={styles.formatSection}>
              <span className={styles.sectionLabel}>输出格式</span>
              <div className={styles.formatGrid}>
                {FORMAT_OPTIONS.map(fmt => (
                  <div
                    key={fmt.value}
                    className={`${styles.formatItem} ${config.format === fmt.value ? styles.formatActive : ''}`}
                    onClick={() => setConfig({ ...config, format: fmt.value as typeof config.format })}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setConfig({ ...config, format: fmt.value as typeof config.format })}
                  >
                    <div className={styles.formatCheck}>
                      <div className={styles.formatCheckDot} />
                    </div>
                    <span className={styles.formatEmoji} aria-hidden="true">{fmt.emoji}</span>
                    <span className={styles.formatName}>{fmt.label}</span>
                    <span className={styles.formatDesc}>{fmt.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div className={styles.qualitySection}>
              <span className={styles.sectionLabel}>输出质量</span>
              <div className={styles.qualityGrid}>
                {QUALITY_OPTIONS.map(q => (
                  <div
                    key={q.value}
                    className={`${styles.qualityItem} ${config.resolution === q.value ? styles.qualityActive : ''}`}
                    onClick={() => setConfig({ ...config, resolution: q.value as typeof config.resolution })}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setConfig({ ...config, resolution: q.value as typeof config.resolution })}
                  >
                    <span className={styles.qualityValue}>{q.value}</span>
                    <span className={styles.qualityLabel}>{q.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resolution & FPS */}
            <div className={styles.rowGroup}>
              <div className={styles.optionGroup}>
                <label htmlFor="resolutionSelect">分辨率</label>
                <div className={styles.optionWrapper}>
                  <select
                    id="resolutionSelect"
                    className={styles.optionSelect}
                    value={config.resolution}
                    onChange={(e) => setConfig({ ...config, resolution: e.target.value as typeof config.resolution })}
                  >
                    {RESOLUTION_OPTIONS.map(r => (
                      <option key={r.value} value={r.value}>{r.label} ({r.res})</option>
                    ))}
                  </select>
                  <svg className={styles.optionArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
              <div className={styles.optionGroup}>
                <label htmlFor="fpsSelect">帧率</label>
                <div className={styles.optionWrapper}>
                  <select
                    id="fpsSelect"
                    className={styles.optionSelect}
                    value={config.fps}
                    onChange={(e) => setConfig({ ...config, fps: Number(e.target.value) as typeof config.fps })}
                  >
                    {FPS_OPTIONS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <svg className={styles.optionArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Toggle options */}
            <div className={styles.toggleSection}>
              <div className={styles.toggleRow}>
                <div className={styles.toggleLabelGroup}>
                  <span className={styles.toggleLabel}>包含字幕文件</span>
                  <span className={styles.toggleSubLabel}>导出 .srt 字幕文件</span>
                </div>
                <button
                  className={`${styles.toggle} ${config.includeSubtitles ? styles.toggleOn : ''}`}
                  onClick={() => setConfig({ ...config, includeSubtitles: !config.includeSubtitles })}
                  role="switch"
                  aria-checked={config.includeSubtitles}
                />
              </div>
              <div className={styles.toggleRow}>
                <div className={styles.toggleLabelGroup}>
                  <span className={styles.toggleLabel}>烧录字幕到视频</span>
                  <span className={styles.toggleSubLabel}>字幕将永久显示在画面上</span>
                </div>
                <button
                  className={`${styles.toggle} ${config.burnSubtitles ? styles.toggleOn : ''}`}
                  onClick={() => setConfig({ ...config, burnSubtitles: !config.burnSubtitles })}
                  role="switch"
                  aria-checked={config.burnSubtitles}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Export info */}
        <div className={styles.infoCard}>
          <div className={styles.infoHeader}>
            <svg className={styles.cardHeaderIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <h3 className={styles.infoTitle}>导出信息</h3>
          </div>

          <div className={styles.infoBody}>
            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>原始视频</span>
                <span className={styles.infoValueTruncate}>
                  {state.currentVideo?.name || '-'}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>时长</span>
                <span className={styles.infoValue}>{Math.floor(state.currentVideo?.duration || 0)} 秒</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>格式</span>
                <span className={styles.infoTag}>{config.format.toUpperCase()}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>分辨率</span>
                <span className={styles.infoTag}>{config.resolution}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>帧率</span>
                <span className={styles.infoValue}>{config.fps} fps</span>
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.sizeEstimate}>
              <span className={styles.sizeLabel}>预估大小</span>
              <span className={styles.sizeValue}>{getEstimatedFileSize()}</span>
            </div>

            <div className={styles.exportActions}>
              <button
                className={`${styles.exportBtn} ${styles.exportBtnPrimary}`}
                onClick={batchMode ? handleBatchExport : handleExport}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {batchMode ? `批量导出 (${selectedPlatforms.length})` : '一键导出'}
              </button>
              <button
                className={`${styles.exportBtn} ${styles.exportBtnSecondary}`}
                onClick={handleExport}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                自定义导出
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

VideoExport.displayName = 'VideoExport';
export default VideoExport;