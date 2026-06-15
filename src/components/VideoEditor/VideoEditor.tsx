import React, { memo } from 'react';
import { Card } from '../ui/card';
import { ScriptSegment } from '@/types';

import VideoPlayer from '@/components/VideoPlayer/VideoPlayer';
import Timeline from './Timeline';
import SegmentDetails from './SegmentDetails';
import EditorControls from './EditorControls';
import ExportSettings from './ExportSettings';
import PreviewModal from './PreviewModal';
import { useVideoEditorPage } from './hooks/useVideoEditorPage';

import styles from '@/components/VideoEditor/VideoEditor.module.less';

interface VideoEditorProps {
  videoPath: string;
  segments: ScriptSegment[];
  onEditComplete?: (outputPath: string | ScriptSegment[]) => void;
}

const VideoEditor: React.FC<VideoEditorProps> = ({ videoPath, segments, onEditComplete }) => {
  const {
    duration, isPlaying,
    processing, processProgress,
    selectedSegment, editedSegments,
    exportSettings, settingsTab, showSettingsModal,
    showPreviewModal, previewSegment, previewLoading, previewUrl,
    setSettingsTab, setShowSettingsModal,
    handleTimeUpdate, handleSegmentClick, handlePreviewSegment, handleClosePreview,
    handleShowSettings, handleSettingsChange, handleExportVideo, handleSaveSegments,
    handleDragStart,
  } = useVideoEditorPage({ videoPath, segments, onEditComplete });

  return (
    <div className={styles.editorContainer}>
      <h2 className="text-lg font-semibold mb-4">视频混剪编辑器</h2>

      <Card>
        <VideoPlayer
          src={videoPath}
          autoPlay={isPlaying}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => {}}
        />

        <Timeline
          segments={editedSegments}
          duration={duration}
          onSegmentClick={handleSegmentClick}
          onDragStart={handleDragStart}
        />

        {selectedSegment && (
          <SegmentDetails
            segment={selectedSegment}
            onPreview={handlePreviewSegment}
          />
        )}

        <EditorControls
          processing={processing}
          processProgress={processProgress}
          hasSegments={editedSegments.length > 0}
          onExport={handleShowSettings}
          onSettings={handleShowSettings}
          onSave={handleSaveSegments}
        />
      </Card>

      <ExportSettings
        open={showSettingsModal}
        settings={exportSettings}
        activeTab={settingsTab}
        onTabChange={setSettingsTab}
        onSettingsChange={handleSettingsChange}
        onOk={handleExportVideo}
        onCancel={() => setShowSettingsModal(false)}
      />

      <PreviewModal
        open={showPreviewModal}
        loading={previewLoading}
        previewUrl={previewUrl}
        previewSegment={previewSegment}
        onClose={handleClosePreview}
      />
    </div>
  );
};

export default memo(VideoEditor);
