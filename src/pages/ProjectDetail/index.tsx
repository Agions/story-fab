import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, message, Modal, Spin, Typography, Menu, Space, Drawer, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  ArrowLeftOutlined, 
  DeleteOutlined, 
  SettingOutlined,
  EyeOutlined,
  AudioOutlined,
  FormOutlined,
  ScissorOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '@/store';
import { saveProjectToFile, getApiKey, loadProjectFromFile, deleteProject } from '@/services/tauriService';
import { useSettings } from '@/context/SettingsContext';
import { generateScriptWithModel, parseGeneratedScript } from '@/services/aiService';
import { resolveLegacyModel } from '@/services/aiModelAdapter';
import { normalizeProjectFile } from '@/core/utils/project-file';
import type { ProjectFileLike } from '@/core/utils/project-file';
import type { Script } from '@/services/aiService';
import type { VideoSegment } from '@/services/videoService';
import type { VideoAnalysis } from '@/types';
import type { ScriptEditorOriginalProps } from '@/components/ScriptEditor/types';
import styles from './index.module.less';

const { Title, Text } = Typography;
const loadVideoInfo = () => import('@/components/VideoInfo');
const loadScriptEditor = () => import('@/components/ScriptEditor');
const loadVideoProcessingController = () => import('@/components/VideoProcessingController');
const loadVideoAnalyzer = () => import('@/components/VideoAnalyzer');
const loadSubtitleExtractor = () => import('@/components/SubtitleExtractor');

const VideoInfo = lazy(loadVideoInfo);
const ScriptEditor = lazy(loadScriptEditor);
const VideoProcessingController = lazy(loadVideoProcessingController);
const VideoAnalyzer = lazy(loadVideoAnalyzer);
const SubtitleExtractor = lazy(loadSubtitleExtractor);

interface ProjectData extends ProjectFileLike<Script, { path?: string }> {
  id: string;
  name: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt: string;
  videoPath?: string;
  videos?: Array<{ path?: string }>;
  videoUrl?: string;
  scripts?: Script[];
  analysis?: VideoAnalysis;
  extractedSubtitles?: unknown;
}

const toVideoSegments = (script: Script | null): VideoSegment[] =>
  script?.content.map((segment) => ({
    start: segment.startTime,
    end: segment.endTime,
    type: segment.type,
    content: segment.content
  })) ?? [];

const toScriptSegments = (segments: VideoSegment[]) =>
  segments.map((segment) => ({
    id: uuidv4(),
    startTime: segment.start,
    endTime: segment.end,
    content: segment.content ?? '',
    type: (segment.type as Script['content'][number]['type']) || 'narration'
  }));

