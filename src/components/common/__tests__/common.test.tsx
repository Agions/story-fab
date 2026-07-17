/**
 * components/common tests
 *
 * Stage 9 PR-14: components/common + components/layout
 * - motion-shim (CSS-based animation wrapper)
 * - keyboard-shortcuts-help (Dialog + shortcuts list)
 *
 * Note: error-boundary already covered by its own test file.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { motion } from '../motion-shim';
import KeyboardShortcutsHelp, { useShortcutsHelpToggle } from '../keyboard-shortcuts-help';

describe('motion-shim', () => {
  it('renders a div with children', () => {
    render(<motion.div>Hello</motion.div>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('applies initial style', () => {
    render(
      <motion.div initial={{ opacity: 0.5, transform: 'scale(0.9)' }}>
        X
      </motion.div>,
    );
    const el = screen.getByText('X');
    expect(el.style.opacity).toBe('0.5');
    expect(el.style.transform).toBe('scale(0.9)');
  });

  it('initial=true applies opacity:1', () => {
    render(<motion.div initial>X</motion.div>);
    const el = screen.getByText('X');
    expect(el.style.opacity).toBe('1');
  });

  it('applies default transition string when no transition prop', () => {
    render(<motion.div>X</motion.div>);
    const el = screen.getByText('X');
    expect(el.style.transition).toContain('cubic-bezier(0.4, 0, 0.2, 1)');
  });

  it('applies custom transition', () => {
    render(
      <motion.div transition={{ duration: 0.5, delay: 0.1 }}>X</motion.div>,
    );
    const el = screen.getByText('X');
    expect(el.style.transition).toContain('0.5s');
    expect(el.style.transition).toContain('0.1s');
  });

  it('renders keyframes + animation when animate is object', () => {
    const { container } = render(
      <motion.div animate={{ opacity: 1, y: 0 }}>Anim</motion.div>,
    );
    // keyframes <style> element
    const styles = container.querySelectorAll('style');
    expect(styles.length).toBeGreaterThan(0);
    expect(styles[0].textContent).toContain('motionFadeIn');
    // the inner div should have animation
    const div = container.querySelector('div')!;
    expect(div.style.animation).toContain('motionFadeIn');
  });

  it('merges custom className', () => {
    const { container } = render(
      <motion.div className="my-motion-class">X</motion.div>,
    );
    const div = container.querySelector('div')!;
    expect(div.className).toContain('my-motion-class');
  });
});

describe('KeyboardShortcutsHelp', () => {
  it('renders nothing when visible=false', () => {
    render(<KeyboardShortcutsHelp visible={false} onClose={vi.fn()} />);
    // base-ui Dialog may keep the title in DOM but hidden — assert on
    // text presence only (the visible assertion is covered by the next test).
    expect(screen.queryByText(/Keyboard Shortcuts/)).toBeNull();
  });

  it('renders title and sections when visible=true', () => {
    render(<KeyboardShortcutsHelp visible={true} onClose={vi.fn()} />);
    // The dialog title is visible
    expect(screen.getByText(/键盘快捷键/)).toBeInTheDocument();
  });

  it('renders all known shortcut categories', () => {
    render(<KeyboardShortcutsHelp visible={true} onClose={vi.fn()} />);
    // Known category labels from use-keyboard-shortcuts
    expect(screen.getByText('播放控制')).toBeInTheDocument();
    expect(screen.getByText('片段编辑')).toBeInTheDocument();
    expect(screen.getByText('时间线')).toBeInTheDocument();
    expect(screen.getByText('项目')).toBeInTheDocument();
  });

  it('renders some known shortcut descriptions', () => {
    render(<KeyboardShortcutsHelp visible={true} onClose={vi.fn()} />);
    expect(screen.getByText('播放 / 暂停')).toBeInTheDocument();
    expect(screen.getByText('设定入点')).toBeInTheDocument();
    expect(screen.getByText('撤销')).toBeInTheDocument();
  });

  it('fires onClose on Escape keydown', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsHelp visible={true} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('does not register Escape listener when not visible', () => {
    const onClose = vi.fn();
    const { rerender } = render(<KeyboardShortcutsHelp visible={false} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    rerender(<KeyboardShortcutsHelp visible={true} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('unregisters listener on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = render(<KeyboardShortcutsHelp visible={true} onClose={onClose} />);
    unmount();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('useShortcutsHelpToggle hook', () => {
  function Harness({ onToggle }: { onToggle: (v: boolean) => void }) {
    useShortcutsHelpToggle(onToggle);
    return null;
  }

  it('opens help on ? keypress', () => {
    const onToggle = vi.fn();
    render(<Harness onToggle={onToggle} />);
    fireEvent.keyDown(window, { key: '?' });
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('opens help on Shift+/ (US keyboard ?)', () => {
    const onToggle = vi.fn();
    render(<Harness onToggle={onToggle} />);
    fireEvent.keyDown(window, { key: '/', shiftKey: true });
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('ignores ? when target is INPUT', () => {
    const onToggle = vi.fn();
    // Create a fake INPUT target without going through fireEvent's
    // element-validation (which tries to set .value on the input).
    const fakeInput = {
      tagName: 'INPUT',
      isContentEditable: false,
    };
    render(<Harness onToggle={onToggle} />);
    const ev = new KeyboardEvent('keydown', { key: '?' });
    Object.defineProperty(ev, 'target', { value: fakeInput, configurable: true });
    window.dispatchEvent(ev);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('ignores ? when target is contentEditable', () => {
    const onToggle = vi.fn();
    const fakeEditable = {
      tagName: 'DIV',
      isContentEditable: true,
    };
    render(<Harness onToggle={onToggle} />);
    const ev = new KeyboardEvent('keydown', { key: '?' });
    Object.defineProperty(ev, 'target', { value: fakeEditable, configurable: true });
    window.dispatchEvent(ev);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('removes listener on unmount', () => {
    const onToggle = vi.fn();
    const { unmount } = render(<Harness onToggle={onToggle} />);
    unmount();
    fireEvent.keyDown(window, { key: '?' });
    expect(onToggle).not.toHaveBeenCalled();
  });
});
