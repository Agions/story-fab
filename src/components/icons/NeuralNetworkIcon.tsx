import React from 'react';

interface NeuralNetworkIconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  completedTasks?: string[];
  completedClassName?: string;
}

/**
 * NeuralNetworkIcon - Neural network visualization with dynamic node states
 * Renders a multi-layer network with lines connecting nodes across layers
 */
const NeuralNetworkIcon: React.FC<NeuralNetworkIconProps> = React.memo(({
  size = 16,
  className,
  strokeWidth = 2.5,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 280 120"
    preserveAspectRatio="none"
    className={className}
  >
    {/* Layer 1 -> 2 lines */}
    <line x1="14" y1="60" x2="45" y2="24" stroke="currentColor" strokeWidth={strokeWidth} />
    <line x1="14" y1="60" x2="45" y2="96" stroke="currentColor" strokeWidth={strokeWidth} />
    {/* Layer 2 -> 3 lines */}
    <line x1="45" y1="24" x2="112" y2="36" stroke="currentColor" strokeWidth={strokeWidth} />
    <line x1="45" y1="96" x2="112" y2="84" stroke="currentColor" strokeWidth={strokeWidth} />
    <line x1="45" y1="24" x2="112" y2="84" stroke="currentColor" strokeWidth={strokeWidth} />
    <line x1="45" y1="96" x2="112" y2="36" stroke="currentColor" strokeWidth={strokeWidth} />
    {/* Layer 3 -> 4 lines */}
    <line x1="112" y1="36" x2="179" y2="18" stroke="currentColor" strokeWidth={strokeWidth} />
    <line x1="112" y1="84" x2="179" y2="60" stroke="currentColor" strokeWidth={strokeWidth} />
    <line x1="112" y1="36" x2="179" y2="102" stroke="currentColor" strokeWidth={strokeWidth} />
    <line x1="112" y1="84" x2="179" y2="102" stroke="currentColor" strokeWidth={strokeWidth} />
    {/* Layer 4 -> 5 lines */}
    <line x1="179" y1="18" x2="246" y2="42" stroke="currentColor" strokeWidth={strokeWidth} />
    <line x1="179" y1="60" x2="246" y2="78" stroke="currentColor" strokeWidth={strokeWidth} />
    <line x1="179" y1="102" x2="246" y2="78" stroke="currentColor" strokeWidth={strokeWidth} />
  </svg>
));

NeuralNetworkIcon.displayName = 'NeuralNetworkIcon';
export default NeuralNetworkIcon;
