/**
 * Error Boundary 组件
 * 捕获子组件错误，提供降级 UI
 */
import React, { Component, ReactNode } from 'react';

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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
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
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            backgroundColor: '#0f172a',
            color: '#e2e8f0',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 560,
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: 12,
              padding: 20,
              background: 'rgba(15, 23, 42, 0.7)',
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>出错了</h2>
            <p style={{ marginTop: 0, marginBottom: 16, opacity: 0.9 }}>
              {this.state.error?.message || '应用程序发生了错误'}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  border: 0,
                  borderRadius: 8,
                  padding: '10px 14px',
                  color: '#ffffff',
                  background: '#2563eb',
                  cursor: 'pointer',
                }}
              >
                重试
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  border: '1px solid rgba(148, 163, 184, 0.4)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  color: '#e2e8f0',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
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
