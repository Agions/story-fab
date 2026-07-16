/**
 * ErrorBoundary — 通用 React 错误边界
 *
 * 捕获子树渲染期 JS 异常,阻止整页崩溃。
 * 显示降级 UI + 重置按钮,用户点击后重置子树到初始态。
 *
 * 设计选择:
 *  - 使用类组件 (React 唯一支持 getDerivedStateFromError 的方式)
 *  - 重置通过 key 变化重新挂载子树 (resetTick 递增)
 *  - 自动上报到 logger + 可选外部回调
 *
 * 用法:
 *   <ErrorBoundary name="VideoEditor"><VideoEditor /></ErrorBoundary>
 *   export default withErrorBoundary(MyComponent, { name: 'MyComponent' });
 */
import { logger } from '@/shared/utils/logging';
import { normalizeError } from '@/core/errors/normalize';
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import styles from './error-boundary.module.less';

interface Props {
  children: ReactNode;
  /** 自定义降级 UI;默认使用内置占位 */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** 错误上报回调 (可选) */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** 标识位 (用于日志) */
  name?: string;
}

interface State {
  error: Error | null;
  resetTick: number; // 递增以强制重新挂载子树
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, resetTick: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const label = this.props.name ? `[${this.props.name}]` : '[ErrorBoundary]';
    // 归一化为 AppError 保留分类上下文（PR-5.2）
    const normalized = normalizeError(error, 'APP_RENDER_ERROR');
    logger.error(`${label} 渲染异常`, {
      // 保留原字段以兼容旧测试
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      // 新增归一化字段
      normalized: {
        code: normalized.code,
        severity: normalized.severity,
        userMessage: normalized.userMessage,
        retryable: normalized.retryable,
        context: normalized.context,
      },
    });
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState((s) => ({ error: null, resetTick: s.resetTick + 1 }));
  };

  render(): ReactNode {
    const { error } = this.state;
    const { children, fallback, name } = this.props;

    if (error) {
      if (fallback) {
        return typeof fallback === 'function'
          ? fallback(error, this.handleReset)
          : fallback;
      }

      return (
        <div role="alert" className={styles.overlay}>
          <div className={styles.card}>
            <h2 className={styles.title}>
              {name ? `${name} 出现异常` : '出错了'}
            </h2>
            <p className={styles.description}>
              {error.message || '应用程序发生了错误'}
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                onClick={this.handleReset}
                className={styles.primaryBtn}
              >
                重试
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className={styles.secondaryBtn}
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      );
    }

    // key 变化时重新挂载子树
    return <React.Fragment key={this.state.resetTick}>{children}</React.Fragment>;
  }
}

/**
 * HOC 装饰器 — 包装任意组件并自动附加错误边界。
 *
 * 用法:
 *   export default withErrorBoundary(MyComponent, { name: 'MyComponent' });
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<Props, 'children'> = {},
): React.FC<P> {
  const name = options.name ?? WrappedComponent.displayName ?? WrappedComponent.name;
  const WithBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...options} name={name}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
  WithBoundary.displayName = `withErrorBoundary(${name})`;
  return WithBoundary;
}

export default ErrorBoundary;