const StepFallback: React.FC = () => (
  <div className={styles.spinner}>
    <Spin size="large" />
  </div>
);

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { addRecentProject } = useSettings();
  const { selectedAIModel, aiModelsSettings } = useStore();
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<string>('analyze');
  const [project, setProject] = useState<ProjectData | null>(null);
  const [activeScript, setActiveScript] = useState<Script | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    // 预加载当前步骤常见的下一步组件，降低切换等待时间
    switch (activeStep) {
      case 'analyze':
        void loadSubtitleExtractor();
        break;
      case 'subtitle':
        void loadScriptEditor();
        break;
      case 'script':
        void loadVideoProcessingController();
        break;
      case 'edit':
        void loadVideoInfo();
        break;
      default:
        break;
    }
  }, [activeStep]);

  useEffect(() => {
    if (activeScript) {
      // 脚本存在时优先预热编辑器模块
      void loadScriptEditor();
    }
  }, [activeScript]);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    loadProjectFromFile<ProjectData>(projectId)
      .then((currentProject) => {
        const normalizedProject = normalizeProjectFile(currentProject);
        setProject(normalizedProject);
        addRecentProject(normalizedProject.id);
        if (normalizedProject.scripts && normalizedProject.scripts.length > 0) {
          setActiveScript(normalizedProject.scripts[0]);
        }
      })
      .catch((error) => {
        console.error('加载项目失败:', error);
        message.error('找不到项目信息');
        navigate('/projects');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [addRecentProject, projectId, navigate]);

  const handleDeleteProject = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此项目吗？此操作不可撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        if (!projectId) return;
        try {
          await deleteProject(projectId);
          message.success('项目已删除');
          navigate('/projects');
        } catch {
          message.error('删除项目失败');
        }
      }
    });
  };

  const handleCreateScript = (): void => {
    if (!project) return;
    try {
      const newScript: Script = {
        id: uuidv4(),
        projectId: project.id,
        content: [],
        fullText: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const updatedProject = {
        ...project,
        scripts: [...(project.scripts || []), newScript],
        updatedAt: new Date().toISOString()
      };
  
      setProject(updatedProject);
      setActiveScript(newScript);
      
      message.loading({ content: '正在保存...', key: 'save' });
      saveProjectToFile(updatedProject.id, updatedProject).then(() => {
        message.success({ content: '脚本创建成功', key: 'save' });
      }).catch(() => {
        message.error({ content: '保存失败', key: 'save' });
      });
    } catch {
      message.error('创建失败');
    }
  };

  const handleGenerateScript = async () => {
    if (!project || !project.analysis) {
      message.warning('项目缺少分析数据，请先完成【画面识别】步骤');
      return;
    }
    
    try {
      setAiLoading(true);
      const modelSettings = aiModelsSettings[selectedAIModel];
      if (!modelSettings?.enabled) {
        message.warning(`请在设置中启用 ${selectedAIModel} 模型`);
        return;
      }
      
      const apiKey = await getApiKey(selectedAIModel);
      if (!apiKey) {
        message.warning(`缺少 ${selectedAIModel} 的API密钥`);
        return;
      }
      
      message.loading({ content: 'AI正在创作脚本...', key: 'ai' });
      const compatibleModel = resolveLegacyModel(selectedAIModel);
      const scriptText = await generateScriptWithModel(
        compatibleModel,
        apiKey,
        project.analysis,
        { style: 'informative' }
      );
      const generatedScript = parseGeneratedScript(scriptText, project.id);
      
      const scriptWithModelInfo = {
        ...generatedScript,
        modelUsed: selectedAIModel
      };
      
      const updatedProject = {
        ...project,
        scripts: [...(project.scripts || []), scriptWithModelInfo],
        updatedAt: new Date().toISOString()
      };
      
      setProject(updatedProject);
      setActiveScript(scriptWithModelInfo);
      
      await saveProjectToFile(updatedProject.id, updatedProject);
      message.success({ content: 'AI脚本生成完毕✨', key: 'ai' });
    } catch (error) {
      message.error({
        content: `生成失败: ${error instanceof Error ? error.message : '未知错误'}`,
        key: 'ai'
      });
    } finally {
      setAiLoading(false);
    }
  };

  const menuItems: MenuProps['items'] = [
    { key: 'analyze', icon: <EyeOutlined />, label: '画面识别 (Frame Analysis)' },
    { key: 'subtitle', icon: <FormOutlined />, label: '字幕提取 (Subtitle Ext)' },
    { key: 'script', icon: <DashboardOutlined />, label: '脚本生成 (AI Script)' },
    { key: 'sync', icon: <AudioOutlined />, label: '音画同步 (A/V Sync)' },
    { key: 'edit', icon: <ScissorOutlined />, label: '视频混剪 (Video Output)' },
  ];

  if (loading) return <div className={styles.spinner}><Spin size="large" /></div>;
  if (!project) return null;

  const renderContent = (): React.ReactNode => {
    switch (activeStep) {
      case 'analyze':
        return (
          <div>
            <Suspense fallback={<StepFallback />}>
              <VideoAnalyzer
                projectId={project.id}
                videoUrl={project.videoUrl}
                onAnalysisComplete={(analysis) => {
                  const updated = { ...project, analysis };
                  setProject(updated);
                  saveProjectToFile(updated.id, updated);
                  message.success('画面识别已完成并保存');
                }}
              />
            </Suspense>
          </div>
        );
      case 'subtitle':
        return (
          <div>
            <Suspense fallback={<StepFallback />}>
              <SubtitleExtractor
                projectId={project.id}
                videoUrl={project.videoUrl}
                onExtracted={(subtitles) => {
                  const updated = { ...project, extractedSubtitles: subtitles };
                  setProject(updated);
                  saveProjectToFile(updated.id, updated);
                }}
              />
            </Suspense>
          </div>
        );
      case 'script':
        return (
          <div>
            <div className={styles.scriptHeader}>
              <Title level={4}>AI驱动脚本编辑</Title>
              <Space>
                <Button loading={aiLoading} onClick={handleGenerateScript} type="primary" className={styles.premiumBtn}>AI 一键生成</Button>
                <Button onClick={handleCreateScript} className={styles.premiumBtn}>新建空脚本</Button>
              </Space>
            </div>
            {activeScript ? (
              <Suspense fallback={<StepFallback />}>
                <ScriptEditor
                  videoPath={project.videoUrl ?? ''}
                  initialSegments={toVideoSegments(activeScript)}
                  onSave={(updatedSegments: Parameters<ScriptEditorOriginalProps['onSave']>[0]) => {
                    const updatedScript: Script = {
                      ...activeScript,
                      content: toScriptSegments(updatedSegments),
                      fullText: updatedSegments.map((segment) => segment.content ?? '').join('\n\n'),
                      updatedAt: new Date().toISOString()
                    };
                    const updatedProject = {
                      ...project,
                      scripts: (project.scripts ?? []).map((script) =>
                        script.id === activeScript.id ? updatedScript : script
                      )
                    };
                    setActiveScript(updatedScript);
                    setProject(updatedProject);
                    saveProjectToFile(updatedProject.id, updatedProject);
                  }}
                />
              </Suspense>
            ) : (
              <div className={styles.emptyScript}>
                <Text type="secondary">暂无脚本，请点击上方按钮生成或创建</Text>
              </div>
            )}
          </div>
        );
      case 'sync':
        return (
          <div className={styles.placeholderSection}>
             <div className={styles.iconWrapper}><AudioOutlined /></div>
             <Title level={3}>全自动音画同步引擎</Title>
             <Text>结合TTS合成声音与画面关键帧自动对齐，提供影院级配音体验。</Text>
             <Button type="primary" size="large" className={styles.premiumBtn} onClick={() => message.info('功能开发中，敬请期待！')}>即将推出</Button>
          </div>
        );
      case 'edit':
        return (
          <div>
            <Suspense fallback={<StepFallback />}>
              <VideoProcessingController
                videoPath={project.videoUrl ?? ''}
                segments={toVideoSegments(activeScript)}
              />
            </Suspense>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Space>
          <Tooltip title="返回项目列表">
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')} size="large" />
          </Tooltip>
          <div className={styles.titleArea}>
            <Text type="secondary" style={{ fontSize: '12px' }}>当前工作区</Text>
            <Title level={2}>{project.name}</Title>
          </div>
        </Space>
        
        <Space>
          <Button icon={<SettingOutlined />} onClick={() => setDrawerVisible(true)} className={styles.premiumBtn}>
            项目信息
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDeleteProject} className={styles.premiumBtn}>
            删除
          </Button>
        </Space>
      </div>

      <div className={styles.workflowContainer}>
        <div className={styles.sidebar}>
          <div className={styles.stepCard}>
            <Menu
              mode="vertical"
              selectedKeys={[activeStep]}
              className={styles.stepMenu}
              items={menuItems}
              onSelect={({ key }) => setActiveStep(String(key))}
            />
          </div>
        </div>

        <div className={styles.contentArea}>
          <div className={styles.activeContent}>
            {renderContent()}
          </div>
        </div>
      </div>

      <Drawer
        title="详细信息与媒体属性"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={400}
      >
        {project.description && (
          <div style={{ marginBottom: 24 }}>
            <Title level={5}>项目描述</Title>
            <Text type="secondary">{project.description}</Text>
          </div>
        )}
        <Suspense fallback={<StepFallback />}>
          <VideoInfo
            name={project.name}
            path={project.videoUrl}
            duration={project.analysis?.duration || 0}
          />
        </Suspense>
      </Drawer>
    </div>
  );
};

export default ProjectDetail;
