/**
 * 通用卡片组件
 * 统一卡片样式和行为
 */

import React from 'react';
import { Card as AntCard, CardProps as AntCardProps } from 'antd';
import classNames from 'classnames';
import styles from './index.module.less';

interface CardProps extends AntCardProps {
  /** 是否可悬停 */
  hoverable?: boolean;
  /** 是否选中 */
  selected?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 尺寸 */
  size?: 'small' | 'default' | 'large';
  /** 变体 */
  variant?: 'default' | 'outlined' | 'filled';
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  selected = false,
  className,
  size = 'default',
  variant = 'default',
  ...props
}) => {
  return (
    <AntCard
      className={classNames(
        styles.card,
        styles[size],
        styles[variant],
        {
          [styles.hoverable]: hoverable,
          [styles.selected]: selected
        },
        className
      )}
      {...props}
    >
      {children}
    </AntCard>
  );
};

export default Card;
