import React from 'react';
import { Skeleton, Card } from 'antd';
import styles from './LoadingSkeleton.module.less';

export interface LoadingSkeletonProps {
  /** 骨架屏类型 */
  variant?: 'card' | 'list' | 'detail' | 'form' | 'chart' | 'custom';
  /** 自定义类名 */
  className?: string;
  /** 是否显示动画 */
  active?: boolean;
  /** 段落行数 */
  paragraphRows?: number;
  /** 加载项数量 (list/card 模式) */
  count?: number;
  /** 卡片标题宽度 */
  titleWidth?: string | number;
  /** 自定义渲染内容 */
  renderContent?: React.ReactNode;
}

// 卡片模式骨架屏
const CardSkeleton: React.FC<Pick<LoadingSkeletonProps, 'active' | 'paragraphRows' | 'titleWidth' | 'count'>> = ({
  active = true,
  paragraphRows = 3,
  titleWidth = '40%',
  count = 1,
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className={styles.skeletonCard}>
          <Skeleton active={active} title={{ width: titleWidth }} paragraph={{ rows: paragraphRows }} />
        </Card>
      ))}
    </>
  );
};

// 列表模式骨架屏
const ListSkeleton: React.FC<Pick<LoadingSkeletonProps, 'active' | 'paragraphRows' | 'count'>> = ({
  active = true,
  paragraphRows = 2,
  count = 5,
}) => {
  return (
    <div className={styles.skeletonList}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.skeletonListItem}>
          <Skeleton active={active} avatar paragraph={{ rows: paragraphRows }} />
        </div>
      ))}
    </div>
  );
};

// 详情模式骨架屏
const DetailSkeleton: React.FC<Pick<LoadingSkeletonProps, 'active' | 'paragraphRows' | 'titleWidth'>> = ({
  active = true,
  paragraphRows = 4,
  titleWidth = '30%',
}) => {
  return (
    <div className={styles.skeletonDetail}>
      <Skeleton active={active} title={{ width: titleWidth }} paragraph={{ rows: paragraphRows }} />
      <div className={styles.skeletonDivider}>
        <Skeleton active={active} title={{ width: '100%' }} paragraph={{ rows: 1 }} />
      </div>
    </div>
  );
};

// 表单模式骨架屏
const FormSkeleton: React.FC<Pick<LoadingSkeletonProps, 'active' | 'paragraphRows'>> = ({
  active = true,
  paragraphRows = 1,
}) => {
  return (
    <div className={styles.skeletonForm}>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className={styles.skeletonFormItem}>
          <Skeleton active={active} title={{ width: '20%' }} paragraph={{ rows: paragraphRows }} />
        </div>
      ))}
    </div>
  );
};

// 图表模式骨架屏
const ChartSkeleton: React.FC<Pick<LoadingSkeletonProps, 'active'>> = ({ active = true }) => {
  return (
    <div className={styles.skeletonChart}>
      <Skeleton active={active} avatar={{ shape: 'circle', size: 100 }} paragraph={{ rows: 2 }} />
      <div className={styles.skeletonChartBars}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} active={active} paragraph={{ rows: 1 }} title={false} />
        ))}
      </div>
    </div>
  );
};

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'card',
  className = '',
  active = true,
  paragraphRows,
  count,
  titleWidth,
  renderContent,
}) => {
  if (renderContent) {
    return <div className={`${styles.skeletonCustom} ${className}`}>{renderContent}</div>;
  }

  const skeletonProps = { active, paragraphRows, count, titleWidth };

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return <CardSkeleton {...skeletonProps} />;
      case 'list':
        return <ListSkeleton {...skeletonProps} />;
      case 'detail':
        return <DetailSkeleton {...skeletonProps} />;
      case 'form':
        return <FormSkeleton {...skeletonProps} />;
      case 'chart':
        return <ChartSkeleton {...skeletonProps} />;
      default:
        return <Skeleton active={active} paragraph={{ rows: paragraphRows || 3 }} />;
    }
  };

  return <div className={`${styles.skeletonContainer} ${className}`}>{renderSkeleton()}</div>;
};

export default LoadingSkeleton;
