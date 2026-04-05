/**
 * EffectsPanel — GPU-accelerated video filter UI for CutDeck.
 *
 * Lets users:
 *   - Browse & select from 12 built-in video filters
 *   - Adjust per-filter numeric parameters via sliders
 *   - Stack filters (chain) and preview them in real-time
 *   - Apply the selected chain to the full video and save
 *
 * All heavy lifting is done on the Rust side via FFmpeg's libavfilter
 * (GPU-assisted via VA-API / NVENC when available).
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Slider,
  Button,
  Select,
  Typography,
  Space,
  Tag,
  Badge,
  Tooltip,
  Spin,
  message,
  Divider,
  Popconfirm,
} from 'antd';
import {
  FilterOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  SaveOutlined,
  PlusOutlined,
  AudioOutlined,
} from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { colors } from '@/styles/theme';
import styles from './EffectsPanel.module.less';

const { Title, Text } = Typography;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Matching Rust `VideoFilter` enum variant names. */
export type FilterType =
  | 'Sepia'
  | 'Vintage'
  | 'Contrast'
  | 'Brightness'
  | 'Saturation'
  | 'Blur'
  | 'Sharpen'
  | 'Vignette'
  | 'Grain'
  | 'Cinema'
  | 'Cool'
  | 'Warm';

/** A single filter in the chain with its current parameter value. */
interface FilterNode {
  id: string;
  type: FilterType;
  /** For filters with a numeric parameter (Contrast, Brightness, Saturation, Blur, Sharpen, Grain). */
  value: number;
  /** FFmpeg filter description built by the Rust side. */
  description: string;
}

/** Result returned by `generate_filter_preview`. */
interface PreviewResult {
  path: string;
  duration: number;
}

