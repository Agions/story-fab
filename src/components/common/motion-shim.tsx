import React from 'react';

type MotionDivProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode;
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
  whileHover?: unknown;
  whileTap?: unknown;
  layout?: boolean | string;
};

export const motion = {
  div: ({
    children,
    initial: _initial,
    animate: _animate,
    exit: _exit,
    transition: _transition,
    whileHover: _whileHover,
    whileTap: _whileTap,
    layout: _layout,
    ...rest
  }: MotionDivProps) => <div {...rest}>{children}</div>,
};

export const AnimatePresence: React.FC<{
  children?: React.ReactNode;
  mode?: 'sync' | 'wait' | 'popLayout';
  initial?: boolean;
}> = ({ children }) => <>{children}</>;
