import React, { ReactNode } from 'react';

interface AnimatedContainerProps {
  children: ReactNode;
  animation?: 'fade' | 'slide' | 'zoom';
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 动画容器组件，为子组件添加入场动画效果
 */
const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  animation = 'fade',
  delay = 0,
  className = '',
  style = {},
}) => {
  // 动画类名映射
  const animationClass = {
    fade: 'fade-in',
    slide: 'slide-in',
    zoom: 'zoom-in',
  };

  const animationStyle: React.CSSProperties = {
    animationDelay: `${delay}ms`,
    ...style,
  };

  return (
    <div 
      className={`${animationClass[animation]} ${className}`}
      style={animationStyle}
    >
      {children}
    </div>
  );
};

export default AnimatedContainer; 