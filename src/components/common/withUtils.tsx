/**
 * 高阶组件增强
 * 提供组件能力扩展
 */
import React, { ComponentType, forwardRef, useState } from 'react';

/**
 * withLoading HOC
 * 为组件添加加载状态
 */
export function withLoading<P extends object>(
  WrappedComponent: ComponentType<P>,
  LoadingComponent?: ComponentType
) {
  const WithLoading = forwardRef<any, P & { loading?: boolean }>((props, ref) => {
    const { loading, ...rest } = props;
    
    if (loading) {
      return LoadingComponent 
        ? <LoadingComponent /> 
        : <div>Loading...</div>;
    }
    
    return <WrappedComponent ref={ref} {...rest as P} />;
  });
  
  WithLoading.displayName = `withLoading(${WrappedComponent.displayName || WrappedComponent.name})`;
  return WithLoading;
}

/**
 * withError HOC
 * 为组件添加错误处理
 */
export function withError<P extends object>(
  WrappedComponent: ComponentType<P>,
  ErrorComponent?: ComponentType<{ error: Error; retry: () => void }>
) {
  const WithError = forwardRef<any, P & { error?: Error | null; onError?: (error: Error) => void }>((props, ref) => {
    const { error, onError, ...rest } = props;
    
    if (error) {
      return ErrorComponent 
        ? <ErrorComponent error={error} retry={() => onError?.(error)} />
        : <div>Error: {error.message}</div>;
    }
    
    return <WrappedComponent ref={ref} {...rest as P} />;
  });
  
  WithError.displayName = `withError(${WrappedComponent.displayName || WrappedComponent.name})`;
  return WithError;
}

/**
 * withProps HOC
 * 为组件添加额外 props
 */
export function withProps<P extends object, T extends Partial<P>>(
  WrappedComponent: ComponentType<P>,
  additionalProps: T
) {
  const WithProps = forwardRef<any, Omit<P, keyof T>>((props, ref) => {
    return <WrappedComponent ref={ref} {...props} {...additionalProps} />;
  });
  
  WithProps.displayName = `withProps(${WrappedComponent.displayName || WrappedComponent.name})`;
  return WithProps;
}

/**
 * 复合组件工厂
 * 用于创建相关的组件组
 */
export function createCompoundComponent<T extends string>({
  displayName,
  components,
}: {
  displayName: string;
  components: Record<T, ComponentType<any>>;
}) {
  const CompoundComponent = Object.assign(
    (props: any) => {
      const { children, ...rest } = props;
      return children instanceof Function 
        ? children(components) 
        : null;
    },
    components
  );
  
  CompoundComponent.displayName = displayName;
  return CompoundComponent;
}

/**
 * 条件渲染组件
 */
interface ConditionalProps {
  when: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Show({ when, children, fallback = null }: ConditionalProps) {
  return when ? <>{children}</> : <>{fallback}</>;
}

/**
 * 异步加载组件
 */
interface SuspenseProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
}

export function Suspense({ children, fallback = null, delay = 0 }: SuspenseProps) {
  const [shouldShow, setShouldShow] = useState(delay === 0);
  
  if (delay > 0 && !shouldShow) {
    setTimeout(() => setShouldShow(true), delay);
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * 懒加载组件包装
 */
export function lazy<P extends object>(importFunc: () => Promise<{ default: ComponentType<P> }>) {
  return React.lazy(importFunc);
}

/**
 * 内存化计算组件
 */
interface ComputeProps<T> {
  compute: () => T;
  children: (value: T) => React.ReactNode;
}

export function Compute<T>({ compute, children }: ComputeProps<T>) {
  const value = React.useMemo(() => compute(), [compute]);
  return <>{children(value)}</>;
}

/**
 * 上下文桥接组件
 */
interface BridgeProps<C> {
  context: React.Context<C>;
  children: (value: C) => React.ReactNode;
}

export function Bridge<C>({ context, children }: BridgeProps<C>) {
  const value = React.useContext(context);
  return <>{children(value)}</>;
}
