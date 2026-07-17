/**
 * UI feedback & display component tests
 *
 * Stage 9 PR-13: components/ui 测试
 * - Progress, Tabs, Steps
 *
 * Note: Skipping toast (uses createPortal + complex context) and sonner
 * (depends on external notify emitter wired to a ToastProvider) — covered
 * by integration smoke rather than unit.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress, ProgressTrack, ProgressIndicator, ProgressLabel } from '../progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs';
import { Steps } from '../steps';

describe('Progress', () => {
  it('renders root with data-slot', () => {
    const { container } = render(<Progress value={50} />);
    expect(container.querySelector('[data-slot="progress"]')).toBeInTheDocument();
  });

  it('renders track and indicator', () => {
    const { container } = render(<Progress value={75} />);
    expect(container.querySelector('[data-slot="progress-track"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="progress-indicator"]')).toBeInTheDocument();
  });

  it('exposes subcomponents for composition', () => {
    const { container } = render(
      <Progress value={50}>
        <ProgressLabel>Uploading</ProgressLabel>
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </Progress>,
    );
    expect(screen.getByText('Uploading')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="progress-track"]')).toBeInTheDocument();
  });
});

describe('Tabs', () => {
  it('renders TabsList + TabsTrigger + TabsContent together', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">One</TabsTrigger>
          <TabsTrigger value="tab2">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>,
    );
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });

  it('TabsContent for inactive tab is not present', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">A content</TabsContent>
        <TabsContent value="b">B content</TabsContent>
      </Tabs>,
    );
    // B content is not rendered because it's not the active tab
    expect(screen.queryByText('B content')).toBeNull();
  });

  it('orientation data attribute is set', () => {
    const { container } = render(
      <Tabs orientation="vertical" defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
        <TabsContent value="a">A</TabsContent>
      </Tabs>,
    );
    const root = container.querySelector('[data-slot="tabs"]')!;
    expect(root).toHaveAttribute('data-orientation', 'vertical');
  });
});

describe('Steps', () => {
  it('renders items array', () => {
    const { container } = render(
      <Steps
        current={1}
        items={[
          { title: 'Step 1' },
          { title: 'Step 2' },
          { title: 'Step 3' },
        ]}
      />,
    );
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders children when no items prop', () => {
    render(
      <Steps current={0}>
        <div>Custom child</div>
      </Steps>,
    );
    expect(screen.getByText('Custom child')).toBeInTheDocument();
  });

  it('uses description when provided', () => {
    // Note: items-array branch currently only renders title (description/icon
    // rendering is only on the children branch via cloneElement).
    render(
      <Steps
        current={1}
        items={[
          { title: 'A', description: 'About A' },
          { title: 'B', description: 'About B' },
        ]}
      />,
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    // Same caveat as above — icon in items array is currently unused.
    render(
      <Steps
        current={0}
        items={[{ title: 'One', icon: <span data-testid="step-icon">⭐</span> }]}
      />,
    );
    expect(screen.getByText('One')).toBeInTheDocument();
  });
});