/** Filter catalog entry. */
interface FilterCatalogItem {
  type: FilterType;
  label: string;
  description: string;
  /** CSS filter string for thumbnail preview. */
  cssFilter: string;
  /** Whether this filter takes a numeric slider. */
  hasSlider: boolean;
  /** Slider min / max / step / default. */
  sliderConfig?: {
    min: number;
    max: number;
    step: number;
    default: number;
  };
  /** Emoji badge shown in the grid. */
  icon: string;
  /** FFmpeg category tag colour. */
  tagColor: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter catalog
// ─────────────────────────────────────────────────────────────────────────────

const FILTER_CATALOG: FilterCatalogItem[] = [
  {
    type: 'Sepia',
    label: '复古滤镜',
    description: '温暖的棕褐色调，经典复古感',
    cssFilter: 'sepia(1)',
    hasSlider: false,
    icon: '🟫',
    tagColor: '#92400e',
  },
  {
    type: 'Vintage',
    label: '复古电影感',
    description: '褪色黑色 + 暖色调 + 轻微噪点',
    cssFilter: 'sepia(0.4) saturate(0.85) brightness(1.06) contrast(0.9)',
    hasSlider: false,
    icon: '🎞️',
    tagColor: '#b45309',
  },
  {
    type: 'Contrast',
    label: '对比度',
    description: '调整明暗对比强度',
    cssFilter: 'contrast(1.3)',
    hasSlider: true,
    sliderConfig: { min: 0.5, max: 2.5, step: 0.05, default: 1.3 },
    icon: '◐',
    tagColor: '#1d4ed8',
  },
  {
    type: 'Brightness',
    label: '亮度',
    description: '调整画面整体明暗',
    cssFilter: 'brightness(1.1)',
    hasSlider: true,
    sliderConfig: { min: -0.5, max: 0.5, step: 0.02, default: 0.1 },
    icon: '☀️',
    tagColor: '#d97706',
  },
  {
    type: 'Saturation',
    label: '饱和度',
    description: '调整色彩鲜艳程度',
    cssFilter: 'saturate(1.5)',
    hasSlider: true,
    sliderConfig: { min: 0, max: 3.0, step: 0.05, default: 1.2 },
    icon: '🌈',
    tagColor: '#7c3aed',
  },
  {
    type: 'Blur',
    label: '模糊',
    description: '高斯模糊效果',
    cssFilter: 'blur(3px)',
    hasSlider: true,
    sliderConfig: { min: 0.5, max: 20, step: 0.5, default: 3 },
    icon: '💧',
    tagColor: '#0891b2',
  },
  {
    type: 'Sharpen',
    label: '锐化',
    description: '增强边缘细节清晰度',
    cssFilter: 'saturate(1.2) contrast(1.15)',
    hasSlider: true,
    sliderConfig: { min: 0.5, max: 5.0, step: 0.1, default: 1.5 },
    icon: '🔪',
    tagColor: '#dc2626',
  },
  {
    type: 'Vignette',
    label: '暗角',
    description: '在画面角落添加阴影边框',
    cssFilter: 'brightness(0.9) contrast(1.05)',
    hasSlider: false,
    icon: '🕳️',
    tagColor: '#44403c',
  },
  {
    type: 'Grain',
    label: '胶片颗粒',
    description: '模拟胶片电影的质感噪点',
    cssFilter: 'contrast(1.05) saturate(0.95)',
    hasSlider: true,
    sliderConfig: { min: 0.01, max: 0.3, step: 0.01, default: 0.08 },
    icon: '🎲',
    tagColor: '#78716c',
  },
  {
    type: 'Cinema',
    label: '电影感',
    description: '青阴影 + 橙高光的电影色调',
    cssFilter: 'saturate(1.1) sepia(0.15) contrast(1.05)',
    hasSlider: false,
    icon: '🎬',
    tagColor: '#1e3a8a',
  },
  {
    type: 'Cool',
    label: '冷色调',
    description: '偏蓝的冷色温',
    cssFilter: 'saturate(0.9) hue-rotate(15deg) brightness(1.02)',
    hasSlider: false,
    icon: '❄️',
    tagColor: '#0369a1',
  },
  {
    type: 'Warm',
    label: '暖色调',
    description: '偏黄的暖色温',
    cssFilter: 'saturate(1.1) sepia(0.1) brightness(1.03)',
    hasSlider: false,
    icon: '🍂',
    tagColor: '#b45309',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Convert a FilterNode to the Rust VideoFilter serialisable shape. */
function toRustFilter(node: FilterNode): { type: string; value?: number } {
  if (node.hasSlider) {
    return { type: node.type, value: node.value };
  }
  return { type: node.type };
}

/** Build the CSS filter string for a given filter node (used in thumbnail preview). */
function nodeToCssFilter(node: FilterNode): string {
  const catalog = FILTER_CATALOG.find((f) => f.type === node.type);
  if (!catalog) return 'none';

  switch (node.type) {
    case 'Contrast':
      return `contrast(${node.value})`;
    case 'Brightness':
      return `brightness(${1 + node.value})`;
    case 'Saturation':
      return `saturate(${node.value})`;
    case 'Blur':
      return `blur(${node.value}px)`;
    case 'Sharpen':
      return `contrast(${1 + (node.value - 1) * 0.1}) saturate(${1 + (node.value - 1) * 0.05})`;
    case 'Grain':
      return `contrast(${1 + node.value * 0.5})`;
    default:
      return catalog.cssFilter;
  }
}

/** Human-readable chain description. */
function chainLabel(chain: FilterNode[]): string {
  if (chain.length === 0) return '无';
  if (chain.length === 1) return chain[0].description;
  return `${chain.length} 个滤镜链`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface EffectsPanelProps {
  /** Absolute path to the currently loaded video file. */
  videoPath?: string;
  /** Video duration in seconds (used to pick preview timestamp). */
  videoDuration?: number;
  /** Thumbnail image URL shown in the preview pane. */
  thumbnailUrl?: string;
  /** Called when the user saves the filtered video. */
  onApply?: (outputPath: string) => void;
  /** Loading state reflected in the parent. */
  loading?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const EffectsPanel: React.FC<EffectsPanelProps> = ({
  videoPath,
  videoDuration = 10,
  thumbnailUrl,
  onApply,
  loading: externalLoading = false,
}) => {
  // Active filter chain
  const [chain, setChain] = useState<FilterNode[]>([]);
  // Which filter in the catalog is currently selected for addition
  const [selectedType, setSelectedType] = useState<FilterType>('Sepia');
  // Temporary slider value while dragging (not yet committed to chain)
  const [sliderDraft, setSliderDraft] = useState<Record<string, number>>({});
  // Live preview URL
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  // Generating preview spinner
  const [previewing, setPreviewing] = useState(false);
  // Applying (full render) spinner
  const [applying, setApplying] = useState(false);
  // Message API
  const [msgApi] = message.useMessage();

  // Reset slider draft when selected type changes
  useEffect(() => {
    setSliderDraft({});
  }, [selectedType]);

  // ── Catalog helpers ─────────────────────────────────────────────────────────

  const catalogItem = (type: FilterType) =>
    FILTER_CATALOG.find((f) => f.type === type)!;

  const isInChain = (type: FilterType) => chain.some((n) => n.type === type);

  // ── Chain mutations ─────────────────────────────────────────────────────────

  const addToChain = useCallback(() => {
    const item = catalogItem(selectedType);
    const value = item.sliderConfig?.default ?? 1.0;
    const node: FilterNode = {
      id: `${selectedType}-${Date.now()}`,
      type: selectedType,
      value,
      description: item.label,
    };
    setChain((prev) => [...prev, node]);
    msgApi.info(`已添加「${item.label}」到滤镜链`);
  }, [selectedType, msgApi]);

  const removeFromChain = useCallback((id: string) => {
    setChain((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const updateChainNode = useCallback((id: string, value: number) => {
    setChain((prev) =>
      prev.map((n) => (n.id === id ? { ...n, value } : n))
    );
  }, []);

  const clearChain = useCallback(() => {
    setChain([]);
    setPreviewPath(null);
    msgApi.info('已清空滤镜链');
  }, [msgApi]);

  // ── Preview ─────────────────────────────────────────────────────────────────

  const handlePreview = useCallback(async () => {
    if (!videoPath) {
      msgApi.warning('请先加载视频文件');
      return;
    }
    if (chain.length === 0) {
      msgApi.warning('请先添加至少一个滤镜');
      return;
    }

    setPreviewing(true);
    setPreviewPath(null);
    try {
      // Pick a start time roughly 1/4 into the video, clamped to [0, duration-5]
      const startTime = Math.min(videoDuration * 0.25, Math.max(0, videoDuration - 5));

      if (chain.length === 1) {
        const result = await invoke<PreviewResult>('generate_filter_preview', {
          inputPath: videoPath,
          filter: toRustFilter(chain[0]),
          startTime,
        });
        setPreviewPath(result.path);
        msgApi.success('预览生成成功');
      } else {
        const result = await invoke<PreviewResult>('generate_chain_preview', {
          inputPath: videoPath,
          filters: chain.map(toRustFilter),
          startTime,
        });
        setPreviewPath(result.path);
        msgApi.success('滤镜链预览生成成功');
      }
    } catch (err) {
      console.error('[EffectsPanel] preview error:', err);
      msgApi.error(`预览生成失败: ${err}`);
    } finally {
      setPreviewing(false);
    }
  }, [videoPath, chain, videoDuration, msgApi]);

  // ── Apply to full video ────────────────────────────────────────────────────

  const handleApply = useCallback(async () => {
    if (!videoPath) {
      msgApi.warning('请先加载视频文件');
      return;
    }
    if (chain.length === 0) {
      msgApi.warning('请先添加至少一个滤镜');
      return;
    }

    try {
      const savePath = await save({
        defaultPath: videoPath.replace(/\.[^.]+$/, '_filtered.mp4'),
        filters: [{ name: 'MP4 视频', extensions: ['mp4'] }],
      });
      if (!savePath) return;

      setApplying(true);
      if (chain.length === 1) {
        await invoke<string>('apply_filter', {
          input: {
            inputPath: videoPath,
            outputPath: savePath,
            filter: toRustFilter(chain[0]),
            startTime: null,
            endTime: null,
          },
        });
      } else {
        await invoke<string>('apply_filter_chain', {
          input: {
            inputPath: videoPath,
            outputPath: savePath,
            filters: chain.map(toRustFilter),
            startTime: null,
            endTime: null,
          },
        });
      }
      msgApi.success('滤镜已应用到视频');
      onApply?.(savePath);
    } catch (err) {
      console.error('[EffectsPanel] apply error:', err);
      msgApi.error(`应用滤镜失败: ${err}`);
    } finally {
      setApplying(false);
    }
  }, [videoPath, chain, msgApi, onApply]);

  // ── Computed CSS for preview pane ───────────────────────────────────────────

  const previewCssFilter = chain.length > 0
    ? chain.map(nodeToCssFilter).join(' ')
    : 'none';

  const chainDescriptions = chain.map((n) => {
    const item = catalogItem(n.type);
    if (item.hasSlider) {
      return `${item.label} ${n.value}`;
    }
    return item.label;
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.panel}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <Space>
          <FilterOutlined style={{ color: colors.accent[400], fontSize: 18 }} />
          <Title level={5} style={{ margin: 0, color: colors.text.primary }}>
            视频特效
          </Title>
        </Space>
        <Space>
          {chain.length > 0 && (
            <Tag color="gold" icon={<ThunderboltOutlined />}>
              {chainLabel(chain)}
            </Tag>
          )}
          {chain.length > 0 && (
            <Popconfirm
              title="清空滤镜链？"
              onConfirm={clearChain}
              okText="确定"
              cancelText="取消"
            >
              <Button size="small" danger icon={<DeleteOutlined />}>
                清空
              </Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      <Row gutter={[12, 12]}>
        {/* ── Left: Filter catalog grid ── */}
        <Col xs={24} md={14}>
          <div className={styles.catalogSection}>
            <Text type="secondary" className={styles.sectionLabel}>
              选择滤镜
            </Text>
            <div className={styles.filterGrid}>
              {FILTER_CATALOG.map((item) => {
                const active = isInChain(item.type);
                return (
                  <Tooltip
                    key={item.type}
                    title={
                      <div>
                        <div><strong>{item.description}</strong></div>
                        {active && <div style={{ color: '#fbbf24' }}>已在滤镜链中</div>}
                      </div>
                    }
                    placement="top"
                  >
                    <div
                      className={`${styles.filterCard} ${active ? styles.filterCardActive : ''}`}
                      onClick={() => !active && setSelectedType(item.type)}
                      style={{
                        '--tag-color': item.tagColor,
                      } as React.CSSProperties}
                    >
                      <span className={styles.filterIcon}>{item.icon}</span>
                      <span className={styles.filterLabel}>{item.label}</span>
                      {active && (
                        <Badge
                          className={styles.activeBadge}
                          count={<CheckCircleOutlined style={{ fontSize: 10 }} />}
                          style={{ backgroundColor: colors.success }}
                        />
                      )}
                    </div>
                  </Tooltip>
                );
              })}
            </div>

            {/* ── Selected filter controls ── */}
            <Divider style={{ margin: '12px 0' }} />
            <div className={styles.controlRow}>
              <Text strong style={{ color: colors.text.secondary }}>
                当前选中：
              </Text>
              <Tag color={catalogItem(selectedType).tagColor} style={{ marginLeft: 8 }}>
                {catalogItem(selectedType).icon}{' '}
                {catalogItem(selectedType).label}
              </Tag>
            </div>

            {/* Numeric slider for parameterised filters */}
            {catalogItem(selectedType).hasSlider && (
              <div className={styles.sliderSection}>
                <div className={styles.sliderHeader}>
                  <Text type="secondary">强度</Text>
                  <Text code>
                    {sliderDraft[selectedType] ?? catalogItem(selectedType).sliderConfig!.default}
                  </Text>
                </div>
                <Slider
                  min={catalogItem(selectedType).sliderConfig!.min}
                  max={catalogItem(selectedType).sliderConfig!.max}
                  step={catalogItem(selectedType).sliderConfig!.step}
                  value={sliderDraft[selectedType] ?? catalogItem(selectedType).sliderConfig!.default}
                  onChange={(val) =>
                    setSliderDraft((prev) => ({ ...prev, [selectedType]: val }))
                  }
                  tooltip={{
                    formatter: (v) =>
                      `${catalogItem(selectedType).label} ${v ?? 0}`,
                  }}
                  marks={
                    catalogItem(selectedType).type === 'Grain'
                      ? {
                          0.01: '轻',
                          0.15: '中',
                          0.3: '重',
                        }
                      : catalogItem(selectedType).type === 'Blur'
                      ? {
                          0.5: '轻',
                          10: '中',
                          20: '强',
                        }
                      : undefined
                  }
                />
              </div>
            )}

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addToChain}
              disabled={isInChain(selectedType)}
              block
              style={{ marginTop: 12 }}
              className={styles.addButton}
            >
              {isInChain(selectedType)
                ? '该滤镜已在链中'
                : `添加「${catalogItem(selectedType).label}」`}
            </Button>
          </div>
        </Col>

        {/* ── Right: Live preview + chain list ── */}
        <Col xs={24} md={10}>
          {/* Preview pane */}
          <div className={styles.previewSection}>
            <Text type="secondary" className={styles.sectionLabel}>
              实时预览
            </Text>
            <div className={styles.previewPane}>
              <div
                className={styles.previewImage}
                style={{
                  backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : undefined,
                  filter: previewCssFilter,
                }}
              >
                {!thumbnailUrl && (
                  <div className={styles.previewPlaceholder}>
                    <EyeOutlined style={{ fontSize: 32, color: colors.text.tertiary }} />
                    <Text type="secondary">加载视频后预览</Text>
                  </div>
                )}
              </div>

              {chain.length > 0 && (
                <div className={styles.previewCssLabel}>
                  <Text type="secondary" style={{ fontSize: 10, fontFamily: 'monospace' }}>
                    {previewCssFilter}
                  </Text>
                </div>
              )}
            </div>

            {/* Preview + Apply buttons */}
            <div className={styles.previewActions}>
              <Button
                icon={<EyeOutlined />}
                onClick={handlePreview}
                loading={previewing}
                disabled={chain.length === 0 || !videoPath || externalLoading}
                className={styles.previewBtn}
              >
                生成预览
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleApply}
                loading={applying}
                disabled={chain.length === 0 || !videoPath || externalLoading}
                className={styles.applyBtn}
              >
                应用到视频
              </Button>
            </div>
          </div>

          {/* Chain list */}
          {chain.length > 0 && (
            <div className={styles.chainSection}>
              <Text type="secondary" className={styles.sectionLabel}>
                滤镜链 ({chain.length})
              </Text>
              <div className={styles.chainList}>
                {chain.map((node, idx) => {
                  const item = catalogItem(node.type);
                  return (
                    <div key={node.id} className={styles.chainNode}>
                      <div className={styles.chainNodeLeft}>
                        <Tag color={item.tagColor}>{item.icon}</Tag>
                        <Text strong style={{ color: colors.text.primary }}>
                          {item.label}
                        </Text>
                        {item.hasSlider && (
                          <Slider
                            size="small"
                            min={item.sliderConfig!.min}
                            max={item.sliderConfig!.max}
                            step={item.sliderConfig!.step}
                            value={node.value}
                            onChange={(val) => updateChainNode(node.id, val)}
                            style={{ width: 100, marginLeft: 8 }}
                            tooltip={{
                              formatter: (v) =>
                                `${item.label} ${v ?? 0}`,
                            }}
                          />
                        )}
                      </div>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeFromChain(node.id)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chain descriptions summary */}
          {chainDescriptions.length > 0 && (
            <div className={styles.chainSummary}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {chainDescriptions.join(' → ')}
              </Text>
            </div>
          )}
        </Col>
      </Row>

      {/* ── Loading overlay ── */}
      {(previewing || applying) && (
        <div className={styles.loadingOverlay}>
          <Spin
            size="large"
            tip={applying ? '正在应用滤镜，请稍候…' : '正在生成预览…'}
          />
        </div>
      )}
    </div>
  );
};

export default EffectsPanel;
