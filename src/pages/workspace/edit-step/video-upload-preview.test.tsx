import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import VideoUploadPreview from './video-upload-preview';
import { createMockVideoUpload } from '../../../__tests__/mocks/video-upload';
import type { VideoInfo } from '@/types';

// Mock formatDuration and formatFileSize
vi.mock('@/shared', () => ({
  formatDuration: (secs: number) => `${Math.floor(secs / 60)}:${Math.floor(secs % 60).toString().padStart(2, '0')}`,
  formatFileSize: (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`,
}));

const mockVideo: VideoInfo = {
  id: 'video_1',
  path: 'test-video.mp4',
  name: '测试视频.mp4',
  duration: 120,
  width: 1920,
  height: 1080,
  fps: 30,
  format: 'mp4',
  size: 50000000,
  thumbnail: '',
  createdAt: new Date().toISOString(),
};

const mockUseVideoUpload = vi.fn(() =>
  createMockVideoUpload({ projectState: { currentVideo: mockVideo } }),
);

vi.mock('./use-video-upload', () => ({
  useVideoUpload: () => mockUseVideoUpload(),
}));

describe('VideoUploadPreview', () => {
  it('renders video card with file name', () => {
    render(<VideoUploadPreview />);
    expect(screen.getByText('测试视频.mp4')).toBeInTheDocument();
  });

  it('renders video duration', () => {
    render(<VideoUploadPreview />);
    expect(screen.getByText('2:00')).toBeInTheDocument();
  });

  it('renders video resolution', () => {
    render(<VideoUploadPreview />);
    expect(screen.getByText('1920×1080')).toBeInTheDocument();
  });

  it('renders video format', () => {
    render(<VideoUploadPreview />);
    expect(screen.getByText('MP4')).toBeInTheDocument();
  });

  it('renders video file size', () => {
    render(<VideoUploadPreview />);
    expect(screen.getByText('47.7 MB')).toBeInTheDocument();
  });

  it('renders video fps', () => {
    render(<VideoUploadPreview />);
    expect(screen.getByText('30 fps')).toBeInTheDocument();
  });

  it('returns null when no video is uploaded', () => {
    mockUseVideoUpload.mockReturnValueOnce(createMockVideoUpload());
    const { container } = render(<VideoUploadPreview />);
    expect(container.innerHTML).toBe('');
  });
});
