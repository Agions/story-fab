import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, message, Modal, Spin, Typography, Menu, Space, Drawer, Tooltip } from 'antd';
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
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/index';
import VideoInfo from '@/components/VideoInfo';
import ScriptEditor from '@/components/ScriptEditor';
import VideoProcessingController from '@/components/VideoProcessingController';
import VideoAnalyzer from '@/components/VideoAnalyzer';
import SubtitleExtractor from '@/components/SubtitleExtractor';
import { saveProjectToFile, getApiKey } from '@/services/tauriService';
import { generateScriptWithModel, parseGeneratedScript } from '@/services/aiService';
import styles from './ProjectDetail.module.less';

const { Title, Text } = Typography;

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, updateProject, deleteProject, selectedAIModel, aiModelsSettings } = useStore();
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<string>('analyze');
  const [project, setProject] = useState<any>(null);
  const [activeScript, setActiveScript] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    if (!id) return;
    const currentProject = projects.find(p => p.id === id);
    if (currentProject) {
      setProject(currentProject);
      if (currentProject.scripts && currentProject.scripts.length > 0) {
        setActiveScript(currentProject.scripts[0]);
      }
    } else {
      message.error('找不到项目信息');
      navigate('/projects');
    }
    setLoading(false);
  }, [id, projects, navigate]);

  const handleDeleteProject = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此项目吗？此操作不可撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        if (!id) return;
        try {
          deleteProject(id);
          message.success('项目已删除');
          navigate('/projects');
        } catch {
          message.error('删除项目失败');
        }
      }
    });
  };

  const handleCreateScript = () => {
    if (!project) return;
    try {
      const newScript = {
        id: uuidv4(),
        videoId: project.id,
        content: [],
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
        updateProject(updatedProject);
        message.success({ content: '脚本创建成功', key: 'save' });
      }).catch(() => {
        message.error({ content: '保存失败', key: 'save' });
      });
    } catch (e) {
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
      const scriptText = await generateScriptWithModel(selectedAIModel, apiKey, project.analysis, { style: '专业' });
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
      updateProject(updatedProject);
      
      await saveProjectToFile(updatedProject.id, updatedProject);
      message.success({ content: 'AI脚本生成完毕✨', key: 'ai' });
    } catch (error: any) {
      message.error({ content: '生成失败: ' + error.message, key: 'ai' });
    } finally {
      setAiLoading(false);
    }
  };

  const menuItems = [
    { key: 'analyze', icon: <EyeOutlined />, label: '画面识别 (Frame Analysis)' },
    { key: 'subtitle', icon: <FormOutlined />, label: '字幕提取 (Subtitle Ext)' },
    { key: 'script', icon: <DashboardOutlined />, label: '脚本生成 (AI Script)' },
    { key: 'sync', icon: <AudioOutlined />, label: '音画同步 (A/V Sync)' },
    { key: 'edit', icon: <ScissorOutlined />, label: '视频混剪 (Video Output)' },
  ];

  if (loading) return <div className={styles.spinner}><Spin size="large" /></div>;
  if (!project) return null;

  const renderContent = () => {
    switch (activeStep) {
      case 'analyze':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <VideoAnalyzer 
              projectId={project.id} 
              videoUrl={project.videoUrl} 
              onAnalysisComplete={(analysis) => {
                const updated = { ...project, analysis };
                setProject(updated);
                updateProject(updated);
                saveProjectToFile(updated.id, updated);
                message.success('画面识别已完成并保存');
              }} 
            />
          </motion.div>
        );
      case 'subtitle':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <SubtitleExtractor 
              projectId={project.id}
              videoUrl={project.videoUrl}
              onExtracted={(subtitles) => {
                const updated = { ...project, extractedSubtitles: subtitles };
                setProject(updated);
                updateProject(updated);
                saveProjectToFile(updated.id, updated);
              }}
            />
          </motion.div>
        );
      case 'script':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className={styles.scriptHeader}>
              <Title level={4}>AI驱动脚本编辑</Title>
              <Space>
                <Button loading={aiLoading} onClick={handleGenerateScript} type="primary" className={styles.premiumBtn}>AI 一键生成</Button>
                <Button onClick={handleCreateScript} className={styles.premiumBtn}>新建空脚本</Button>
              </Space>
            </div>
            {activeScript ? (
              <ScriptEditor 
                script={activeScript}
                onSave={(updatedScript: any) => {
                  const updatedProject = { ...project, scripts: project.scripts.map((s: any) => s.id === activeScript.id ? updatedScript : s) };
                  setActiveScript(updatedScript);
                  setProject(updatedProject);
                  saveProjectToFile(updatedProject.id, updatedProject).then(() => updateProject(updatedProject));
                }}
              />
            ) : (
              <div className={styles.emptyScript}>
                <Text type="secondary">暂无脚本，请点击上方按钮生成或创建</Text>
              </div>
            )}
          </motion.div>
        );
      case 'sync':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={styles.placeholderSection}>
             <div className={styles.iconWrapper}><AudioOutlined /></div>
             <Title level={3}>全自动音画同步引擎</Title>
             <Text>结合TTS合成声音与画面关键帧自动对齐，提供影院级配音体验。</Text>
             <Button type="primary" size="large" className={styles.premiumBtn} onClick={() => message.info('功能开发中，敬请期待！')}>即将推出</Button>
          </motion.div>
        );
      case 'edit':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <VideoProcessingController 
              videoPath={project.videoUrl} 
              segments={activeScript?.content || []} 
            />
          </motion.div>
        );
    }
  };

  return (
    <div className={styles.container}>
      <motion.div 
        className={styles.header}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
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
      </motion.div>

      <div className={styles.workflowContainer}>
        <motion.div 
          className={styles.sidebar}
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className={styles.stepCard}>
            <Menu
              mode="vertical"
              selectedKeys={[activeStep]}
              className={styles.stepMenu}
              items={menuItems}
              onSelect={({ key }) => setActiveStep(key)}
            />
          </div>
        </motion.div>

        <motion.div 
          className={styles.contentArea}
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className={styles.activeContent}>
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </div>
        </motion.div>
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
        <VideoInfo 
          name={project.name}
          path={project.videoUrl}
          duration={project.analysis?.duration || 0}
        />
      </Drawer>
    </div>
  );
};

export default ProjectDetail;