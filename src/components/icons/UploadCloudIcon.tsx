import React from 'react';

interface UploadCloudIconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const UploadCloudIcon: React.FC<UploadCloudIconProps> = React.memo(({
  size = 16,
  className,
  strokeWidth = 2.5,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 56 56"
    fill="none"
    className={className}
  >
    <rect x="8" y="16" width="40" height="28" rx="4" stroke="currentColor" strokeWidth={strokeWidth} />
    <path d="M20 22l8-6 8 6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M28 16v18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    <path d="M14 36l4 4 8-8 8 8 4-4" stroke="currentColor" strokeWidth={strokeWidth * 0.8} strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    <circle cx="38" cy="24" r="3" fill="currentColor" opacity="0.6" />
  </svg>
));

UploadCloudIcon.displayName = 'UploadCloudIcon';
export default UploadCloudIcon;
