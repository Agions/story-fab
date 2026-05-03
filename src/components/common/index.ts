/**
 * 通用组件统一导出
 */

// 功能组件
export { default as ProcessingProgress } from '@/components/common/ProcessingProgress';
export { default as PreviewModal } from '@/components/common/PreviewModal';
export { default as AnimatedContainer } from './AnimatedContainer';

// ErrorBoundary
export { ErrorBoundary } from './ErrorBoundary';

// motion-shim (framer-motion compatibility)
export { motion, AnimatePresence } from './motion-shim';
