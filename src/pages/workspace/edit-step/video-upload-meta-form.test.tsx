import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import VideoUploadMetaForm from './video-upload-meta-form';

describe('VideoUploadMetaForm', () => {
  it('renders without crashing', () => {
    const { container } = render(<VideoUploadMetaForm />);
    // Placeholder component renders a div container
    expect(container.firstChild).toBeInstanceOf(HTMLElement);
  });

  it('renders a container div', () => {
    const { container } = render(<VideoUploadMetaForm />);
    // The component renders a single div wrapper (className is undefined in test env)
    expect(container.querySelector('div')).toBeInTheDocument();
  });
});
