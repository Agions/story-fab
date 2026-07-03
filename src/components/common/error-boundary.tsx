import { logger } from '@/shared/utils/logging';
import React, { Component, ReactNode } from 'react';
import styles from '././error-boundary.module.less';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('ErrorBoundary caught an error:', { error, errorInfo });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          className={styles.overlay}
        >
          <div className={styles.card}>
            <h2 className={styles.title}>出错了</h2>
            <p className={styles.description}>
              {this.state.error?.message || '应用程序发生了错误'}
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

    return this.props.children;
  }
}

export default ErrorBoundary;
