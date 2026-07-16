import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import VideoUploadDropzone from './video-upload-dropzone';
import { createMockVideoUpload } from '../../../__tests__/mocks/video-upload';

const mockUseVideoUpload = vi.fn(() => createMockVideoUpload());

vi.mock('./use-video-upload', () => ({
  useVideoUpload: () => mockUseVideoUpload(),
}));

describe('VideoUploadDropzone', () => {
  it('renders upload zone with prompt text', () => {
    render(<VideoUploadDropzone />);
    expect(screen.getByText('点击或拖拽视频文件到此处上传')).toBeInTheDocument();
  });

  it('renders secondary text', () => {
    render(<VideoUploadDropzone />);
    expect(screen.getByText('也可以点击选择文件')).toBeInTheDocument();
  });

  it('renders format hint', () => {
    render(<VideoUploadDropzone />);
    expect(screen.getByText('支持 MP4 / MOV / AVI / MKV')).toBeInTheDocument();
  });

  it('renders hidden file input', () => {
    render(<VideoUploadDropzone />);
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
  });

  it('renders prerequisite message when project not created', () => {
    mockUseVideoUpload.mockReturnValueOnce(
      createMockVideoUpload({
        projectState: { stepStatus: { 'project-create': false } as never },
      }),
    );

    render(<VideoUploadDropzone />);
    expect(screen.getByText('请先创建项目，再上传视频')).toBeInTheDocument();
  });
});
