import React from 'react';

interface AlertCircleIconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const AlertCircleIcon: React.FC<AlertCircleIconProps> = React.memo(({
  size = 16,
  className,
  strokeWidth = 2,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
));

AlertCircleIcon.displayName = 'AlertCircleIcon';
export default AlertCircleIcon;
