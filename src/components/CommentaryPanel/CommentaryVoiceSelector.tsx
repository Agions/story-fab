/**
 * CommentaryVoiceSelector — 音色选择器
 *
 * 显示推荐音色列表，支持预览
 */

import React, { memo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VoiceInfo } from '@/core/services/commentary';
import styles from './CommentaryPanel.module.less';

interface Props {
  voices: VoiceInfo[];
  selected: string;
  onChange: (voiceId: string) => void;
  onPreview: () => void;
  isPreviewing: boolean;
}

const CommentaryVoiceSelector: React.FC<Props> = ({
  voices,
  selected,
  onChange,
  onPreview,
  isPreviewing,
}) => {
  return (
    <div className={styles.voiceSelector}>
      <p className={styles.voiceHint}>选择配音音色，建议根据风格预设匹配</p>

      {/* 预览区 */}
      <div className={styles.voicePreviewRow}>
        <Button
          variant="outline"
          size="sm"
          onClick={onPreview}
          disabled={isPreviewing || !selected}
        >
          {isPreviewing ? <Pause size={14} /> : <Play size={14} />}
          {isPreviewing ? '预览中...' : '预览音色'}
        </Button>
        <Badge variant="secondary">
          当前：{voices.find((v) => v.id === selected)?.name ?? selected}
        </Badge>
      </div>

      {/* 音色列表 */}
      <div className={styles.voiceList}>
        {voices.map((voice) => (
          <Card
            key={voice.id}
            className={cn(
              styles.voiceCard,
              selected === voice.id && styles.voiceCardSelected,
            )}
            onClick={() => onChange(voice.id)}
          >
            <CardContent className={styles.voiceCardContent}>
              <div className={styles.voiceInfo}>
                <div className={styles.voiceHeader}>
                  <span className={styles.voiceName}>{voice.name}</span>
                  <Badge
                    variant={voice.gender === 'male' ? 'secondary' : 'outline'}
                    className={styles.genderBadge}
                  >
                    {voice.gender === 'male' ? '男' : '女'}
                  </Badge>
                </div>
                <span className={styles.voiceDesc}>{voice.description}</span>
              </div>
              <Badge variant="outline" className={styles.voiceStyleBadge}>
                {voice.style}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default memo(CommentaryVoiceSelector);