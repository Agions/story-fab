import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Steps,
  Typography,
  Space,
  Spin,
  Result,
  Select,
  Tag,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, VideoCameraOutlined, EditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import VideoSelector from '@/components/VideoSelector';
import ScriptEditor from '@/components/ScriptEditor';
import { VideoMetadata, VideoSegment, analyzeVideo, extractKeyFrames } from '@/services/videoService';
import { generateScriptWithAI, analyzeKeyFramesWithAI } from '@/services/aiService';
import { loadProjectFromFile, saveProjectToFile } from '@/services/tauriService';
import { normalizeProjectFile } from '@/core/utils/project-file';
import type { ProjectFileLike } from '@/core/utils/project-file';
import { PROJECT_SAVE_BEHAVIOR_KEY, type ProjectSaveBehavior } from '@/shared/constants/settings';
import { useSettings } from '@/context/SettingsContext';
import { v4 as uuid } from 'uuid';
import styles from './index.module.less';

const { Title, Paragraph } = Typography;

interface ProjectData extends ProjectFileLike<unknown, { path?: string }> {
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

const normalizeProjectData = (project: ProjectData): ProjectData => {
  const normalized = normalizeProjectFile(project);
  return {
    ...project,
    ...normalized,
    description: project.description || '',
    videoPath: project.videoPath || normalized.videoUrl || '',
    createdAt: project.createdAt || new Date().toISOString(),
  };
};

const normalizeText = (value?: string) => value?.trim().replace(/\s+/g, ' ') || '';

const createDefaultProjectName = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `未命名项目-${timestamp}`;
};

