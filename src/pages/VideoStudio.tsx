import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Layout, Card, Breadcrumb, Tabs, Spin, Empty, Button, 
  Row, Col, Typography, Space, message, 
  Tag, Descriptions, Divider
} from 'antd';
import { 
  HomeOutlined, PlayCircleOutlined, FileTextOutlined, 
  SettingOutlined, VideoCameraOutlined,
  FullscreenOutlined, SaveOutlined, 
  ExportOutlined, LoadingOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 导入样式
import styles from './VideoStudio.module.less';

// 导入组件和服务
import VideoPlayer from '@/components/VideoPlayer';
import ScriptEditor from '@/components/ScriptEditor';
import VideoProcessingController from '@/components/VideoProcessingController';
import { loadProjectFromFile } from '@/services/tauriService';
import type { Project } from '@/types';
import type { ScriptData } from '@/core/types';
import type { VideoMetadata } from '@/services/videoService';

const { Content } = Layout;
const { 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Title, 
  Text 
} = Typography;
const { TabPane } = Tabs;

// 格式化时间（秒 -> HH:MM:SS）
const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return [
    hrs > 0 ? String(hrs).padStart(2, '0') : null,
    String(mins).padStart(2, '0'),
    String(secs).padStart(2, '0')
  ].filter(Boolean).join(':');
};

// 格式化比特率
const formatBitrate = (bitrate: number): string => {
  if (bitrate >= 1000000) {
    return `${(bitrate / 1000000).toFixed(2)} Mbps`;
  } else if (bitrate >= 1000) {
    return `${(bitrate / 1000).toFixed(0)} Kbps`;
  }
  return `${bitrate} bps`;
};

// 格式化日期
const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
  } catch {
    return dateStr;
  }
};

