/**
 * AI 剪辑布局
 * 专为 AI 智能剪辑设计的专业布局
 * 三大核心功能：视频解说 | 第一人称 | AI混剪
 */
import React, { useState } from 'react';
import { Layout, Button, Tooltip, Space, Dropdown, Typography, Divider, Select, Slider, message, Badge } from 'antd';
import {
  ScissorOutlined,
  AudioOutlined,
  FontSizeOutlined,
  ThunderboltOutlined,
  ExportOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  UndoOutlined,
  RedoOutlined,
  VideoCameraOutlined,
  UserOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAIEditor, AIFeatureType } from './AIPanel/AIEditorContext';
import styles from './AILayout.module.less';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

interface AILayoutProps {
  children: React.ReactNode;
}

// 三大核心功能
const coreFunctions = [
  { 
    key: 'video-narration', 
    icon: <VideoCameraOutlined />, 
    label: '视频解说', 
    desc: '专业解说内容，适合教程评测',
    color: '#1890ff' 
  },
  { 
    key: 'first-person', 
    icon: <UserOutlined />, 
    label: '第一人称', 
    desc: '主播视角，互动感强',
    color: '#52c41a' 
  },
  { 
    key: 'remix', 
    icon: <EditOutlined />, 
    label: 'AI 混剪', 
    desc: '自动识别精彩片段，添加旁白',
    color: '#fa8c16' 
  },
];

// AI 功能列表
const aiFeatures = [
  { key: 'smartClip', icon: <ScissorOutlined />, label: '智能剪辑', desc: 'AI 自动识别精彩片段' },
  { key: 'voiceover', icon: <AudioOutlined />, label: '智能配音', desc: '文字转语音，音色可选' },
  { key: 'subtitle', icon: <FontSizeOutlined />, label: '字幕生成', desc: '自动识别语音生成字幕' },
  { key: 'effect', icon: <ThunderboltOutlined />, label: 'AI 特效', desc: '智能推荐视频特效' },
];

