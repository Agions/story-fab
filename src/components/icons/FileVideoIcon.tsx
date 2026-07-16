import React from 'react';

interface FileVideoIconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const FileVideoIcon: React.FC<FileVideoIconProps> = React.memo(({
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
    <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8.5A1.5 1.5 0 014.5 7h11A1.5 1.5 0 0117 8.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 15.5v-7z" />
  </svg>
));

FileVideoIcon.displayName = 'FileVideoIcon';
export default FileVideoIcon;
