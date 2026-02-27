import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  message, 
  Steps, 
  Divider, 
  Typography,
  Space, 
  Spin, 
  Result
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, VideoCameraOutlined, EditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import VideoSelector from '@/components/VideoSelector';
import ScriptEditor from '@/components/ScriptEditor';
import { VideoMetadata, VideoSegment, analyzeVideo, extractKeyFrames } from '@/services/videoService';
import { generateScriptWithAI, analyzeKeyFramesWithAI } from '@/services/aiService';
import { loadProjectFromFile, saveProjectToFile } from '@/services/tauriService';
import { v4 as uuid } from 'uuid';
import styles from './ProjectEdit.module.less';

const { Title, Paragraph } = Typography;
const { Step } = Steps;

interface ProjectData {
  id: string;
  name: string;
  description: string;
  videoPath: string;
  createdAt: string;
  updatedAt: string;
  metadata?: VideoMetadata;
  keyFrames?: string[];
  script?: VideoSegment[];
}

/**
 * 项目编辑页面
 * 支持创建新项目或编辑现有项目
 */
const ProjectEdit: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [videoSelected, setVideoSelected] = useState(false);
  const [videoPath, setVideoPath] = useState<string>('');
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [keyFrames, setKeyFrames] = useState<string[]>([]);
  const [scriptSegments, setScriptSegments] = useState<VideoSegment[]>([]);
  const [isNewProject, setIsNewProject] = useState(true);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化 - 加载项目数据（如果是编辑现有项目）
  useEffect(() => {
    if (projectId) {
      setInitialLoading(true);
      setIsNewProject(false);
      
      loadProjectFromFile(projectId)
        .then(projectData => {
          setProject(projectData);
          form.setFieldsValue({
            name: projectData.name,
            description: projectData.description
          });
          
          if (projectData.videoPath) {
            setVideoPath(projectData.videoPath);
            setVideoSelected(true);
          }
          
          if (projectData.metadata) {
            setVideoMetadata(projectData.metadata);
          }
          
          if (projectData.keyFrames && projectData.keyFrames.length > 0) {
            setKeyFrames(projectData.keyFrames);
          }
          
          if (projectData.script && projectData.script.length > 0) {
            setScriptSegments(projectData.script);
            // 如果已经有脚本，直接进入脚本编辑步骤
            setCurrentStep(2);
          } else if (projectData.videoPath) {
            // 如果只有视频，进入视频分析步骤
            setCurrentStep(1);
          }
          
          setError(null);
        })
        .catch(err => {
          console.error('加载项目失败:', err);
          setError('加载项目失败，请确认项目文件是否存在');
          message.error('加载项目失败');
        })
        .finally(() => {
          setInitialLoading(false);
        });
    }
  }, [projectId, form]);

  // 处理视频选择
  const handleVideoSelect = (filePath: string, metadata?: VideoMetadata) => {
    setVideoPath(filePath);
    setVideoSelected(true);
    
    if (metadata) {
      setVideoMetadata(metadata);
    }
    
    // 自动进入下一步
    if (currentStep === 0) {
      setCurrentStep(1);
    }
  };

  // 处理视频移除
  const handleVideoRemove = () => {
    setVideoPath('');
    setVideoSelected(false);
    setVideoMetadata(null);
    setKeyFrames([]);
    setScriptSegments([]);
  };

  // 处理视频分析
  const handleAnalyzeVideo = async () => {
    if (!videoPath) {
      message.error('请先选择视频');
      return;
    }

    try {
      setLoading(true);
      message.info('正在分析视频，请稍候...');
      
      // 如果还没有元数据，获取视频元数据
      let metadata = videoMetadata;
      if (!metadata) {
        metadata = await analyzeVideo(videoPath);
        setVideoMetadata(metadata);
      }
      
      // 提取关键帧
      message.info('正在提取关键帧...');
      const frames = await extractKeyFrames(videoPath);
      setKeyFrames(frames);
      
      // 分析关键帧
      message.info('正在分析关键帧内容...');
      const frameDescriptions = await analyzeKeyFramesWithAI(frames);
      
      // 生成脚本
      message.info('正在根据视频内容生成脚本...');
      const scriptText = await generateScriptWithAI(
        metadata,
        frameDescriptions,
        {
          style: '自然流畅',
          tone: '专业',
          length: 'medium',
          purpose: '内容展示'
        }
      );
      
      // 解析脚本文本为段落
      const script = parseScriptText(scriptText);
      setScriptSegments(script);
      
      message.success('视频分析完成');
      
      // 进入下一步
      setCurrentStep(2);
    } catch {
      console.error('视频分析失败:', error);
      message.error('视频分析失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 解析脚本文本为片段数组
  const parseScriptText = (text: string): VideoSegment[] => {
    try {
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      const resultSegments: VideoSegment[] = [];
      
      let currentSegment: VideoSegment | null = null;
      
      for (const line of lines) {
        // 尝试匹配时间轴格式 [00:00 - 00:00] 文本内容
        const timeMatch = line.match(/\[(\d{1,2}:\d{2}(?::\d{2})?) - (\d{1,2}:\d{2}(?::\d{2})?)\]/);
        
        if (timeMatch) {
          // 解析时间
          const startTime = parseTimeString(timeMatch[1]);
          const endTime = parseTimeString(timeMatch[2]);
          
          // 提取内容（时间轴后面的文本）
          const content = line.substring(timeMatch[0].length).trim();
          
          currentSegment = {
            start: startTime,
            end: endTime,
            type: 'narration',
            content
          };
          
          resultSegments.push(currentSegment);
        } else if (currentSegment) {
          // 如果没有匹配到时间轴，但有当前片段，将这行添加到当前片段的内容中
          currentSegment.content += '\n' + line.trim();
        }
      }
      
      return resultSegments;
    } catch {
      console.error('解析脚本失败:', error);
      return [];
    }
  };

  // 解析时间字符串为秒数
  const parseTimeString = (timeString: string): number => {
    const parts = timeString.split(':').map(Number);
    
    if (parts.length === 3) {
      // 格式: HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // 格式: MM:SS
      return parts[0] * 60 + parts[1];
    }
    
    return 0;
  };

  // 保存项目
  const handleSaveProject = async () => {
    try {
      // 验证表单
      await form.validateFields();
      
      // 检查视频是否已选择
      if (!videoPath) {
        message.error('请先选择视频文件');
        return;
      }
      
      setSaving(true);
      
      // 准备项目数据
      const formData = form.getFieldsValue();
      const now = new Date().toISOString();
      
      const projectData: ProjectData = {
        id: project?.id || uuid(),
        name: formData.name,
        description: formData.description,
        videoPath: videoPath,
        createdAt: project?.createdAt || now,
        updatedAt: now,
        metadata: videoMetadata || undefined,
        keyFrames: keyFrames.length > 0 ? keyFrames : undefined,
        script: scriptSegments.length > 0 ? scriptSegments : undefined
      };
      
      // 保存项目文件
      await saveProjectToFile(projectData.id, projectData);
      
      message.success('项目保存成功');
      setProject(projectData);
      
      // 如果是创建新项目，保存后跳转到项目详情页
      if (isNewProject) {
        navigate(`/project/${projectData.id}`);
      }
    } catch {
      console.error('保存项目失败:', error);
      message.error('保存项目失败，请稍后再试');
    } finally {
      setSaving(false);
    }
  };

  // 返回上一页
  const handleBack = () => {
    navigate(-1);
  };

  // 导出脚本
  const handleExportScript = (format: string) => {
    message.info(`导出脚本为 ${format.toUpperCase()} 格式`);
    // 这里实现脚本导出功能
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card className={styles.stepCard}>
            <Title level={4}>
              <VideoCameraOutlined /> 选择视频
            </Title>
            <Paragraph>
              请选择要编辑的视频文件，支持 MP4、MOV、AVI 等常见格式。
            </Paragraph>
            <VideoSelector
              initialVideoPath={videoPath}
              onVideoSelect={handleVideoSelect}
              onVideoRemove={handleVideoRemove}
              loading={loading}
            />
            <div className={styles.stepActions}>
              <Button 
                type="primary" 
                onClick={() => setCurrentStep(1)} 
                disabled={!videoSelected}
              >
                下一步
              </Button>
            </div>
          </Card>
        );
      
      case 1:
        return (
          <Card className={styles.stepCard}>
            <Title level={4}>
              <EditOutlined /> 分析视频内容
            </Title>
            <Paragraph>
              分析视频获取关键帧和内容信息，生成脚本草稿。
            </Paragraph>
            
            <Spin spinning={loading} tip="正在分析视频...">
              <div className={styles.analyzeContent}>
                <VideoSelector
                  initialVideoPath={videoPath}
                  onVideoSelect={handleVideoSelect}
                  onVideoRemove={handleVideoRemove}
                  loading={false}
                />
                
                {keyFrames.length > 0 && (
                  <div className={styles.keyFrames}>
                    <Title level={5}>已提取 {keyFrames.length} 个关键帧</Title>
                    <div className={styles.keyFramesList}>
                      {keyFrames.map((frame, index) => (
                        <img 
                          key={index} 
                          src={frame} 
                          alt={`关键帧 ${index + 1}`} 
                          className={styles.keyFrameImage}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Spin>
            
            <div className={styles.stepActions}>
              <Space>
                <Button onClick={() => setCurrentStep(0)}>
                  上一步
                </Button>
                {scriptSegments.length > 0 ? (
                  <Button type="primary" onClick={() => setCurrentStep(2)}>
                    下一步
                  </Button>
                ) : (
                  <Button 
                    type="primary" 
                    onClick={handleAnalyzeVideo}
                    loading={loading}
                  >
                    分析视频
                  </Button>
                )}
              </Space>
            </div>
          </Card>
        );
      
      case 2:
        return (
          <Card className={styles.stepCard}>
            <Title level={4}>
              <EditOutlined /> 编辑脚本
            </Title>
            <Paragraph>
              编辑和优化自动生成的脚本内容，可以添加、删除或修改片段。
            </Paragraph>
            
            <ScriptEditor
              videoPath={videoPath}
              initialSegments={scriptSegments}
              onSave={setScriptSegments}
              onExport={handleExportScript}
            />
            
            <div className={styles.stepActions}>
              <Space>
                <Button onClick={() => setCurrentStep(1)}>
                  上一步
                </Button>
                <Button 
                  type="primary" 
                  onClick={handleSaveProject}
                  loading={saving}
                >
                  保存项目
                </Button>
              </Space>
            </div>
          </Card>
        );
      
      default:
        return null;
    }
  };

  // 如果加载失败，显示错误信息
  if (error) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle={error}
        extra={[
          <Button key="back" onClick={handleBack}>
            返回
          </Button>
        ]}
      />
    );
  }

  return (
    <div className={styles.container}>
      <Spin spinning={initialLoading} tip="加载项目中...">
        <div className={styles.header}>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
          >
            返回
          </Button>
          <Title level={3}>
            {isNewProject ? '创建新项目' : '编辑项目'}
          </Title>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={handleSaveProject}
            loading={saving}
          >
            保存项目
          </Button>
        </div>
        
        <Card className={styles.card}>
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              name: '',
              description: ''
            }}
          >
            <Form.Item
              name="name"
              label="项目名称"
              rules={[{ required: true, message: '请输入项目名称' }]}
            >
              <Input placeholder="请输入项目名称" maxLength={100} />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="项目描述"
            >
              <Input.TextArea 
                placeholder="请输入项目描述（选填）" 
                rows={2} 
                maxLength={500}
              />
            </Form.Item>
          </Form>
        </Card>
        
        <div className={styles.stepsContainer}>
          <Steps 
            current={currentStep} 
            onChange={setCurrentStep}
            items={[
              {
                title: '选择视频',
                icon: <VideoCameraOutlined />,
                description: '上传视频文件',
              },
              {
                title: '分析内容',
                icon: <EditOutlined />,
                description: '分析视频生成脚本',
              },
              {
                title: '编辑脚本',
                icon: <CheckCircleOutlined />,
                description: '编辑和优化脚本',
              },
            ]}
          />
        </div>
        
        <div className={styles.stepsContent}>
          {renderStepContent()}
        </div>
      </Spin>
    </div>
  );
};

export default ProjectEdit; 