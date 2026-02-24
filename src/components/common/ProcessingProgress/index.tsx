/**
 * 进度显示组件
 * 显示 AI 处理进度 (0-100%)
 * 圆形进度条 + 状态文本
 */
import React from 'react';
import { Progress, Typography, Space } from 'antd';
import { LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import styles from './ProcessingProgress.module.less';

const { Text } = Typography;

export type ProgressStatus = 'active' | 'success' | 'exception' | 'normal';

export interface ProcessingProgressProps {
  /** 当前进度 (0-100) */
  percent: number;
  /** 状态文本 */
  statusText?: string;
  /** 进度条状态 */
  status?: ProgressStatus;
  /** 是否显示状态图标 */
  showIcon?: boolean;
  /** 是否显示百分比文字 */
  showInfo?: boolean;
  /** 进度条尺寸 */
  size?: 'small' | 'default' | 'large';
  /** 是否为圆形进度条 (默认true) */
  type?: 'circle' | 'line';
  /** 附加样式类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 进度颜色渐变配置 */
  strokeColor?: string | { '0%': string; '100%': string };
  /** 额外的内容渲染 */
  extra?: React.ReactNode;
}

/**
 * 圆形进度条 + 状态文本
 */
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
  // 根据状态获取图标
  const getStatusIcon = () => {
    if (!showIcon) return null;
    
    switch (status) {
      case 'success':
        return <CheckCircleOutlined className={styles.successIcon} />;
      case 'exception':
        return <CloseCircleOutlined className={styles.errorIcon} />;
      case 'active':
      default:
        return <LoadingOutlined spin className={styles.loadingIcon} />;
    }
  };

  // 获取状态文字颜色
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

  // 圆形进度条配置
  const circleProps = {
    percent,
    status: status === 'active' ? undefined : status,
    strokeColor: strokeColor || {
      '0%': '#108ee9',
      '100%': '#87d068',
    },
    trailColor: '#f0f0f0',
    strokeWidth: size === 'small' ? 4 : size === 'large' ? 8 : 6,
    width: size === 'small' ? 60 : size === 'large' ? 120 : 80,
    format: (pct?: number) => (
      <span style={{ fontSize: size === 'small' ? 12 : size === 'large' ? 20 : 14 }}>
        {Math.round(pct || 0)}%
      </span>
    ),
  };

  // 线性进度条配置
  const lineProps = {
    percent,
    status: status === 'active' ? undefined : status,
    strokeColor: strokeColor || {
      '0%': '#108ee9',
      '100%': '#87d068',
    },
    trailColor: '#f0f0f0',
    showInfo,
    size: size as 'small' | 'default',
  };

  return (
    <div className={`${styles.container} ${className}`} style={style}>
      <Space direction="vertical" align="center" size="middle">
        {type === 'circle' ? (
          <Progress {...circleProps} />
        ) : (
          <Progress {...lineProps} />
        )}
        
        {statusText && (
          <Space size="small">
            {getStatusIcon()}
            <Text 
              style={{ 
                color: getStatusColor(),
                fontSize: size === 'small' ? 12 : 14 
              }}
            >
              {statusText}
            </Text>
          </Space>
        )}
        
        {extra}
      </Space>
    </div>
  );
};

export default ProcessingProgress;
