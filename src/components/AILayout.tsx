/**
 * AI 剪辑布局
 * 专为 AI 智能剪辑设计的专业布局
 * 三大核心功能：视频解说 | 第一人称 | AI混剪
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
  Scissors,
  Volume2,
  Type,
  Zap,
  Download,
  Settings,
  Play,
  Pause,
  Undo,
  Redo,
  Video,
  User,
  Edit,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAIEditor, AIFeatureType } from './CutDeck/AIEditorContext';
import { notify } from '@/shared';
import styles from './AILayout.module.less';

const coreFunctions = [
  {
    key: 'video-narration',
    icon: <Video size={20} />,
    label: '视频解说',
    desc: '专业解说内容，适合教程评测',
    color: '#1890ff'
  },
  {
    key: 'first-person',
    icon: <User size={20} />,
    label: '第一人称',
    desc: '主播视角，互动感强',
    color: '#52c41a'
  },
  {
    key: 'remix',
    icon: <Edit size={20} />,
    label: 'AI 混剪',
    desc: '自动识别精彩片段，添加旁白',
    color: '#fa8c16'
  },
];

const aiFeatures = [
  { key: 'smartClip', icon: <Scissors size={16} />, label: '智能剪辑', desc: 'AI 自动识别精彩片段' },
  { key: 'voiceover', icon: <Volume2 size={16} />, label: '智能配音', desc: '文字转语音，音色可选' },
  { key: 'subtitle', icon: <Type size={16} />, label: '字幕生成', desc: '自动识别语音生成字幕' },
  { key: 'effect', icon: <Zap size={16} />, label: 'AI 特效', desc: '智能推荐视频特效' },
];

interface AILayoutProps {
  children: React.ReactNode;
}

const AILayout: React.FC<AILayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { state, setFeature, setPlaying } = useAIEditor();
  const { isPlaying, selectedFeature, currentVideo } = state;

  const handleFunctionClick = (functionKey: string) => {
    notify.info(`已切换到 ${functionKey} 模式`);
  };

  const handleFeatureClick = (featureKey: AIFeatureType) => {
    setFeature(featureKey);
  };

  const handleExport = () => {
    if (!currentVideo) {
      notify.warning('请先上传视频');
      return;
    }
    notify.info('导出功能开发中...');
  };

  const renderPropsPanel = () => {
    switch (selectedFeature) {
      case 'smartClip':
        return (
          <div className={styles.propsSection}>
            <div className={styles.sectionTitle}>智能剪辑设置</div>
            <div className={styles.propItem}>
              <span className="text-sm text-text-secondary">剪辑模式</span>
              <select className="h-8 rounded-md border border-input bg-background px-2 text-sm w-28">
                <option value="auto">自动精彩片段</option>
                <option value="manual">手动选择</option>
                <option value="highlight">高光时刻</option>
              </select>
            </div>
            <div className={styles.propItem}>
              <span className="text-sm text-text-secondary">目标时长</span>
              <Slider min={10} max={300} defaultValue={60} className="flex-1" />
              <span className="text-xs text-muted-foreground w-10">60秒</span>
            </div>
            <div className={styles.propItem}>
              <span className="text-sm text-text-secondary">检测静音</span>
              <select className="h-8 rounded-md border border-input bg-background px-2 text-sm w-28">
                <option value="remove">移除</option>
                <option value="keep">保留</option>
                <option value="shorten">缩短</option>
              </select>
            </div>
            <div className={styles.propItem}>
              <span className="text-sm text-text-secondary">转场效果</span>
              <select className="h-8 rounded-md border border-input bg-background px-2 text-sm w-28">
                <option value="fade">淡入淡出</option>
                <option value="cut">切换</option>
                <option value="dissolve">溶解</option>
              </select>
            </div>
          </div>
        );

      case 'voiceover':
        return (
          <div className={styles.propsSection}>
            <div className={styles.sectionTitle}>配音设置</div>
            <div className={styles.propItem}>
              <span className="text-sm text-text-secondary">音色选择</span>
              <select className="h-8 rounded-md border border-input bg-background px-2 text-sm w-28">
                <option value="female">女声</option>
                <option value="male">男声</option>
                <option value="neutral">中性</option>
              </select>
            </div>
            <div className={styles.propItem}>
              <span className="text-sm text-text-secondary">语言</span>
              <select className="h-8 rounded-md border border-input bg-background px-2 text-sm w-28" value="zh-CN">
                <option value="zh-CN">中文</option>
              </select>
            </div>
            <div className={styles.propItem}>
              <span className="text-sm text-text-secondary">语速</span>
              <Slider min={0.5} max={2} step={0.1} defaultValue={1} className="flex-1" />
              <span className="text-xs text-muted-foreground w-10">1.0x</span>
            </div>
            <div className={styles.propItem}>
              <span className="text-sm text-text-secondary">音量</span>
              <Slider min={0} max={1} step={0.1} defaultValue={0.8} className="flex-1" />
              <span className="text-xs text-muted-foreground w-10">80%</span>
            </div>
          </div>
        );

      case 'subtitle':
        return (
          <div className={styles.propsSection}>
            <div className={styles.sectionTitle}>字幕设置</div>
            <div className={styles.propItem}>
              <span className="text-sm text-text-secondary">字幕语言</span>
              <select className="h-8 rounded-md border border-input bg-background px-2 text-sm w-28">
                <option value="zh">中文</option>
                <option value="auto">自动识别</option>
              </select>
            </div>
            <div className={styles.propItem}>
              <span className="text-sm text-text-secondary">字幕样式</span>
              <select className="h-8 rounded-md border border-input bg-background px-2 text-sm w-28">
                <option value="bottom">底部居中</option>
                <option value="top">顶部居中</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            <div className={styles.propItem}>
              <span className="text-sm text-text-secondary">字体大小</span>
              <Slider min={16} max={48} defaultValue={24} className="flex-1" />
              <span className="text-xs text-muted-foreground w-10">24px</span>
            </div>
            <div className={styles.propItem}>
              <span className="text-sm text-text-secondary">字幕颜色</span>
              <select className="h-8 rounded-md border border-input bg-background px-2 text-sm w-28">
                <option value="white">白色</option>
                <option value="yellow">黄色</option>
                <option value="black">黑色</option>
              </select>
            </div>
          </div>
        );

      case 'effect':
        return (
          <div className={styles.propsSection}>
            <div className={styles.sectionTitle}>特效设置</div>
            <div className={styles.propItem}>
              <span className="text-sm text-text-secondary">特效风格</span>
              <select className="h-8 rounded-md border border-input bg-background px-2 text-sm w-28">
                <option value="auto">自动匹配</option>
                <option value="cinematic">电影感</option>
                <option value="vlog">Vlog</option>
                <option value="action">动作</option>
              </select>
            </div>
            <div className={styles.propItem}>
              <span className="text-sm text-text-secondary">滤镜强度</span>
              <Slider min={0} max={100} defaultValue={50} className="flex-1" />
              <span className="text-xs text-muted-foreground w-10">50%</span>
            </div>
            <div className={styles.propItem}>
              <span className="text-sm text-text-secondary">转场效果</span>
              <select className="h-8 rounded-md border border-input bg-background px-2 text-sm w-28">
                <option value="fade">淡入淡出</option>
                <option value="zoom">缩放</option>
                <option value="slide">滑动</option>
                <option value="glitch">故障</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.aiLayout}>
      {/* 顶部工具栏 */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div
            className={styles.logo}
            onClick={() => navigate('/')}
          >
            <span className={styles.logoIcon} aria-hidden="true">🎬</span>
            <span className={styles.logoText}>CutDeck</span>
          </div>
          <div className="w-px h-5 bg-border mx-3" />
          <span className="text-sm text-text-secondary">未命名项目</span>
        </div>

        <div className={styles.headerCenter}>
          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger render={<Button variant="ghost" size="icon-sm" />}>
                  <Undo size={16} />
                </TooltipTrigger>
                <TooltipContent>撤销</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger render={<Button variant="ghost" size="icon-sm" />}>
                  <Redo size={16} />
                </TooltipTrigger>
                <TooltipContent>重做</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
          <div className="w-px h-5 bg-border mx-3" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={<Button variant="ghost" size="icon-sm" />}
                onClick={() => setPlaying(!isPlaying)}
                className={styles.playBtn}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </TooltipTrigger>
              <TooltipContent>{isPlaying ? '暂停预览' : '播放预览'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className={styles.headerRight}>
          <div className="flex items-center gap-2">
            <Button className="bg-[--accent-primary] hover:bg-[--accent-primary-hover] text-white" onClick={handleExport}>
              <Download size={14} className="mr-1" />
              导出视频
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger render={<Button variant="ghost" size="icon-sm" />}>
                  <Settings size={16} />
                </TooltipTrigger>
                <TooltipContent>设置</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>

      <div className={styles.layoutBody}>
        {/* 左侧 AI 功能面板 */}
        <aside className={styles.aiPanel}>
          {/* 三大核心功能 */}
          <div className={styles.panelHeader}>
            <Zap size={14} />
            <span aria-hidden="true">🎯 核心功能</span>
          </div>

          <div className={styles.functionList}>
            {coreFunctions.map((func) => (
              <div
                key={func.key}
                className={styles.functionItem}
                onClick={() => handleFunctionClick(func.key)}
              >
                <div className={styles.functionIcon} style={{ color: func.color }}>
                  {func.icon}
                </div>
                <div className={styles.functionInfo}>
                  <div className={styles.functionLabel}>{func.label}</div>
                  <div className={styles.functionDesc}>{func.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-px bg-white/10 my-3" />

          {/* AI 工具 */}
          <div className={styles.panelHeader}>
            <span aria-hidden="true">🛠️ AI 工具</span>
          </div>

          <div className={styles.featureList}>
            {aiFeatures.map((feature) => (
              <div
                key={feature.key}
                className={`${styles.featureItem} ${selectedFeature === feature.key ? styles.active : ''}`}
                onClick={() => handleFeatureClick(feature.key as AIFeatureType)}
              >
                <div className={styles.featureIcon}>{feature.icon}</div>
                <div className={styles.featureInfo}>
                  <div className={styles.featureLabel}>{feature.label}</div>
                  <div className={styles.featureDesc}>{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.panelFooter}>
            <span className="text-xs text-muted-foreground">
              选择核心功能开始创作
            </span>
          </div>
        </aside>

        {/* 中间内容区（视频预览 + 时间轴） */}
        <main className={styles.mainContent}>
          {children}
        </main>

        {/* 右侧属性面板 */}
        <aside className={styles.propsPanel}>
          <div className={styles.panelHeader}>
            <Settings size={14} />
            <span>属性设置</span>
          </div>

          <div className={styles.propsContent}>
            {renderPropsPanel()}

            <Button
              className="bg-[--accent-primary] hover:bg-[--accent-primary-hover] text-white w-full"
              onClick={() => {
                notify.success(`已切换到 ${aiFeatures.find(f => f.key === selectedFeature)?.label} 功能`);
              }}
            >
              应用设置
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AILayout;
