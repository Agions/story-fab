import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommentaryStyleSelector from './commentary-style-selector';
import type { ScriptStylePreset } from '@/types';

describe('CommentaryStyleSelector', () => {
  const defaultProps = {
    selected: 'conversational' as ScriptStylePreset,
    onChange: vi.fn(),
  };

  it('renders all style options', () => {
    render(<CommentaryStyleSelector {...defaultProps} />);
    expect(screen.getByText('幽默风趣')).toBeInTheDocument();
    expect(screen.getByText('严肃正式')).toBeInTheDocument();
    expect(screen.getByText('接地气')).toBeInTheDocument();
    expect(screen.getByText('悬疑紧张')).toBeInTheDocument();
    expect(screen.getByText('温情治愈')).toBeInTheDocument();
  });

  it('shows selected badge for selected style', () => {
    render(<CommentaryStyleSelector {...defaultProps} selected="humorous" />);
    expect(screen.getByText('已选')).toBeInTheDocument();
  });

  it('calls onChange when a style is clicked', async () => {
    const onChange = vi.fn();
    render(<CommentaryStyleSelector selected="humorous" onChange={onChange} />);
    await userEvent.click(screen.getByText('严肃正式'));
    expect(onChange).toHaveBeenCalledWith('serious');
  });

  it('renders hint text for single select mode', () => {
    render(<CommentaryStyleSelector {...defaultProps} />);
    expect(
      screen.getByText('选择解说风格，系统将据此调整文案语气和节奏'),
    ).toBeInTheDocument();
  });

  it('renders hint text for multi select mode', () => {
    render(<CommentaryStyleSelector {...defaultProps} multiSelect={true} />);
    expect(
      screen.getByText('选择多个风格，系统将分别为每种风格生成一个版本'),
    ).toBeInTheDocument();
  });

  it('renders emojis for each style', () => {
    render(<CommentaryStyleSelector {...defaultProps} />);
    expect(screen.getByText('😂')).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();
    expect(screen.getByText('🤝')).toBeInTheDocument();
    expect(screen.getByText('😱')).toBeInTheDocument();
    expect(screen.getByText('🥰')).toBeInTheDocument();
  });
});
