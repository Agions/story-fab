/**
 * 通用按钮组件
 * 统一按钮样式和行为
 */

import React from 'react';
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';
import classNames from 'classnames';
import styles from './index.module.less';

interface ButtonProps extends AntButtonProps {
  /** 变体 */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** 尺寸 */
  size?: 'small' | 'medium' | 'large';
  /** 是否加载中 */
  loading?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否块级 */
  block?: boolean;
  /** 图标 */
  icon?: React.ReactNode;
  /** 点击事件 */
  onClick?: () => void;
  /** 子元素 */
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  className,
  children,
  ...props
}) => {
  const typeMap: Record<string, AntButtonProps['type']> = {
    primary: 'primary',
    secondary: 'default',
    ghost: 'dashed',
    danger: 'primary'
  };

  return (
    <AntButton
      type={typeMap[variant]}
      size={size === 'medium' ? 'middle' : size}
      danger={variant === 'danger'}
      className={classNames(
        styles.button,
        styles[variant],
        styles[size],
        className
      )}
      {...props}
    >
      {children}
    </AntButton>
  );
};

export default Button;
