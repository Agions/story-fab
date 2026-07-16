import React from 'react';

interface PlayCircleIconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

/**
 * PlayCircleIcon - Circular play button (filled style)
 */
const PlayCircleIcon: React.FC<PlayCircleIconProps> = React.memo(({
  size = 16,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
  </svg>
));

PlayCircleIcon.displayName = 'PlayCircleIcon';
export default PlayCircleIcon;
