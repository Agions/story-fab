import React from 'react';

interface RefreshCwIconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const RefreshCwIcon: React.FC<RefreshCwIconProps> = React.memo(({
  size = 16,
  className,
  strokeWidth = 2.5,
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
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
));

RefreshCwIcon.displayName = 'RefreshCwIcon';
export default RefreshCwIcon;
