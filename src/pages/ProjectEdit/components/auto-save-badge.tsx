import React from 'react';
import { Badge } from '@/components/ui/badge';

interface AutoSaveBadgeProps {
  enabled: boolean;
  videoPath: string;
  state: 'idle' | 'saving' | 'saved' | 'error';
  lastAt: string;
}

export const AutoSaveBadge = React.memo<AutoSaveBadgeProps>(({ enabled, videoPath, state, lastAt }) => {
  if (!enabled) return <Badge variant="secondary">自动保存已关闭</Badge>;
  if (!videoPath) return <Badge variant="secondary">未开始自动保存</Badge>;
  if (state === 'saving') return <Badge variant="default">草稿自动保存中...</Badge>;
  if (state === 'saved') return <Badge variant="default">{lastAt ? `草稿已保存 ${lastAt}` : '草稿已保存'}</Badge>;
  if (state === 'error') return <Badge variant="destructive">草稿保存失败</Badge>;
  return <Badge variant="secondary">自动保存待触发</Badge>;
});

AutoSaveBadge.displayName = 'AutoSaveBadge';
