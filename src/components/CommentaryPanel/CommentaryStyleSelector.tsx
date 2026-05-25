/**
 * CommentaryStyleSelector — 风格预设选择器
 *
 * 五种预设：幽默 / 严肃 / 接地气 / 悬疑 / 温情
 */

import React, { memo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import type { ScriptStylePreset } from '@/core/services/commentary';
import styles from './CommentaryPanel.module.less';

const STYLE_OPTIONS: Array<{
  value: ScriptStylePreset;
  label: string;
  description: string;
  emoji: string;
}> = [
  {
    value: 'humorous',
    label: '幽默风趣',
    description: '吐槽风格，轻松搞笑，适合娱乐类视频',
    emoji: '😂',
  },
  {
    value: 'serious',
    label: '严肃正式',
    description: '逻辑清晰，分析到位，适合深度内容',
    emoji: '🎯',
  },
  {
    value: 'conversational',
    label: '接地气',
    description: '自然亲切，像和朋友聊天，适合生活类',
    emoji: '🤝',
  },
  {
    value: 'suspense',
    description: '悬念迭起，吊足胃口，适合悬疑/惊悚类',
    label: '悬疑紧张',
    emoji: '😱',
  },
  {
    value: 'warm',
    label: '温情治愈',
    description: '情感细腻，触动人心，适合情感类',
    emoji: '🥰',
  },
];

interface Props {
  selected: ScriptStylePreset;
  onChange: (style: ScriptStylePreset) => void;
}

const CommentaryStyleSelector: React.FC<Props> = ({ selected, onChange }) => {
  return (
    <div className={styles.styleSelector}>
      <p className={styles.styleHint}>选择解说风格，系统将据此调整文案语气和节奏</p>
      <div className={styles.styleGrid}>
        {STYLE_OPTIONS.map((opt) => (
          <Card
            key={opt.value}
            className={cn(
              styles.styleCard,
              selected === opt.value && styles.styleCardSelected,
            )}
            onClick={() => onChange(opt.value)}
          >
            <CardContent className={styles.styleCardContent}>
              <span className={styles.styleEmoji}>{opt.emoji}</span>
              <div className={styles.styleInfo}>
                <span className={styles.styleLabel}>{opt.label}</span>
                <span className={styles.styleDesc}>{opt.description}</span>
              </div>
              {selected === opt.value && (
                <Badge variant="default" className={styles.styleSelectedBadge}>已选</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default memo(CommentaryStyleSelector);