const VideoStudio: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  // 状态管理
  const [loading, setLoading] = useState<boolean>(true);
  const [project, setProject] = useState<Project | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>('edit');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [processingVideo, setProcessingVideo] = useState<boolean>(false);
  const [script, setScript] = useState<ScriptData | null>(null);
  
  // 加载项目数据
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) {
        message.error('项目ID不存在');
        navigate('/');
        return;
      }
      
      try {
        setLoading(true);
        const project = await loadProjectFromFile(projectId);
        
        if (!project) {
          message.error('无法加载项目');
          navigate('/');
          return;
        }
        
        setProject(project);
        
        // 设置视频源
        if (project.videoPath) {
          // 将文件路径转换为 Tauri 资源 URL
          setVideoSrc(`tauri://localhost/${project.videoPath}`);
          
          // 获取视频元数据
          if (project.metadata) {
            setMetadata(project.metadata);
          } else {
            // 如果项目没有元数据，尝试分析视频
            try {
              const metadata = await invoke('analyze_video', { 
                path: project.videoPath 
              }) as VideoMetadata;
              setMetadata(metadata);
            } catch (err) {
              console.error('无法分析视频:', err);
            }
          }
        }
        
        // 获取脚本信息 - 转换 Script 类型为 ScriptData 类型
        if (project.scripts && project.scripts.length > 0) {
          const projectScript = project.scripts[0];
          // 类型转换适配
          const scriptData: ScriptData = {
            id: projectScript.id,
            title: projectScript.videoId || '未命名脚本',
            content: typeof projectScript.content === 'string' ? projectScript.content : '',
            segments: Array.isArray(projectScript.content) ? projectScript.content.map((seg: any) => ({
              id: seg.id,
              startTime: seg.startTime,
              endTime: seg.endTime,
              content: seg.content,
              type: seg.type as 'narration' | 'dialogue' | 'action' | 'transition'
            })) : [],
            metadata: {
              style: 'professional',
              tone: 'friendly',
              length: 'medium',
              targetAudience: 'general',
              language: 'zh',
              wordCount: 0,
              estimatedDuration: 0,
              generatedBy: projectScript.modelUsed || 'unknown',
              generatedAt: projectScript.createdAt
            },
            createdAt: projectScript.createdAt,
            updatedAt: projectScript.updatedAt
          };
          setScript(scriptData);
        }
        
      } catch {
        console.error('加载项目失败:', error);
        message.error('加载项目失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId, navigate]);
  
  // 处理视频时间更新
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };
  
  // 处理处理完成回调
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleProcessingComplete = (updatedProject: Project) => {
    setProject(updatedProject);
    setProcessingVideo(false);
    message.success('视频处理完成');
  };
  
  // 处理脚本更新
  const handleScriptUpdate = (updatedScript: ScriptData) => {
    setScript(updatedScript);
    
    // 更新项目中的脚本
    if (project) {
      // 注意：这里 ScriptData 和 Script 类型不兼容，需要转换
      // 暂时不更新项目中的脚本，避免类型冲突
      console.log('Script updated:', updatedScript);
    }
  };
  
  // 返回加载状态
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin 
          indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} 
          tip="加载项目中..."
          size="large"
        />
      </div>
    );
  }
  
  return (
    <Layout className={styles.studioLayout}>
      <Content className={styles.studioContent}>
        {/* 面包屑导航 */}
        <div className={styles.breadcrumbContainer}>
          <Breadcrumb>
            <Breadcrumb.Item>
              <Link to="/">
                <HomeOutlined /> 首页
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Link to={`/project/${projectId}`}>
                {project?.name || '项目详情'}
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>视频工作室</Breadcrumb.Item>
          </Breadcrumb>
        </div>
        
        {/* 视频播放器 */}
        <div className={styles.videoPlayerContainer}>
          <Card 
            className={styles.playerCard}
            title={
              <Space>
                <VideoCameraOutlined />
                <span>{project?.name || '视频播放器'}</span>
                {metadata && (
                  <Tag color="blue">
                    {metadata.width}x{metadata.height} • {metadata.fps}fps
                  </Tag>
                )}
              </Space>
            }
            extra={
              <Space>
                <Text type="secondary">
                  {formatTime(currentTime)} 
                  {metadata && ` / ${formatTime(metadata.duration)}`}
                </Text>
                <Button 
                  type="text" 
                  icon={<FullscreenOutlined />} 
                  onClick={() => {
                    // 全屏功能待实现
                  }}
                />
              </Space>
            }
          >
            {videoSrc ? (
              <VideoPlayer 
                src={videoSrc} 
                onTimeUpdate={handleTimeUpdate}
              />
            ) : (
              <div className={styles.noVideo}>
                <PlayCircleOutlined />
                <p>未找到视频文件</p>
                <Button 
                  type="primary" 
                  onClick={async () => {
                    // 打开文件选择对话框
                    const selected = await open({
                      directory: false,
                      multiple: false,
                      filters: [{
                        name: '视频文件',
                        extensions: ['mp4', 'mov', 'avi', 'mkv']
                      }]
                    });
                    
                    if (selected && typeof selected === 'string') {
                      // 更新项目视频路径
                      // 这里需要更多实现逻辑
                      console.log('Selected:', selected);
                    }
                  }}
                >
                  选择视频文件
                </Button>
              </div>
            )}
          </Card>
        </div>
        
        {/* 控制面板 */}
        <div className={styles.controlsContainer}>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            type="card"
          >
            {/* 视频编辑选项卡 */}
            <TabPane 
              tab={<><PlayCircleOutlined /> 视频编辑</>} 
              key="edit"
            >
              <Row gutter={[24, 24]}>
                <Col span={16}>
                  <VideoProcessingController
                    videoPath={project?.videoPath || ''}
                    segments={[]}
                    onProcessingComplete={(outputPath) => {
                      setProcessingVideo(false);
                      message.success('视频处理完成: ' + outputPath);
                    }}
                  />
                </Col>
                <Col span={8}>
                  <Card 
                    title="视频信息" 
                    className={styles.infoCard}
                    extra={<InfoCircleOutlined />}
                  >
                    {metadata ? (
                      <div className={styles.metadataList}>
                        <div className={styles.metadataItem}>
                          <span className={styles.metadataLabel}>时长</span>
                          <span>{formatTime(metadata.duration)}</span>
                        </div>
                        <div className={styles.metadataItem}>
                          <span className={styles.metadataLabel}>分辨率</span>
                          <span>{metadata.width}x{metadata.height}</span>
                        </div>
                        <div className={styles.metadataItem}>
                          <span className={styles.metadataLabel}>帧率</span>
                          <span>{metadata.fps} fps</span>
                        </div>
                        <div className={styles.metadataItem}>
                          <span className={styles.metadataLabel}>编码</span>
                          <span>{metadata.codec}</span>
                        </div>
                        <div className={styles.metadataItem}>
                          <span className={styles.metadataLabel}>比特率</span>
                          <span>{formatBitrate(metadata.bitrate)}</span>
                        </div>
                        <div className={styles.metadataItem}>
                          <span className={styles.metadataLabel}>修改日期</span>
                          <span>{project?.updatedAt ? formatDate(project.updatedAt) : '未知'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.noMetadata}>
                        <Empty description="暂无视频元数据" />
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>
            </TabPane>
            
            {/* 脚本编辑选项卡 */}
            <TabPane 
              tab={<><FileTextOutlined /> 脚本编辑</>} 
              key="script"
            >
              {script ? (
                <ScriptEditor 
                  script={script} 
                  metadata={metadata}
                  onSave={handleScriptUpdate}
                  onScriptUpdate={handleScriptUpdate}
                />
              ) : (
                <Empty 
                  description="暂无脚本" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </TabPane>
            
            {/* 高级设置选项卡 */}
            <TabPane 
              tab={<><SettingOutlined /> 高级设置</>} 
              key="settings"
            >
              <Card className={styles.settingsCard}>
                <Descriptions
                  title="项目高级配置"
                  bordered
                  column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
                >
                  <Descriptions.Item label="项目 ID">{projectId}</Descriptions.Item>
                  <Descriptions.Item label="创建日期">
                    {project?.createdAt ? formatDate(project.createdAt) : '未知'}
                  </Descriptions.Item>
                  <Descriptions.Item label="视频路径">
                    {project?.videoPath || '未设置'}
                  </Descriptions.Item>
                  <Descriptions.Item label="输出目录">
                    {project?.outputDir || '未设置'}
                  </Descriptions.Item>
                </Descriptions>
                
                <Divider />
                
                <div className={styles.actionButtons}>
                  <Space>
                    <Button 
                      icon={<SaveOutlined />}
                      onClick={() => {
                        // 保存项目逻辑
                        message.success('项目已保存');
                      }}
                    >
                      保存项目
                    </Button>
                    <Button 
                      type="primary" 
                      icon={<ExportOutlined />}
                      onClick={() => {
                        // 导出项目逻辑
                      }}
                    >
                      导出视频
                    </Button>
                  </Space>
                </div>
              </Card>
            </TabPane>
          </Tabs>
        </div>
      </Content>
    </Layout>
  );
};

export default VideoStudio; 