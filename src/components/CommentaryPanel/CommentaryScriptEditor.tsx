/**
 * CommentaryScriptEditor — 解说脚本编辑器
 *
 * 支持：
 * - 显示/编辑生成的解说文案
 * - 分段展示（可编辑时间戳和文案）
 * - API Key 输入
 */

import React, { useState, useCallback, memo } from 'react';
import { CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Copy, Check, Wand2 } from 'lucide-react';
import type { CommentaryScriptOutput, CommentarySegment } from '@/core/services/commentary';
import { formatDuration } from '@/core/video';
import styles from './CommentaryPanel.module.less';

interface Props {
  script: CommentaryScriptOutput | null;
  isGenerating: boolean;
  onGenerate: () => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  /** 段落文本变更回调（用于增量编辑） */
  onSegmentChange?: (index: number, text: string) => void;
}

// ─── 单段编辑 ───────────────────────────────────────────────────────────

const SegmentRow: React.FC<{
  segment: CommentarySegment;
  index: number;
  onChange?: (index: number, text: string) => void;
}> = ({ segment, index, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(segment.text);

  const handleBlur = useCallback(() => {
    setEditing(false);
    if (text !== segment.text) {
      onChange?.(index, text);
    }
  }, [text, segment.text, onChange, index]);

  return (
    <div className={styles.segmentRow}>
      <Badge variant="outline" className={styles.segmentIndex}>{index + 1}</Badge>
      <span className={styles.segmentTime}>
        {formatDuration(segment.startTime)} - {formatDuration(segment.endTime)}
      </span>
      {editing ? (
        <Textarea
          value={text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
          onBlur={handleBlur}
          className={styles.segmentTextarea}
          rows={2}
        />
      ) : (
        <p
          className={styles.segmentText}
          onClick={() => setEditing(true)}
          title="点击编辑"
        >
          {segment.text}
        </p>
      )}
      {segment.emotion && (
        <Badge variant="secondary" className={styles.emotionBadge}>
          {segment.emotion}
        </Badge>
      )}
    </div>
  );
};

// ─── 主组件 ─────────────────────────────────────────────────────────────

const CommentaryScriptEditor: React.FC<Props> = ({
  script,
  isGenerating: _isGenerating,
  onGenerate: _onGenerate,
  apiKey,
  onApiKeyChange,
  onSegmentChange,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!script?.fullScript) return;
    navigator.clipboard.writeText(script.fullScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [script]);

  return (
    <div className={styles.scriptEditor}>
      {/* API Key */}
      <div className={styles.apiKeyRow}>
        <label className={styles.inputLabel}>API Key</label>
        <Input
          type="password"
          placeholder="输入 API Key（用于 LLM 生成脚本）"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          className={styles.apiKeyInput}
        />
      </div>

      {/* 全局脚本 */}
      {script && (
        <div className={styles.fullScriptSection}>
          <div className={styles.sectionHeader}>
            <CardTitle className="text-sm">完整解说文案</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? '已复制' : '复制'}
            </Button>
          </div>
          <Textarea
            value={script.fullScript}
            readOnly
            className={styles.fullScriptTextarea}
            rows={6}
          />
          <div className={styles.scriptMeta}>
            <span>预计时长：{Math.round(script.estimatedDurationSecs)} 秒</span>
            <span>模型：{script.modelUsed}</span>
            <span>提供商：{script.provider}</span>
          </div>
        </div>
      )}

      {/* 分段脚本 */}
      {script && script.segments.length > 0 && (
        <div className={styles.segmentsSection}>
          <CardTitle className="text-sm mb-2">分段解说（{script.segments.length} 段）</CardTitle>
          <div className={styles.segmentsList}>
            {script.segments.map((seg, i) => (
              <SegmentRow key={i} segment={seg} index={i} onChange={onSegmentChange} />
            ))}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {!script && (
        <div className={styles.emptyScript}>
          <Wand2 size={48} className="text-muted-foreground" />
          <p>点击"生成脚本"开始创作解说文案</p>
        </div>
      )}
    </div>
  );
};

export default memo(CommentaryScriptEditor);