const AILayout: React.FC<AILayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { state, setFeature } = useAIEditor();
  const { isPlaying, selectedFeature, projectName, currentVideo } = state;

  // 处理核心功能切换
  const handleFunctionClick = (functionKey: string) => {
    message.info(`已切换到 ${functionKey} 模式`);
  };

  // 处理功能切换
  const handleFeatureClick = (featureKey: AIFeatureType) => {
    setFeature(featureKey);
  };

  // 处理导出
  const handleExport = () => {
    if (!currentVideo) {
      message.warning('请先上传视频');
      return;
    }
    message.info('导出功能开发中...');
  };

  // 渲染属性设置面板
  const renderPropsPanel = () => {
    switch (selectedFeature) {
      case 'smartClip':
        return (
          <div className={styles.propsSection}>
            <div className={styles.sectionTitle}>智能剪辑设置</div>
            <div className={styles.propItem}>
              <Text>剪辑模式</Text>
              <Select defaultValue="auto" style={{ width: 120 }}>
                <Option value="auto">自动精彩片段</Option>
                <Option value="manual">手动选择</Option>
                <Option value="highlight">高光时刻</Option>
              </Select>
            </div>
            <div className={styles.propItem}>
              <Text>目标时长</Text>
              <Slider 
                min={10} 
                max={300} 
                defaultValue={60} 
                style={{ width: '60%' }}
              />
              <Text type="secondary">60秒</Text>
            </div>
            <div className={styles.propItem}>
              <Text>检测静音</Text>
              <Select defaultValue="remove" style={{ width: 120 }}>
                <Option value="remove">移除</Option>
                <Option value="keep">保留</Option>
                <Option value="shorten">缩短</Option>
              </Select>
            </div>
            <div className={styles.propItem}>
              <Text>转场效果</Text>
              <Select defaultValue="fade" style={{ width: 120 }}>
                <Option value="fade">淡入淡出</Option>
                <Option value="cut">切换</Option>
                <Option value="dissolve">溶解</Option>
              </Select>
            </div>
          </div>
        );
      
      case 'voiceover':
        return (
          <div className={styles.propsSection}>
            <div className={styles.sectionTitle}>配音设置</div>
            <div className={styles.propItem}>
              <Text>音色选择</Text>
              <Select defaultValue="female" style={{ width: 120 }}>
                <Option value="female">女声</Option>
                <Option value="male">男声</Option>
                <Option value="neutral">中性</Option>
              </Select>
            </div>
            <div className={styles.propItem}>
              <Text>语言</Text>
              <Select defaultValue="zh-CN" style={{ width: 120 }}>
                <Option value="zh-CN">中文</Option>
                <Option value="en-US">英文</Option>
                <Option value="ja-JP">日文</Option>
              </Select>
            </div>
            <div className={styles.propItem}>
              <Text>语速</Text>
              <Slider 
                min={0.5} 
                max={2} 
                step={0.1}
                defaultValue={1} 
                style={{ width: '60%' }}
              />
              <Text type="secondary">1.0x</Text>
            </div>
            <div className={styles.propItem}>
              <Text>音量</Text>
              <Slider 
                min={0} 
                max={1} 
                step={0.1}
                defaultValue={0.8} 
                style={{ width: '60%' }}
              />
              <Text type="secondary">80%</Text>
            </div>
          </div>
        );
      
      case 'subtitle':
        return (
          <div className={styles.propsSection}>
            <div className={styles.sectionTitle}>字幕设置</div>
            <div className={styles.propItem}>
              <Text>字幕语言</Text>
              <Select defaultValue="zh" style={{ width: 120 }}>
                <Option value="zh">中文</Option>
                <Option value="en">英文</Option>
                <Option value="auto">自动识别</Option>
              </Select>
            </div>
            <div className={styles.propItem}>
              <Text>字幕样式</Text>
              <Select defaultValue="bottom" style={{ width: 120 }}>
                <Option value="bottom">底部居中</Option>
                <Option value="top">顶部居中</Option>
                <Option value="custom">自定义</Option>
              </Select>
            </div>
            <div className={styles.propItem}>
              <Text>字体大小</Text>
              <Slider 
                min={16} 
                max={48} 
                defaultValue={24} 
                style={{ width: '60%' }}
              />
              <Text type="secondary">24px</Text>
            </div>
            <div className={styles.propItem}>
              <Text>字幕颜色</Text>
              <Select defaultValue="white" style={{ width: 120 }}>
                <Option value="white">白色</Option>
                <Option value="yellow">黄色</Option>
                <Option value="black">黑色</Option>
              </Select>
            </div>
          </div>
        );
      
      case 'effect':
        return (
          <div className={styles.propsSection}>
            <div className={styles.sectionTitle}>特效设置</div>
            <div className={styles.propItem}>
              <Text>特效风格</Text>
              <Select defaultValue="auto" style={{ width: 120 }}>
                <Option value="auto">自动匹配</Option>
                <Option value="cinematic">电影感</Option>
                <Option value="vlog">Vlog</Option>
                <Option value="action">动作</Option>
              </Select>
            </div>
            <div className={styles.propItem}>
              <Text>滤镜强度</Text>
              <Slider 
                min={0} 
                max={100} 
                defaultValue={50} 
                style={{ width: '60%' }}
              />
              <Text type="secondary">50%</Text>
            </div>
            <div className={styles.propItem}>
              <Text>转场效果</Text>
              <Select defaultValue="fade" style={{ width: 120 }}>
                <Option value="fade">淡入淡出</Option>
                <Option value="zoom">缩放</Option>
                <Option value="slide">滑动</Option>
                <Option value="glitch">故障</Option>
              </Select>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Layout className={styles.aiLayout}>
      {/* 顶部工具栏 */}
      <Header className={styles.header}>
        <div className={styles.headerLeft}>
          <div 
            className={styles.logo} 
            onClick={() => navigate('/')}
          >
            <span className={styles.logoIcon}>🎬</span>
            <span className={styles.logoText}>ClipFlow</span>
          </div>
          <Divider type="vertical" />
          <Text className={styles.projectName}>未命名项目</Text>
        </div>
        
        <div className={styles.headerCenter}>
          <Space>
            <Tooltip title="撤销">
              <Button type="text" icon={<UndoOutlined />} />
            </Tooltip>
            <Tooltip title="重做">
              <Button type="text" icon={<RedoOutlined />} />
            </Tooltip>
            <Divider type="vertical" />
            <Tooltip title={isPlaying ? '暂停预览' : '播放预览'}>
              <Button 
                type="text" 
                icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={() => {
                  const { setPlaying } = useAIEditor();
                  setPlaying(!isPlaying);
                }}
                className={styles.playBtn}
              />
            </Tooltip>
          </Space>
        </div>
        
        <div className={styles.headerRight}>
          <Space>
            <Button type="primary" icon={<ExportOutlined />} onClick={handleExport}>
              导出视频
            </Button>
            <Tooltip title="设置">
              <Button type="text" icon={<SettingOutlined />} />
            </Tooltip>
          </Space>
        </div>
      </Header>
      
      <Layout>
        {/* 左侧 AI 功能面板 */}
        <Sider 
          width={260} 
          className={styles.aiPanel}
          theme="dark"
        >
          {/* 三大核心功能 */}
          <div className={styles.panelHeader}>
            <ThunderboltOutlined />
            <span>🎯 核心功能</span>
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
          
          <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.1)' }} />
          
          {/* AI 工具 */}
          <div className={styles.panelHeader}>
            <span>🛠️ AI 工具</span>
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
            <Text type="secondary" style={{ fontSize: 12 }}>
              选择核心功能开始创作
            </Text>
          </div>
        </Sider>
        
        {/* 中间内容区（视频预览 + 时间轴） */}
        <Content className={styles.mainContent}>
          {children}
        </Content>
        
        {/* 右侧属性面板 */}
        <Sider 
          width={280} 
          className={styles.propsPanel}
        >
          <div className={styles.panelHeader}>
            <SettingOutlined />
            <span>属性设置</span>
          </div>
          
          <div className={styles.propsContent}>
            {/* 根据选中功能显示不同属性 */}
            {renderPropsPanel()}
            
            <Button 
              type="primary" 
              block 
              className={styles.applyBtn}
              onClick={() => {
                message.success(`已切换到 ${aiFeatures.find(f => f.key === selectedFeature)?.label} 功能`);
              }}
            >
              应用设置
            </Button>
          </div>
        </Sider>
      </Layout>
    </Layout>
  );
};

export default AILayout;
