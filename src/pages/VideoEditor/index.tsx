import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Layout, Tabs, Row, Col, message } from 'antd';
import { RobotOutlined, SaveOutlined } from '@ant-design/icons';

import { saveProjectFile } from '@/services/projectService';
import { useVideoEditor } from './hooks/useVideoEditor';
import { useAutoSave } from '@/core/hooks';

import Toolbar from './components/Toolbar';
import VideoPlayer from './components/VideoPlayer';
import Timeline from './components/Timeline';
import SegmentList from './components/SegmentList';
import KeyframePanel from './components/KeyframePanel';
import AIClipPanel from './components/AIClipPanel';
import ExportSettingsPanel from './components/ExportSettingsPanel';

import styles from './VideoEditor.module.less';

const { Content } = Layout;
const { TabPane } = Tabs;

const VideoEditorPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState('trim');

  const {
    // 状态
    videoSrc,
    loading,
    analyzing,
    currentTime,
    duration,
    isPlaying,
    segments,
    keyframes,
    selectedSegmentIndex,
    historyIndex,
    editHistory,
    outputFormat,
    videoQuality,
    isSaving,
    isExporting,

    // 状态设置器
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setIsSaving,
    setIsExporting,
    setOutputFormat,
    setVideoQuality,

    // 操作
    handleLoadVideo,
    handleUndo,
    handleRedo,
    handleAddSegment,
    handleDeleteSegment,
    handleSelectSegment,
    handleSmartClip,
    handleApplyAISuggestions,
  } = useVideoEditor(projectId);

  // 保存项目
  const handleSaveProject = useCallback(async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const projectToSave = {
        id: projectId || 'new',
        segments,
        updatedAt: new Date().toISOString(),
      };

      await saveProjectFile(projectId || 'new', JSON.stringify(projectToSave));
      message.success('项目保存成功');
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  }, [projectId, segments, setIsSaving]);

  // 导出视频
  const handleExportVideo = useCallback(async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      message.success('视频导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  }, [setIsExporting]);

  // AI 分析完成
  const handleAnalysisComplete = useCallback((result: any) => {
    console.log('AI 剪辑分析完成:', result);
    message.success(`检测到 ${result.cutPoints.length} 个剪辑点`);
  }, []);

  return (
    <Layout className={styles.editorLayout}>
      <Content className={styles.editorContent}>
        <Toolbar
          loading={loading}
          analyzing={analyzing}
          isSaving={isSaving}
          isExporting={isExporting}
          hasVideo={!!videoSrc}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < editHistory.length - 1}
          onLoadVideo={handleLoadVideo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onAddSegment={handleAddSegment}
          onSmartClip={handleSmartClip}
          onSave={handleSaveProject}
          onExport={handleExportVideo}
        />

        <Row gutter={[24, 24]}>
          {/* 视频预览区 */}
          <Col span={16}>
            <VideoPlayer
              videoSrc={videoSrc}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onTimeUpdate={setCurrentTime}
              onDurationChange={setDuration}
              onPlayStateChange={setIsPlaying}
              onLoadVideo={handleLoadVideo}
            />

            <Timeline
              segments={segments}
              currentTime={currentTime}
              duration={duration}
              selectedIndex={selectedSegmentIndex}
              onSelectSegment={handleSelectSegment}
            />
          </Col>

          {/* 右侧工具面板 */}
          <Col span={8}>
            <Tabs
              defaultActiveKey="trim"
              onChange={setActiveTab}
              className={styles.editorTabs}
            >
              <TabPane tab="片段" key="trim">
                <SegmentList
                  segments={segments}
                  selectedIndex={selectedSegmentIndex}
                  hasVideo={!!videoSrc}
                  onSelectSegment={handleSelectSegment}
                  onDeleteSegment={handleDeleteSegment}
                  onAddSegment={handleAddSegment}
                />
              </TabPane>

              <TabPane tab="关键帧" key="keyframes">
                <KeyframePanel keyframes={keyframes} />
              </TabPane>

              <TabPane tab={<span><RobotOutlined /> AI 剪辑</span>} key="ai-clip">
                <AIClipPanel
                  projectId={projectId}
                  videoSrc={videoSrc}
                  duration={duration}
                  onAnalysisComplete={handleAnalysisComplete}
                  onApplySuggestions={handleApplyAISuggestions}
                />
              </TabPane>

              <TabPane tab="效果" key="effects">
                <div className={styles.effectsPanel}>
                  视频效果功能正在开发中
                </div>
              </TabPane>

              <TabPane tab="设置" key="settings">
                <ExportSettingsPanel
                  outputFormat={outputFormat}
                  videoQuality={videoQuality}
                  onFormatChange={setOutputFormat}
                  onQualityChange={setVideoQuality}
                />
              </TabPane>
            </Tabs>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default VideoEditorPage;
