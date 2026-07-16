import React from 'react';

interface FilmIconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

/**
 * FilmIcon - Movie/film strip icon for scene sections
 */
const FilmIcon: React.FC<FilmIconProps> = React.memo(({
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
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
    <line x1="7" y1="2" x2="7" y2="22" />
    <line x1="17" y1="2" x2="17" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
  </svg>
));

FilmIcon.displayName = 'FilmIcon';
export default FilmIcon;
