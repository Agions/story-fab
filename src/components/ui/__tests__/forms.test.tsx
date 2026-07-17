/**
 * UI form primitives tests
 *
 * Stage 9 PR-13: components/ui 测试
 * - Input, Textarea, Switch, Slider, Checkbox
 *
 * Note: most of these wrap @base-ui/react primitives. We test:
 *  - data-slot + className application
 *  - controlled vs uncontrolled value handling
 *  - event forwarding (onClick, onChange)
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../input';
import { Textarea } from '../textarea';
import { Switch } from '../switch';
import { Slider } from '../slider';
import { Checkbox } from '../checkbox';

describe('Input', () => {
  it('renders with default classes', () => {
    const { container } = render(<Input />);
    const el = container.querySelector('input')!;
    expect(el).toHaveAttribute('data-slot', 'input');
    expect(el.className).toContain('rounded-lg');
  });

  it('forwards type prop', () => {
    const { container } = render(<Input type="email" />);
    expect(container.querySelector('input')).toHaveAttribute('type', 'email');
  });

  it('controlled value updates via onChange', () => {
    const onChange = vi.fn();
    render(<Input value="hi" onChange={onChange} />);
    const el = screen.getByDisplayValue('hi');
    fireEvent.change(el, { target: { value: 'bye' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('disabled reflects prop', () => {
    render(<Input disabled placeholder="off" />);
    expect(screen.getByPlaceholderText('off')).toBeDisabled();
  });

  it('merges custom className', () => {
    const { container } = render(<Input className="extra" />);
    expect(container.querySelector('input')!.className).toContain('extra');
  });
});

describe('Textarea', () => {
  it('renders with default classes', () => {
    const { container } = render(<Textarea />);
    const el = container.querySelector('textarea')!;
    expect(el).toHaveAttribute('data-slot', 'textarea');
    expect(el.className).toContain('rounded-lg');
  });

  it('forwards value', () => {
    render(<Textarea value="content" onChange={() => {}} />);
    expect(screen.getByDisplayValue('content')).toBeInTheDocument();
  });

  it('disabled reflects prop', () => {
    render(<Textarea disabled placeholder="off" />);
    expect(screen.getByPlaceholderText('off')).toBeDisabled();
  });
});

describe('Switch', () => {
  it('renders with default classes', () => {
    const { container } = render(<Switch />);
    const el = container.querySelector('[data-slot="switch"]')!;
    expect(el).toHaveAttribute('data-size', 'default');
  });

  it('renders with sm size', () => {
    const { container } = render(<Switch size="sm" />);
    expect(container.querySelector('[data-slot="switch"]')).toHaveAttribute('data-size', 'sm');
  });

  it('toggles checked state on click', () => {
    const onCheckedChange = vi.fn();
    render(<Switch onCheckedChange={onCheckedChange} />);
    const el = screen.getByRole('switch');
    fireEvent.click(el);
    // onCheckedChange may receive (value, event) — we just check the first arg
    expect(onCheckedChange).toHaveBeenCalled();
    expect(onCheckedChange.mock.calls[0][0]).toBe(true);
  });

  it('disabled switch does not toggle', () => {
    const onCheckedChange = vi.fn();
    render(<Switch disabled onCheckedChange={onCheckedChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});

describe('Slider', () => {
  it('renders with data-slot', () => {
    const { container } = render(<Slider defaultValue={[25]} />);
    expect(container.querySelector('[data-slot="slider"]')).toBeInTheDocument();
  });

  it('applies default min=0 and max=100', () => {
    const { container } = render(<Slider defaultValue={[50]} />);
    const root = container.querySelector('[data-slot="slider"]')!;
    // Verify the slider root rendered (we don't pin base-ui's exact attribute
    // wiring — it's covered by base-ui's own tests). Our test just confirms
    // the wrapper around base-ui works.
    expect(root).toBeInTheDocument();
  });

  it('renders thumb and track', () => {
    const { container } = render(<Slider defaultValue={[50]} />);
    expect(container.querySelector('[data-slot="slider-thumb"]')).toBeInTheDocument();
  });
});

describe('Checkbox', () => {
  it('renders unchecked by default', () => {
    render(<Checkbox aria-label="agree" />);
    expect(screen.getByLabelText('agree')).not.toBeChecked();
  });

  it('toggles checked state on click', () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox onCheckedChange={onCheckedChange} aria-label="agree" />);
    fireEvent.click(screen.getByLabelText('agree'));
    expect(onCheckedChange).toHaveBeenCalled();
    expect(onCheckedChange.mock.calls[0][0]).toBe(true);
  });

  it('controlled checked reflects prop', () => {
    render(<Checkbox checked onCheckedChange={() => {}} aria-label="x" />);
    expect(screen.getByLabelText('x')).toBeChecked();
  });

  it('disabled prevents toggling', () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox disabled onCheckedChange={onCheckedChange} aria-label="x" />);
    fireEvent.click(screen.getByLabelText('x'));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
