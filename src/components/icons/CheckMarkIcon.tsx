import React from 'react';

interface CheckMarkIconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const CheckMarkIcon: React.FC<CheckMarkIconProps> = React.memo(({
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
    className={className}
  >
    <polyline points="20,6 9,17 4,12" />
  </svg>
));

CheckMarkIcon.displayName = 'CheckMarkIcon';
export default CheckMarkIcon;
