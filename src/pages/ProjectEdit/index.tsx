/**
 * ProjectEdit — 项目编辑页
 *
 * 结构：
 *   components/steps/   — 三个步骤组件（VideoStep / AnalyzeStep / ScriptStep）
 *   hooks/              — useProjectAutoSave auto-save 逻辑
 *   projectEditUtils.ts — 纯工具函数
 *   index.tsx           — 主组件（状态编排）
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Spin } from '@/components/ui/spin';
import { Button } from '@/components/ui/button';
import { Steps } from '@/components/ui/steps';
import { Video, Edit, CheckCircle } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

import type { VideoMetadata } from '@/core/video';
import { loadProjectWithRetry, saveProjectToFile } from '@/services/tauri';
import { notify } from '@/shared';
import { useSettings } from '@/context/SettingsContext';

import { logger } from '../../shared/utils/logging';

import { VideoStep } from './components/steps/video-step';
import { AnalyzeStep } from './components/steps/analyze-step';
import { ScriptStep } from './components/steps/script-step';
import { ProjectEditHeader } from './components/project-edit-header';
import { AutoSaveBadge } from './components/auto-save-badge';
import { ProjectForm } from './components/project-form';
import { useProjectAutoSave } from './hooks/use-project-auto-save';
import { useVideoAnalysis } from './hooks/use-video-analysis';
import { useProjectEditState } from './hooks/use-project-edit-state';
import {
  type ProjectData,
  normalizeProjectData,
  createDefaultProjectName,

} from './project-edit-utils';
import {
  PROJECT_SAVE_BEHAVIOR_KEY,
  PROJECT_AUTO_SAVE_KEY,
  type ProjectSaveBehavior,
} from '@/shared/constants/settings';

import styles from '@/pages/ProjectEdit/index.module.less';



const STEP_ITEMS = [
  { title: '选择视频', icon: <Video size={18} />, description: '上传视频文件' },
  { title: '分析内容', icon: <Edit size={18} />, description: '分析视频生成脚本' },
  { title: '编辑脚本', icon: <CheckCircle size={18} />, description: '编辑和优化脚本' },
];


const ProjectEdit: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addRecentProject } = useSettings();
  // Replaces 17 individual useState calls with a single useReducer-backed hook
  // (see hooks/useProjectEditState.ts). Setter names match the original
  // useState setters, so all call sites below remain unchanged.
  const [defaultProjectName] = useState(createDefaultProjectName);
  const {
    formName, setFormName,
    formDescription, setFormDescription,
    currentStep, setCurrentStep,
    saving, setSaving,
    project, setProject,
    videoPath, setVideoPath,
    videoSelected, setVideoSelected,
    videoMetadata, setVideoMetadata,
    keyFrames, setKeyFrames,
    scriptSegments, setScriptSegments,
    isNewProject, setIsNewProject,
    initialLoading, setInitialLoading,
    error, setError,
    saveBehavior, setSaveBehavior,
    autoSaveEnabled, setAutoSaveEnabled,
    reloadToken, setReloadToken,
  } = useProjectEditState({ defaultProjectName });

  // Refs
  const persistLockRef = useRef(false);
  const draftProjectIdRef = useRef<string>(projectId || '');
  const recentProjectTrackedRef = useRef('');
  const mountedRef = useRef(true);
  const reloadSeqRef = useRef(0);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // ─── Video Analysis Hook ──────────────────────────────────────────────────
  const { loading, analyzeVideo: handleAnalyzeVideo } = useVideoAnalysis({
    videoPath,
    videoMetadata,
    onMetadataReady: setVideoMetadata,
    onKeyFramesReady: setKeyFrames,
    onScriptReady: setScriptSegments,
    onNavigateToScript: () => goToStep(2),
  });

  // ─── Auto-save ────────────────────────────────────────────────────────────
  const getProjectData = useCallback((): ProjectData => {
    const name = formName;
    const description = formDescription;
    const now = new Date().toISOString();
    return {
      id: project?.id || draftProjectIdRef.current || crypto.randomUUID(),
      name: (name || '').trim() || defaultProjectName,
      description: (description || '').trim(),
      videoPath,
      videoUrl: videoPath || undefined,
      videos: videoPath ? [{ path: videoPath }] : [],
      createdAt: project?.createdAt || now,
      updatedAt: now,
      metadata: videoMetadata || undefined,
      keyFrames: keyFrames.length > 0 ? keyFrames : undefined,
      script: scriptSegments.length > 0 ? scriptSegments : undefined,
    };
  }, [project, videoPath, videoMetadata, keyFrames, scriptSegments, defaultProjectName, formName, formDescription]);

  const persistProject = useCallback(async (opts = { silent: false, requireVideo: true, requireValidName: true }) => {
    const { silent, requireVideo, requireValidName } = opts;

    if (requireVideo && !videoPath) {
      if (!silent) notify.error(null, '请先选择视频文件');
      return null;
    }
    const nameVal = (formName || '').trim();
    if (requireValidName && nameVal && nameVal.length < 2) {
      if (!silent) notify.error(null, '项目名称至少2个字符');
      return null;
    }
    if (persistLockRef.current) {
      if (!silent) notify.info('正在保存，请稍候');
      return null;
    }

    persistLockRef.current = true;
    try {
      const data = getProjectData();
      await saveProjectToFile(data.id, data);
      if (recentProjectTrackedRef.current !== data.id) {
        addRecentProject(data.id);
        recentProjectTrackedRef.current = data.id;
      }
      setProject(data);
      if (!silent) notify.success('项目保存成功');
      return data;
    } finally {
      persistLockRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- notify 单例稳定但 lint 误判
  }, [addRecentProject, getProjectData, videoPath, notify, formName]);

  const { autoSaveState, lastAutoSaveAt, scheduleAutoSave, setAutoSaveState } = useProjectAutoSave({
    enabled: autoSaveEnabled,
    videoPath,
    getProjectData,
    onPersist: persistProject,
    initialLoading,
    loading,
    saving,
  });

  // ─── Project loading ────────────────────────────────────────────────────────
  useEffect(() => {
    const seq = ++reloadSeqRef.current;
    const stale = () => !mountedRef.current || seq !== reloadSeqRef.current;

    if (!projectId) {
      if (stale()) return;
      setIsNewProject(true); setProject(null); setError(null);
      setInitialLoading(false); setCurrentStep(0);
      setVideoSelected(false); setVideoPath(''); setVideoMetadata(null);
      setKeyFrames([]); setScriptSegments([]);
      draftProjectIdRef.current = '';
      setFormName(defaultProjectName);
      setFormDescription('');
      return;
    }

    if (stale()) return;
    setInitialLoading(true); setIsNewProject(false); setError(null);

    loadProjectWithRetry<ProjectData>(projectId, { retries: 2, retryDelayMs: 260 })
      .then((data) => {
        if (stale()) return;
        const p = normalizeProjectData(data);
        draftProjectIdRef.current = p.id;
        setProject(p);
        setFormName(p.name);
        setFormDescription(p.description || '');
        if (p.videoPath) { setVideoPath(p.videoPath); setVideoSelected(true); }
        if (p.metadata) setVideoMetadata(p.metadata);
        if (p.keyFrames?.length) setKeyFrames(p.keyFrames);
        if (p.script?.length) { setScriptSegments(p.script); setCurrentStep(2); }
        else if (p.videoPath) setCurrentStep(1);
      })
      .catch((e: unknown) => {
        if (stale()) return;
        logger.error('加载项目失败:', { error: e });
        const msg = e instanceof Error ? e.message : String(e);
        setError(`加载项目失败：${msg}`);
        notify.error(e, '加载项目失败，请返回项目列表后重试');
      })
      .finally(() => { if (!stale()) setInitialLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, reloadToken]);

  // Trigger auto-save on relevant state changes
  useEffect(() => { scheduleAutoSave(); }, [scheduleAutoSave]);

  // ─── Step navigation ───────────────────────────────────────────────────────
  const canAccessStep = useCallback((step: number) => {
    if (step <= 0) return true;
    if (step === 1) return Boolean(videoPath);
    if (step === 2) return Boolean(videoPath && (scriptSegments.length > 0 || keyFrames.length > 0 || videoMetadata));
    return false;
  }, [videoPath, scriptSegments.length, keyFrames.length, videoMetadata]);

  const goToStep = useCallback((step: number) => {
    if (canAccessStep(step)) { setCurrentStep(step); return; }
    if (step > 0 && !videoPath) { notify.warning('请先选择视频后再继续。'); return; }
    if (step > 1) notify.warning('请先完成视频分析后再进入脚本编辑。');
  }, [canAccessStep, videoPath, setCurrentStep]);

  // ─── Video handlers ─────────────────────────────────────────────────────────
  const handleVideoSelect = useCallback((filePath: string, metadata?: VideoMetadata) => {
    if (filePath === videoPath && videoSelected) {
      if (metadata && metadata !== videoMetadata) setVideoMetadata(metadata);
      return;
    }
    setVideoPath(filePath);
    setVideoSelected(true);
    if (metadata) setVideoMetadata(metadata);
    if (currentStep === 0) goToStep(1);
  }, [currentStep, goToStep, videoMetadata, videoPath, videoSelected, setVideoMetadata, setVideoPath, setVideoSelected]);

  const handleVideoRemove = useCallback(() => {
    setVideoPath(''); setVideoSelected(false); setVideoMetadata(null);
    setKeyFrames([]); setScriptSegments([]); setCurrentStep(0);
  }, [setCurrentStep, setKeyFrames, setScriptSegments, setVideoMetadata, setVideoPath, setVideoSelected]);

  // ─── Analyze ────────────────────────────────────────────────────────────────
  // handleAnalyzeVideo 已通过 useVideoAnalysis Hook 提供（见上方）

  // ─── Save ─────────────────────────────────────────────────────────────────
  const handleSaveProject = useCallback(async () => {
    if (saving) return;
    const nameVal = (formName || '').trim();
    if (nameVal && nameVal.length < 2) {
      notify.error(null, '项目名称至少2个字符');
      return;
    }
    try {
      setSaving(true);
      const data = await persistProject({ silent: false, requireVideo: true, requireValidName: true });
      if (!data) return;

      const shouldDetail = saveBehavior === 'detail';
      const shouldBindId = Boolean(!projectId && isNewProject);
      const target = shouldDetail ? `/project/${data.id}` : `/project/edit/${data.id}`;

      if (shouldBindId || shouldDetail) {
        setIsNewProject(false);
        if (location.pathname !== target) navigate(target, { replace: true });
      }
    } catch (e) {
      logger.error('保存项目失败:', { error: e });
      notify.error(e, '保存项目失败，请稍后再试');
    } finally {
      setSaving(false);
    }
  }, [formName, isNewProject, location.pathname, navigate, persistProject, projectId, saveBehavior, saving, setIsNewProject, setSaving]);

  const handleBack = () => {
    if (window.history.length > 1) { navigate(-1); return; }
    navigate('/projects');
  };

  const handleSaveBehaviorChange = (v: ProjectSaveBehavior) => {
    setSaveBehavior(v);
    try { localStorage.setItem(PROJECT_SAVE_BEHAVIOR_KEY, v); } catch { /* ignore */ }
  };

  const handleAutoSaveToggle = (checked: boolean) => {
    setAutoSaveEnabled(checked);
    if (!checked) setAutoSaveState('idle');
    try { localStorage.setItem(PROJECT_AUTO_SAVE_KEY, checked ? '1' : '0'); } catch { /* ignore */ }
  };

  const handleExportScript = (format: string) => notify.info(`导出脚本为 ${format.toUpperCase()} 格式`);

  // ─── Render ────────────────────────────────────────────────────────────────
  if (error) {
    const actions = [<Button key="back" onClick={handleBack}>返回</Button>];
    if (projectId) actions.unshift(
      <Button key="retry" variant="default" type="button" onClick={() => setReloadToken((v) => v + 1)}>重试</Button>
    );
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">加载失败</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2 justify-center">{actions}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Spin spinning={initialLoading} tip="加载项目中...">
        <ProjectEditHeader
          isNewProject={isNewProject} loading={loading} initialLoading={initialLoading}
          saving={saving} saveBehavior={saveBehavior} autoSaveEnabled={autoSaveEnabled}
          onBack={handleBack} onSave={handleSaveProject}
          onSaveBehaviorChange={handleSaveBehaviorChange} onAutoSaveToggle={handleAutoSaveToggle}
        />

        <div className={styles.autoSaveStatus}>
          <AutoSaveBadge enabled={autoSaveEnabled} videoPath={videoPath} state={autoSaveState} lastAt={lastAutoSaveAt} />
        </div>

        <ProjectForm
          name={formName}
          description={formDescription}
          onNameChange={setFormName}
          onDescriptionChange={setFormDescription}
        />

        <div className={styles.stepsContainer}>
          <Steps current={currentStep} onChange={goToStep} items={STEP_ITEMS} />
        </div>

        <div className={styles.stepsContent}>
          {currentStep === 0 && (
            <VideoStep
              videoPath={videoPath} videoSelected={videoSelected} loading={loading}
              onVideoSelect={handleVideoSelect} onVideoRemove={handleVideoRemove}
              onNext={() => goToStep(1)}
            />
          )}
          {currentStep === 1 && (
            <AnalyzeStep
              videoPath={videoPath} keyFrames={keyFrames} scriptSegmentsCount={scriptSegments.length}
              loading={loading}
              onVideoSelect={handleVideoSelect} onVideoRemove={handleVideoRemove}
              onAnalyze={handleAnalyzeVideo}
              onPrev={() => goToStep(0)} onNext={() => goToStep(2)}
            />
          )}
          {currentStep === 2 && (
            <ScriptStep
              videoPath={videoPath} initialSegments={scriptSegments}
              saving={saving} loading={loading}
              onSave={setScriptSegments} onExport={handleExportScript}
              onPrev={() => goToStep(1)} onSaveProject={handleSaveProject}
            />
          )}
        </div>
      </Spin>
    </div>
  );
};

export default ProjectEdit;
