import React, { memo, useEffect, useMemo } from 'react';
import { Alert, Card, Col, Progress, Row, Space, Statistic, Tag, Typography } from 'antd';
import VideoTimeline from '@/components/VideoTimeline';
import type { TimelineData as TimelineEditorData } from '@/components/VideoTimeline';
import type { VideoInfo, ScriptData } from '@/core/types';
import type { TimelineData } from '@/core/services/workflow';
import styles from '../index.module.less';
import { ThunderboltOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface TimelineStepProps {
  timeline?: TimelineData;
  videoInfo?: VideoInfo;
  script?: ScriptData;
  focusedSegmentId?: string;
  onFocusConsumed?: () => void;
  onSave: () => void;
}

const TimelineStep: React.FC<TimelineStepProps> = ({
  timeline,
  videoInfo,
  script,
  focusedSegmentId,
  onFocusConsumed,
  onSave,
}) => {
  const focusedSubtitleClip = useMemo(
    () =>
      timeline?.tracks
        .find((track) => track.type === 'subtitle')
        ?.clips.find((clip) => clip.scriptSegmentId === focusedSegmentId),
    [timeline, focusedSegmentId]
  );

  useEffect(() => {
    if (focusedSegmentId && !focusedSubtitleClip && onFocusConsumed) {
      onFocusConsumed();
    }
  }, [focusedSegmentId, focusedSubtitleClip, onFocusConsumed]);

  const timelineForEditor: TimelineEditorData = {
    tracks: timeline?.tracks.map((track, index) => ({
      id: track.id,
      type: track.type === 'subtitle' ? 'script' : track.type === 'effect' ? 'video' : track.type,
      name: track.type === 'audio' ? `音频轨道 ${index + 1}` : track.type === 'subtitle' ? '解说词' : `视频轨道 ${index + 1}`,
      clips: track.clips.map((clip) => ({
        id: clip.id,
        scriptSegmentId: clip.scriptSegmentId,
        trackId: track.id,
        startTime: clip.startTime,
        endTime: clip.endTime,
        sourceStart: clip.sourceStart,
        sourceEnd: clip.sourceEnd,
        name: clip.sourceId || `片段 ${clip.id}`,
      })),
      isMuted: false,
      isLocked: false,
    })) || [],
    duration: timeline?.duration || 0,
    currentTime: focusedSubtitleClip?.startTime ?? 0,
  };

  if (!timeline || !videoInfo) {
    return (
      <Card title="时间轴编辑" className={styles.stepCard}>
        <div>暂无时间轴数据</div>
      </Card>
    );
  }

  return (
    <Card title="时间轴编辑" className={styles.stepCard}>
      {focusedSegmentId && focusedSubtitleClip && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message={`已定位到段落 ${focusedSegmentId}`}
          description={`时间范围 ${focusedSubtitleClip.startTime.toFixed(2)}s - ${focusedSubtitleClip.endTime.toFixed(2)}s`}
          closable
          onClose={onFocusConsumed}
        />
      )}
      {timeline.alignment && (
        <Card
          type="inner"
          title="AI 自主导演 - 对齐质量"
          extra={<Tag icon={<ThunderboltOutlined />} color="gold">Tauri 本地优先</Tag>}
          style={{ marginBottom: 16 }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="平均置信度"
                value={Math.round(timeline.alignment.averageConfidence * 100)}
                suffix="%"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="最大漂移"
                value={timeline.alignment.maxDriftSeconds}
                suffix="s"
                precision={2}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="低置信度片段"
                value={timeline.alignment.items.filter((item) => item.confidence < 0.6).length}
              />
            </Col>
          </Row>
          {timeline.directorPlan && (
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}>
                <Text type="secondary">导演节拍数：{timeline.directorPlan.beatCount}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">推荐转场：{timeline.directorPlan.preferredTransition}</Text>
              </Col>
            </Row>
          )}
          <Progress
            percent={Math.round(timeline.alignment.averageConfidence * 100)}
            status={timeline.alignment.averageConfidence >= 0.8 ? 'success' : 'active'}
            style={{ marginTop: 12 }}
          />
          <Text type="secondary">
            AI 已自动完成解说-画面匹配；建议优先检查低置信度片段后再导出。
          </Text>
        </Card>
      )}
      {timeline.overlayQuality && (
        <Card
          type="inner"
          title="原画轨遮挡评分"
          style={{ marginBottom: 16 }}
          extra={
            <Space>
              {timeline.overlayQuality.score < 80 && (
                <Tag color="blue">导出时自动修正</Tag>
              )}
              <Tag color={timeline.overlayQuality.riskLevel === 'low' ? 'green' : timeline.overlayQuality.riskLevel === 'medium' ? 'orange' : 'red'}>
                {timeline.overlayQuality.riskLevel === 'low' ? '低风险' : timeline.overlayQuality.riskLevel === 'medium' ? '中风险' : '高风险'}
              </Tag>
            </Space>
          }
        >
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="评分" value={timeline.overlayQuality.score} suffix="/100" />
            </Col>
            <Col span={8}>
              <Statistic title="字幕重叠比" value={Math.round(timeline.overlayQuality.overlapRatio * 100)} suffix="%" />
            </Col>
            <Col span={8}>
              <Statistic title="原画覆盖比" value={Math.round(timeline.overlayQuality.denseOverlayRatio * 100)} suffix="%" />
            </Col>
          </Row>
          <Progress
            percent={timeline.overlayQuality.score}
            status={timeline.overlayQuality.score >= 80 ? 'success' : timeline.overlayQuality.score >= 60 ? 'active' : 'exception'}
            style={{ marginTop: 12 }}
          />
          <Text type="secondary">{timeline.overlayQuality.suggestions[0]}</Text>
        </Card>
      )}
      {timeline.overlayOptimizationPreview && (
        <Card type="inner" title="导出修正预估" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="预测评分" value={timeline.overlayOptimizationPreview.predictedScore} suffix="/100" />
            </Col>
            <Col span={8}>
              <Statistic title="预计修正轮次" value={timeline.overlayOptimizationPreview.passes} />
            </Col>
            <Col span={8}>
              <Statistic
                title="原画轨状态"
                value={timeline.overlayOptimizationPreview.enableOverlay ? '保留' : '关闭'}
              />
            </Col>
          </Row>
          <Text type="secondary">
            导出时将按该预估策略自动执行修正，确保 AI 自主出片可用性优先。
          </Text>
        </Card>
      )}
      <VideoTimeline
        timeline={timelineForEditor}
        videoInfo={videoInfo}
        script={script}
        focusedSegmentId={focusedSegmentId}
        onSave={() => onSave()}
      />
    </Card>
  );
};

export default memo(TimelineStep);
