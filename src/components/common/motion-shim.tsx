/**
 * 动画组件
 * 基于 CSS 的轻量级动画解决方案
 */
import React, { CSSProperties } from 'react';

// 基础动画组件
interface MotionProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  initial?: CSSProperties | boolean;
  animate?: CSSProperties | boolean;
  exit?: CSSProperties | boolean;
  transition?: {
    duration?: number;
    ease?: number[];
    delay?: number;
  };
  whileHover?: CSSProperties;
  whileTap?: CSSProperties;
  className?: string;
  layout?: boolean;
}

// 内部组件实现
const MotionDivComponent: React.FC<MotionProps> = ({
  children,
  initial,
  animate,
  transition,
  className = '',
  style,
  ...rest
}) => {
  const motionStyle: CSSProperties = {};
  
  // 处理 initial 状态
  if (initial === true) {
    motionStyle.opacity = 1;
  } else if (initial && typeof initial === 'object') {
    Object.assign(motionStyle, initial);
  }
  
  // 构建 transition 字符串
  let transitionStr = 'all';
  if (transition) {
    const duration = transition.duration || 0.3;
    const ease = transition.ease ? `cubic-bezier(${transition.ease.join(',')})` : 'cubic-bezier(0.4, 0, 0.2, 1)';
    const delay = transition.delay ? `${transition.delay}s` : '';
    transitionStr = `all ${duration}s ${ease} ${delay}`.trim();
  } else {
    transitionStr = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  }
  
  const combinedStyle: CSSProperties = {
    ...style,
    ...motionStyle,
    transition: transitionStr,
  };

  // 如果有 animate 属性
  if (animate && typeof animate === 'object') {
    // 使用 CSS 动画 keyframes
    const keyframes = `
      @keyframes motionFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    return (
      <>
        <style>{keyframes}</style>
        <div 
          {...rest}
          className={className}
          style={{
            ...combinedStyle,
            animation: 'motionFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
          }}
        >
          {children}
        </div>
      </>
    );
  }

  return (
    <div {...rest} className={className} style={combinedStyle}>
      {children}
    </div>
  );
};

// 导出 motion 对象，包含 div 属性
export const motion: typeof MotionDivComponent & {
  div: typeof MotionDivComponent;
} = Object.assign(MotionDivComponent, {
  div: MotionDivComponent,
});

// 常用动画变体
/**
 * 动画过渡组件
 */
/**
 * AnimatePresence 替代方案
 * 使用 CSS keyframes
 */
export default motion;
