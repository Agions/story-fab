import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommentaryVoiceSelector from './commentary-voice-selector';
import type { VoiceInfo } from '@/types';

describe('CommentaryVoiceSelector', () => {
  const mockVoices: VoiceInfo[] = [
    {
      id: 'voice-1',
      name: '小雯',
      gender: 'female',
      style: '温柔',
      description: '温柔女声，适合情感类视频',
    },
    {
      id: 'voice-2',
      name: '老王',
      gender: 'male',
      style: '稳重',
      description: '稳重男声，适合纪录片',
    },
  ];

  const defaultProps = {
    voices: mockVoices,
    selected: 'voice-1',
    onChange: vi.fn(),
    onPreview: vi.fn(),
    isPreviewing: false,
  };

  it('renders hint text', () => {
    render(<CommentaryVoiceSelector {...defaultProps} />);
    expect(
      screen.getByText('选择配音音色，建议根据风格预设匹配'),
    ).toBeInTheDocument();
  });

  it('renders all voice cards', () => {
    render(<CommentaryVoiceSelector {...defaultProps} />);
    expect(screen.getByText('小雯')).toBeInTheDocument();
    expect(screen.getByText('老王')).toBeInTheDocument();
  });

  it('renders gender badges correctly', () => {
    render(<CommentaryVoiceSelector {...defaultProps} />);
    expect(screen.getByText('女')).toBeInTheDocument();
    expect(screen.getByText('男')).toBeInTheDocument();
  });

  it('calls onChange when a voice card is clicked', async () => {
    const onChange = vi.fn();
    render(<CommentaryVoiceSelector {...defaultProps} onChange={onChange} />);
    await userEvent.click(screen.getByText('老王'));
    expect(onChange).toHaveBeenCalledWith('voice-2');
  });

  it('calls onPreview when preview button is clicked', async () => {
    const onPreview = vi.fn();
    render(<CommentaryVoiceSelector {...defaultProps} onPreview={onPreview} />);
    await userEvent.click(screen.getByText('预览音色'));
    expect(onPreview).toHaveBeenCalledTimes(1);
  });

  it('disables preview button when isPreviewing is true', () => {
    render(<CommentaryVoiceSelector {...defaultProps} isPreviewing={true} />);
    expect(screen.getByText('预览中...')).toBeDisabled();
  });

  it('renders empty state when voices array is empty', () => {
    render(<CommentaryVoiceSelector {...defaultProps} voices={[]} />);
    expect(
      screen.getByText('选择配音音色，建议根据风格预设匹配'),
    ).toBeInTheDocument();
  });
});
