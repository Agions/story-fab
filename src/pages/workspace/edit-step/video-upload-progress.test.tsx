import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import VideoUploadProgress from './video-upload-progress';
import { createMockVideoUpload } from '../../../__tests__/mocks/video-upload';

// Mock formatFileSize
vi.mock('@/shared', () => ({
  formatFileSize: (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`,
}));

const mockFile = { name: 'test.mp4', size: 1000000 };
const mockFile2 = { name: 'my-video.mp4', size: 2000000 };

const mockUseVideoUpload = vi.fn(() =>
  createMockVideoUpload({
    state: {
      uploading: true,
      uploadProgress: 65,
      dragActive: false,
      uploadStatus: 'uploading',
      currentFile: mockFile as unknown as File,
    },
  }),
);

vi.mock('./use-video-upload', () => ({
  useVideoUpload: () => mockUseVideoUpload(),
}));

describe('VideoUploadProgress', () => {
  it('renders progress bar with percentage', () => {
    render(<VideoUploadProgress />);
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('renders file name during upload', () => {
    mockUseVideoUpload.mockReturnValueOnce(
      createMockVideoUpload({
        state: {
          uploading: true,
          uploadProgress: 30,
          dragActive: false,
          uploadStatus: 'uploading',
          currentFile: mockFile2 as unknown as File,
        },
      }),
    );
    render(<VideoUploadProgress />);
    expect(screen.getByText('my-video.mp4')).toBeInTheDocument();
  });

  it('renders pause button during uploading', () => {
    render(<VideoUploadProgress />);
    expect(screen.getByText('暂停上传')).toBeInTheDocument();
  });

  it('renders resume button when paused', () => {
    mockUseVideoUpload.mockReturnValueOnce(
      createMockVideoUpload({
        state: {
          uploading: true,
          uploadProgress: 40,
          dragActive: false,
          uploadStatus: 'paused',
          currentFile: mockFile as unknown as File,
        },
      }),
    );
    render(<VideoUploadProgress />);
    expect(screen.getByText('继续上传')).toBeInTheDocument();
  });

  it('does not show pause/resume button when completed', () => {
    mockUseVideoUpload.mockReturnValueOnce(
      createMockVideoUpload({
        state: {
          uploading: false,
          uploadProgress: 100,
          dragActive: false,
          uploadStatus: 'completed',
          currentFile: mockFile as unknown as File,
        },
      }),
    );
    render(<VideoUploadProgress />);
    expect(screen.queryByText('暂停上传')).not.toBeInTheDocument();
    expect(screen.queryByText('继续上传')).not.toBeInTheDocument();
  });

  it('returns null when not uploading and not completed', () => {
    mockUseVideoUpload.mockReturnValueOnce(
      createMockVideoUpload({
        state: {
          uploading: false,
          uploadProgress: 0,
          dragActive: false,
          uploadStatus: 'idle',
          currentFile: null,
        },
      }),
    );
    const { container } = render(<VideoUploadProgress />);
    expect(container.innerHTML).toBe('');
  });

  it('shows "已暂停" status text when paused', () => {
    mockUseVideoUpload.mockReturnValueOnce(
      createMockVideoUpload({
        state: {
          uploading: true,
          uploadProgress: 40,
          dragActive: false,
          uploadStatus: 'paused',
          currentFile: mockFile as unknown as File,
        },
      }),
    );
    render(<VideoUploadProgress />);
    expect(screen.getByText('已暂停')).toBeInTheDocument();
  });
});
