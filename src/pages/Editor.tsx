import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, 
  Button, 
  Space, 
  Tooltip, 
  Divider, 
  Tabs, 
  Input, 
  Slider,
  Dropdown,
  Menu,
  message,
  Spin
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  UploadOutlined,
  ScissorOutlined,
  AudioOutlined,
  FileImageOutlined,
  SettingOutlined,
  PlusOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  ExportOutlined,
  DownOutlined,
  RobotOutlined,
  LeftOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './Editor.module.less';

// 子组件
import Timeline from '../components/editor/Timeline';
import Preview from '../components/editor/Preview';
import AssetPanel from '../components/editor/AssetPanel';
import AIAssistant from '../components/editor/AIAssistant';

const { Header, Sider, Content } = Layout;

interface EditorProps {}

const Editor: React.FC<EditorProps> = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [project, setProject] = useState<any>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // 模拟加载项目数据
  useEffect(() => {
    const timer = setTimeout(() => {
      // 假设这是从API获取的项目数据
      setProject({
        id: id || 'new',
        name: id === 'new' ? '未命名项目' : `项目 ${id}`,
        duration: 120, // 2分钟
        resolution: { width: 1920, height: 1080 },
        fps: 30,
        tracks: [
          { id: 'video-1', name: '视频轨道 1', type: 'video', clips: [] },
          { id: 'audio-1', name: '音频轨道 1', type: 'audio', clips: [] },
        ]
      });
      setDuration(120);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [id]);

  // 播放/暂停视频
  const togglePlay = () => {
    setPlaying(!playing);
  };

  // 更新当前时间
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // 返回仪表盘
  const goBack = () => {
    navigate('/');
  };

  // 保存项目
  const saveProject = () => {
    message.success('项目已保存');
  };

  // 导出项目菜单
  const exportMenu = {
    items: [
      {
        key: '1',
        label: '导出为MP4 (高质量)',
      },
      {
        key: '2',
        label: '导出为MP4 (标准质量)',
      },
      {
        key: '3',
        label: '导出为GIF',
      },
      {
        key: '4',
        label: '导出音频',
      },
    ],
    onClick: (e: any) => {
      message.info(`准备导出: ${e.key}`);
    },
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" tip="正在加载项目..." />
      </div>
    );
  }

  return (
    <Layout className={styles.editorLayout}>
      <Header className={styles.editorHeader}>
        <div className={styles.headerLeft}>
          <Button 
            type="text" 
            icon={<LeftOutlined />} 
            onClick={goBack} 
            className={styles.backButton}
          >
            返回
          </Button>
          <Divider type="vertical" />
          <Input
            className={styles.projectTitle}
            bordered={false}
            placeholder="项目名称"
            defaultValue={project.name}
          />
        </div>
        <div className={styles.headerCenter}>
          <Space>
            <Button 
              type="text" 
              icon={<UndoOutlined />} 
              className={styles.toolbarButton}
              title="撤销"
            />
            <Button 
              type="text" 
              icon={<RedoOutlined />} 
              className={styles.toolbarButton}
              title="重做"
            />
            <Divider type="vertical" />
            <Button 
              type="text" 
              icon={<ScissorOutlined />} 
              className={styles.toolbarButton}
              title="剪切"
            />
            <Divider type="vertical" />
            <Button 
              type="text" 
              icon={playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />} 
              onClick={togglePlay}
              className={styles.playButton}
            />
            <div className={styles.timeDisplay}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </Space>
        </div>
        <div className={styles.headerRight}>
          <Space>
            <Button
              type="text"
              icon={<RobotOutlined />}
              onClick={() => setShowAIPanel(!showAIPanel)}
              className={`${styles.toolbarButton} ${showAIPanel ? styles.active : ''}`}
              title="AI助手"
            />
            <Button 
              type="text" 
              icon={<SaveOutlined />} 
              onClick={saveProject}
              className={styles.toolbarButton}
              title="保存"
            />
            <Dropdown menu={exportMenu} placement="bottomRight">
              <Button 
                type="primary" 
                icon={<ExportOutlined />}
              >
                导出 <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        </div>
      </Header>
      
      <Layout>
        <Sider
          width={300}
          collapsible
          collapsed={collapsed}
          trigger={null}
          className={styles.sider}
        >
          <div className={styles.siderHeader}>
            <div className={styles.siderTitle}>素材库</div>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className={styles.collapseButton}
            />
          </div>
          {!collapsed && <AssetPanel />}
        </Sider>
        
        <Content className={styles.content}>
          <div className={styles.mainArea}>
            <div className={styles.previewWrapper}>
              <Preview 
                playing={playing} 
                onTimeUpdate={handleTimeUpdate}
                ref={previewRef}
              />
            </div>
            <div className={styles.timelineWrapper}>
              <Timeline 
                currentTime={currentTime} 
                duration={duration}
                tracks={project.tracks}
                onTimeUpdate={handleTimeUpdate}
              />
            </div>
          </div>
          
          {showAIPanel && (
            <div className={styles.aiPanelWrapper}>
              <AIAssistant />
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default Editor; 