const ProjectEdit: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { addRecentProject } = useSettings();
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
  const [defaultProjectName] = useState(() => createDefaultProjectName());
  const [saveBehavior, setSaveBehavior] = useState<ProjectSaveBehavior>(() => {
    try {
      const rawValue = window.localStorage.getItem(PROJECT_SAVE_BEHAVIOR_KEY);
      return rawValue === 'detail' ? 'detail' : 'stay';
    } catch {
      return 'stay';
    }
  });
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastAutoSaveAt, setLastAutoSaveAt] = useState('');

  const watchedName = Form.useWatch('name', form);
  const watchedDescription = Form.useWatch('description', form);

  const draftTimerRef = useRef<number | null>(null);
  const lastDraftFingerprintRef = useRef('');
  const routeSyncedRef = useRef(false);
  const recentProjectTrackedRef = useRef('');

  const canAccessStep = useCallback((step: number) => {
    if (step <= 0) return true;
    if (step === 1) return Boolean(videoPath);
    if (step === 2) return Boolean(videoPath && (scriptSegments.length > 0 || keyFrames.length > 0 || videoMetadata));
    return false;
  }, [keyFrames.length, scriptSegments.length, videoMetadata, videoPath]);

  const goToStep = useCallback((targetStep: number) => {
    if (canAccessStep(targetStep)) {
      setCurrentStep(targetStep);
      return;
    }

    if (targetStep > 0 && !videoPath) {
      message.warning('请先选择视频后再继续。');
      return;
    }

    if (targetStep > 1) {
      message.warning('请先完成视频分析后再进入脚本编辑。');
    }
  }, [canAccessStep, videoPath]);

  const parseTimeString = (timeString: string): number => {
    const parts = timeString.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  };

  const parseScriptText = (text: string): VideoSegment[] => {
    try {
      const lines = text.split('\n').filter((line) => line.trim().length > 0);
      const resultSegments: VideoSegment[] = [];
      let currentSegment: VideoSegment | null = null;

      for (const line of lines) {
        const timeMatch = line.match(/\[(\d{1,2}:\d{2}(?::\d{2})?) - (\d{1,2}:\d{2}(?::\d{2})?)\]/);

        if (timeMatch) {
          const startTime = parseTimeString(timeMatch[1]);
          const endTime = parseTimeString(timeMatch[2]);
          const content = line.substring(timeMatch[0].length).trim();

          currentSegment = {
            start: startTime,
            end: endTime,
            type: 'narration',
            content,
          };
          resultSegments.push(currentSegment);
        } else if (currentSegment) {
          currentSegment.content += `\n${line.trim()}`;
        }
      }

      return resultSegments;
    } catch (parseError) {
      console.error('解析脚本失败:', parseError);
      return [];
    }
  };

  const buildProjectData = useCallback((): ProjectData => {
    const formData = form.getFieldsValue();
    const now = new Date().toISOString();
    const normalizedName = normalizeText(formData.name) || defaultProjectName;
    const normalizedDescription = normalizeText(formData.description);

    const projectData: ProjectData = {
      id: project?.id || uuid(),
      name: normalizedName,
      description: normalizedDescription,
      videoPath,
      videoUrl: videoPath || undefined,
      videos: videoPath ? [{ path: videoPath }] : [],
      createdAt: project?.createdAt || now,
      updatedAt: now,
      metadata: videoMetadata || undefined,
      keyFrames: keyFrames.length > 0 ? keyFrames : undefined,
      script: scriptSegments.length > 0 ? scriptSegments : undefined,
    };
    return projectData;
  }, [defaultProjectName, form, keyFrames, project, scriptSegments, videoMetadata, videoPath]);

  const persistProject = useCallback(async (options?: {
    silent?: boolean;
    requireVideo?: boolean;
    requireValidName?: boolean;
  }): Promise<ProjectData | null> => {
    const { silent = false, requireVideo = true, requireValidName = true } = options || {};

    if (requireVideo && !videoPath) {
      if (!silent) message.error('请先选择视频文件');
      return null;
    }

    const nameInput = normalizeText(form.getFieldValue('name'));
    if (requireValidName && nameInput && nameInput.length < 2) {
      if (!silent) message.error('项目名称至少2个字符');
      return null;
    }

    const data = buildProjectData();
    await saveProjectToFile(data.id, data);
    setProject(data);
    if (recentProjectTrackedRef.current !== data.id) {
      addRecentProject(data.id);
      recentProjectTrackedRef.current = data.id;
    }

    if (!projectId && !routeSyncedRef.current && !silent) {
      routeSyncedRef.current = true;
      navigate(`/project/edit/${data.id}`, { replace: true });
    }

    if (!silent) message.success('项目保存成功');
    return data;
  }, [addRecentProject, buildProjectData, form, navigate, projectId, videoPath]);

  useEffect(() => {
    if (!projectId) {
      form.setFieldsValue({ name: defaultProjectName, description: '' });
      return;
    }

    setInitialLoading(true);
    setIsNewProject(false);

    loadProjectFromFile<ProjectData>(projectId)
      .then((projectData) => {
        const normalizedProject = normalizeProjectData(projectData);
        setProject(normalizedProject);
        form.setFieldsValue({
          name: normalizedProject.name,
          description: normalizedProject.description,
        });

        if (normalizedProject.videoPath) {
          setVideoPath(normalizedProject.videoPath);
          setVideoSelected(true);
        }
        if (normalizedProject.metadata) setVideoMetadata(normalizedProject.metadata);
        if (normalizedProject.keyFrames?.length) setKeyFrames(normalizedProject.keyFrames);

        if (normalizedProject.script?.length) {
          setScriptSegments(normalizedProject.script);
          setCurrentStep(2);
        } else if (normalizedProject.videoPath) {
          setCurrentStep(1);
        }

        setError(null);
      })
      .catch((err: unknown) => {
        console.error('加载项目失败:', err);
        const detail = err instanceof Error ? err.message : String(err);
        setError(`加载项目失败：${detail}`);
        message.error(`加载项目失败：${detail}`);
      })
      .finally(() => {
        setInitialLoading(false);
      });
  }, [defaultProjectName, form, projectId]);

  useEffect(() => {
    if (initialLoading || loading || saving || !videoPath) return;

    const currentFingerprint = JSON.stringify({
      id: project?.id || projectId || '',
      name: normalizeText(watchedName) || defaultProjectName,
      description: normalizeText(watchedDescription),
      videoPath,
      keyFrameCount: keyFrames.length,
      scriptCount: scriptSegments.length,
      hasMetadata: Boolean(videoMetadata),
    });

    if (lastDraftFingerprintRef.current === currentFingerprint) {
      return;
    }

    if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);

    draftTimerRef.current = window.setTimeout(async () => {
      try {
        setAutoSaveState('saving');
        const draftData = await persistProject({
          silent: true,
          requireVideo: true,
          requireValidName: false,
        });

        if (!draftData) {
          setAutoSaveState('idle');
          return;
        }
        lastDraftFingerprintRef.current = currentFingerprint;
        setLastAutoSaveAt(new Date().toLocaleTimeString('zh-CN', { hour12: false }));
        setAutoSaveState('saved');
      } catch (draftError) {
        console.error('自动保存草稿失败:', draftError);
        setAutoSaveState('error');
      }
    }, 900);

    return () => {
      if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);
    };
  }, [
    initialLoading,
    keyFrames,
    loading,
    persistProject,
    saving,
    scriptSegments,
    videoMetadata,
    videoPath,
    watchedDescription,
    watchedName,
    defaultProjectName,
    project?.id,
    projectId,
  ]);

  const handleVideoSelect = (filePath: string, metadata?: VideoMetadata) => {
    setVideoPath(filePath);
    setVideoSelected(true);
    if (metadata) setVideoMetadata(metadata);
    if (currentStep === 0) goToStep(1);
  };

  const handleVideoRemove = () => {
    setVideoPath('');
    setVideoSelected(false);
    setVideoMetadata(null);
    setKeyFrames([]);
    setScriptSegments([]);
    setCurrentStep(0);
    setAutoSaveState('idle');
    setLastAutoSaveAt('');
  };

  const handleAnalyzeVideo = async () => {
    if (loading) return;
    if (!videoPath) {
      message.error('请先选择视频');
      return;
    }

    let stage: 'metadata' | 'keyframes' | 'frames-ai' | 'script' = 'metadata';

    try {
      setLoading(true);

      let metadata = videoMetadata;
      if (!metadata) {
        stage = 'metadata';
        message.info('正在分析视频元数据...');
        metadata = await analyzeVideo(videoPath);
        setVideoMetadata(metadata);
      }

      stage = 'keyframes';
      message.info('正在提取关键帧...');
      const frames = await extractKeyFrames(videoPath);
      const framePaths = frames.map((frame) => frame.path);
      if (framePaths.length === 0) {
        throw new Error('未提取到关键帧，请尝试更换视频或检查视频时长');
      }
      setKeyFrames(framePaths);

      stage = 'frames-ai';
      message.info('正在分析关键帧内容...');
      const frameDescriptions = await analyzeKeyFramesWithAI(framePaths);

      stage = 'script';
      message.info('正在根据视频内容生成脚本...');
      const scriptText = await generateScriptWithAI(metadata, frameDescriptions, {
        style: '自然流畅',
        tone: '专业',
        length: 'medium',
        purpose: '内容展示',
      });

      let script = parseScriptText(scriptText);
      if (script.length === 0) {
        script = [{
          start: 0,
          end: Math.max(10, Math.round(metadata.duration || 10)),
          type: 'narration',
          content: scriptText.trim() || '请根据视频内容补充解说词。',
        }];
      }

      setScriptSegments(script);
      message.success('视频分析完成');
      goToStep(2);
    } catch (analyzeError) {
      console.error('视频分析失败:', analyzeError);
      const detail = analyzeError instanceof Error ? analyzeError.message : '未知错误';
      const stageLabel = {
        metadata: '视频元数据分析',
        keyframes: '关键帧提取',
        'frames-ai': '关键帧内容理解',
        script: '脚本生成',
      }[stage];
      const errorMessage = detail.includes('失败') ? detail : `${stageLabel}失败：${detail}`;
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async () => {
    if (saving) return;

    try {
      await form.validateFields();
      setSaving(true);

      const projectData = await persistProject({
        silent: false,
        requireVideo: true,
        requireValidName: true,
      });

      if (!projectData) return;

      const targetRoute = saveBehavior === 'detail'
        ? `/project/${projectData.id}`
        : `/project/edit/${projectData.id}`;

      if (isNewProject || saveBehavior === 'detail') {
        setIsNewProject(false);
        navigate(targetRoute);
      }
    } catch (saveError) {
      console.error('保存项目失败:', saveError);
      message.error(saveError instanceof Error ? saveError.message : '保存项目失败，请稍后再试');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleSaveBehaviorChange = (value: ProjectSaveBehavior) => {
    setSaveBehavior(value);
    try {
      window.localStorage.setItem(PROJECT_SAVE_BEHAVIOR_KEY, value);
    } catch (storageError) {
      console.error('保存项目跳转策略失败:', storageError);
    }
  };

  const getAutoSaveTag = () => {
    if (!videoPath) return <Tag color="default">未开始自动保存</Tag>;
    if (autoSaveState === 'saving') return <Tag color="processing">草稿自动保存中...</Tag>;
    if (autoSaveState === 'saved') return <Tag color="success">{lastAutoSaveAt ? `草稿已保存 ${lastAutoSaveAt}` : '草稿已保存'}</Tag>;
    if (autoSaveState === 'error') return <Tag color="error">草稿保存失败</Tag>;
    return <Tag color="default">自动保存待触发</Tag>;
  };

  const handleExportScript = (format: string) => {
    message.info(`导出脚本为 ${format.toUpperCase()} 格式`);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card className={styles.stepCard}>
            <Title level={4}>
              <VideoCameraOutlined /> 选择视频
            </Title>
            <Paragraph>请选择要编辑的视频文件，支持 MP4、MOV、AVI 等常见格式。</Paragraph>
            <VideoSelector
              initialVideoPath={videoPath}
              onVideoSelect={handleVideoSelect}
              onVideoRemove={handleVideoRemove}
              loading={loading}
            />
            <div className={styles.stepActions}>
              <Button type="primary" onClick={() => goToStep(1)} disabled={!videoSelected}>下一步</Button>
            </div>
          </Card>
        );

      case 1:
        return (
          <Card className={styles.stepCard}>
            <Title level={4}><EditOutlined /> 分析视频内容</Title>
            <Paragraph>分析视频获取关键帧和内容信息，生成脚本草稿。</Paragraph>

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
                <Button onClick={() => goToStep(0)}>上一步</Button>
                {scriptSegments.length > 0 ? (
                  <Button type="primary" onClick={() => goToStep(2)}>下一步</Button>
                ) : (
                  <Button type="primary" onClick={handleAnalyzeVideo} loading={loading}>分析视频</Button>
                )}
              </Space>
            </div>
          </Card>
        );

      case 2:
        return (
          <Card className={styles.stepCard}>
            <Title level={4}><EditOutlined /> 编辑脚本</Title>
            <Paragraph>编辑和优化自动生成的脚本内容，可以添加、删除或修改片段。</Paragraph>

            <ScriptEditor
              videoPath={videoPath}
              initialSegments={scriptSegments}
              onSave={setScriptSegments}
              onExport={handleExportScript}
            />

            <div className={styles.stepActions}>
              <Space>
                <Button onClick={() => goToStep(1)}>上一步</Button>
                <Button type="primary" onClick={handleSaveProject} loading={saving} disabled={loading}>保存项目</Button>
              </Space>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  if (error) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle={error}
        extra={[<Button key="back" onClick={handleBack}>返回</Button>]}
      />
    );
  }

  return (
    <div className={styles.container}>
      <Spin spinning={initialLoading} tip="加载项目中...">
        <div className={styles.header}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack}>返回</Button>
          <Title level={3}>{isNewProject ? '创建新项目' : '编辑项目'}</Title>
          <Space size="middle">
            <div className={styles.saveBehaviorControl}>
              <span className={styles.saveBehaviorLabel}>保存后：</span>
              <Select<ProjectSaveBehavior>
                size="small"
                value={saveBehavior}
                onChange={handleSaveBehaviorChange}
                options={[
                  { value: 'stay', label: '留在编辑页' },
                  { value: 'detail', label: '跳转项目详情' },
                ]}
              />
            </div>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveProject}
              loading={saving}
              disabled={loading || initialLoading}
            >
              保存项目
            </Button>
          </Space>
        </div>

        <div className={styles.autoSaveStatus}>
          {getAutoSaveTag()}
        </div>

        <Card className={styles.card}>
          <Form
            form={form}
            layout="vertical"
            initialValues={{ name: defaultProjectName, description: '' }}
          >
            <Form.Item
              name="name"
              label="项目名称"
              rules={[
                {
                  validator: (_, value: string) => {
                    const normalizedValue = normalizeText(value);
                    if (normalizedValue && normalizedValue.length < 2) {
                      return Promise.reject(new Error('项目名称至少2个字符'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input placeholder="请输入项目名称" maxLength={100} />
            </Form.Item>

            <Form.Item name="description" label="项目描述">
              <Input.TextArea placeholder="请输入项目描述（选填）" rows={2} maxLength={500} />
            </Form.Item>
          </Form>
        </Card>

        <div className={styles.stepsContainer}>
          <Steps
            current={currentStep}
            onChange={goToStep}
            items={[
              { title: '选择视频', icon: <VideoCameraOutlined />, description: '上传视频文件' },
              { title: '分析内容', icon: <EditOutlined />, description: '分析视频生成脚本' },
              { title: '编辑脚本', icon: <CheckCircleOutlined />, description: '编辑和优化脚本' },
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
