/**
 * 进度显示组件
 * 显示 AI 处理进度 (0-100%)
 * 圆形进度条 + 状态文本
 */
import React from 'react';
import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import styles from './ProcessingProgress.module.less';

export type ProgressStatus = 'active' | 'success' | 'exception' | 'normal';

export interface ProcessingProgressProps {
  percent: number;
  statusText?: string;
  status?: ProgressStatus;
  showIcon?: boolean;
  showInfo?: boolean;
  size?: 'small' | 'default' | 'large';
  type?: 'circle' | 'line';
  className?: string;
  style?: React.CSSProperties;
  strokeColor?: string;
  extra?: React.ReactNode;
}

const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  percent,
  statusText,
  status = 'active',
  showIcon = true,
  showInfo = true,
  size = 'default',
  type = 'circle',
  className = '',
  style = {},
  strokeColor,
  extra,
}) => {
  const getStatusIcon = () => {
    if (!showIcon) return null;

    switch (status) {
      case 'success':
        return <CheckCircle size={16} className={styles.successIcon} />;
      case 'exception':
        return <XCircle size={16} className={styles.errorIcon} />;
      case 'active':
      default:
        return <Loader2 size={16} className={`${styles.loadingIcon} animate-spin`} />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return '#52c41a';
      case 'exception':
        return '#ff4d4f';
      default:
        return '#1890ff';
    }
  };

  const sizeMap = {
    small: { circle: 60, stroke: 4, font: 12 },
    default: { circle: 80, stroke: 6, font: 14 },
    large: { circle: 120, stroke: 8, font: 20 },
  };

  const s = sizeMap[size] || sizeMap.default;

  if (type === 'circle') {
    return (
      <div className={`${styles.container} ${className}`} style={style}>
        <div
          className="relative inline-flex items-center justify-center"
          style={{ width: s.circle, height: s.circle }}
        >
          {/* Circle progress using conic-gradient */}
          <svg
            width={s.circle}
            height={s.circle}
            viewBox={`0 0 ${s.circle} ${s.circle}`}
            className="absolute inset-0"
            style={{ transform: 'rotate(-90deg)' }}
          >
            <circle
              cx={s.circle / 2}
              cy={s.circle / 2}
              r={(s.circle - s.stroke) / 2}
              fill="none"
              stroke="#f0f0f0"
              strokeWidth={s.stroke}
            />
            <circle
              cx={s.circle / 2}
              cy={s.circle / 2}
              r={(s.circle - s.stroke) / 2}
              fill="none"
              stroke={strokeColor || (status === 'success' ? '#52c41a' : status === 'exception' ? '#ff4d4f' : 'url(#progressGradient)')}
              strokeWidth={s.stroke}
              strokeLinecap="round"
              strokeDasharray={`${(percent / 100) * Math.PI * (s.circle - s.stroke)} ${Math.PI * (s.circle - s.stroke)}`}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#108ee9" />
                <stop offset="100%" stopColor="#87d068" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{ fontSize: s.font }} className="relative z-10 font-medium">
            {Math.round(percent)}%
          </span>
        </div>

        {statusText && (
          <div className="flex items-center gap-1 mt-2">
            {getStatusIcon()}
            <span style={{ color: getStatusColor(), fontSize: size === 'small' ? 12 : 14 }}>
              {statusText}
            </span>
          </div>
        )}

        {extra}
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`} style={style}>
      <div className="flex flex-col items-center gap-2">
        <Progress value={percent} className="w-full">
          <ProgressTrack className="h-2">
            <ProgressIndicator
              className={status === 'success' ? 'bg-green-500' : status === 'exception' ? 'bg-red-500' : 'bg-orange-500'}
            />
          </ProgressTrack>
        </Progress>

        {showInfo && (
          <span className="text-sm text-muted-foreground">{Math.round(percent)}%</span>
        )}

        {statusText && (
          <div className="flex items-center gap-1">
            {getStatusIcon()}
            <span style={{ color: getStatusColor(), fontSize: size === 'small' ? 12 : 14 }}>
              {statusText}
            </span>
          </div>
        )}

        {extra}
      </div>
    </div>
  );
};

export default ProcessingProgress;
