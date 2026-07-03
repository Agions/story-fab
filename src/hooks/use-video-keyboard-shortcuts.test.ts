import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVideoKeyboardShortcuts } from './use-video-keyboard-shortcuts';

function createKeyboardEvent(key: string, target?: EventTarget | null): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  Object.defineProperty(event, 'target', { value: target, configurable: true });
  return event;
}

describe('useVideoKeyboardShortcuts', () => {
  let addSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addSpy = vi.spyOn(window, 'addEventListener').mockImplementation(() => {});
    removeSpy = vi.spyOn(window, 'removeEventListener').mockImplementation(() => {});
  });

  afterEach(() => {
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  // ── basic registration ─────────────────────────────────────────────────────

  it('registers and unregisters a keydown listener', () => {
    const videoRef = { current: document.createElement('video') };
    const callbacks = {
      onTogglePlay: vi.fn(),
      onToggleFullscreen: vi.fn(),
      onSeek: vi.fn(),
      onVolumeChange: vi.fn(),
      onToggleMute: vi.fn(),
    };

    renderHook(() =>
      useVideoKeyboardShortcuts({ videoRef, ...callbacks }),
    );

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('unregisters the listener on unmount', () => {
    const videoRef = { current: document.createElement('video') };
    const callbacks = {
      onTogglePlay: vi.fn(),
      onToggleFullscreen: vi.fn(),
      onSeek: vi.fn(),
      onVolumeChange: vi.fn(),
      onToggleMute: vi.fn(),
    };

    const { unmount } = renderHook(() =>
      useVideoKeyboardShortcuts({ videoRef, ...callbacks }),
    );

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  // ── disabled flag ──────────────────────────────────────────────────────────

  it('ignores key events when disabled is true', () => {
    const videoRef = { current: document.createElement('video') };
    const onTogglePlay = vi.fn();

    renderHook(() =>
      useVideoKeyboardShortcuts({
        videoRef,
        onTogglePlay,
        onToggleFullscreen: vi.fn(),
        onSeek: vi.fn(),
        onVolumeChange: vi.fn(),
        onToggleMute: vi.fn(),
        disabled: true,
      }),
    );

    const handler = addSpy.mock.calls[0]![1] as (e: KeyboardEvent) => void;
    handler(createKeyboardEvent(' '));

    expect(onTogglePlay).not.toHaveBeenCalled();
  });

  // ── skip focus on inputs ───────────────────────────────────────────────────

  it('skips events when focus is inside INPUT', () => {
    const videoRef = { current: document.createElement('video') };
    const onTogglePlay = vi.fn();

    renderHook(() =>
      useVideoKeyboardShortcuts({
        videoRef,
        onTogglePlay,
        onToggleFullscreen: vi.fn(),
        onSeek: vi.fn(),
        onVolumeChange: vi.fn(),
        onToggleMute: vi.fn(),
      }),
    );

    const handler = addSpy.mock.calls[0]![1] as (e: KeyboardEvent) => void;
    const input = document.createElement('input');
    handler(createKeyboardEvent(' ', input));

    expect(onTogglePlay).not.toHaveBeenCalled();
  });

  it('skips events when focus is inside TEXTAREA', () => {
    const videoRef = { current: document.createElement('video') };
    const onTogglePlay = vi.fn();

    renderHook(() =>
      useVideoKeyboardShortcuts({
        videoRef,
        onTogglePlay,
        onToggleFullscreen: vi.fn(),
        onSeek: vi.fn(),
        onVolumeChange: vi.fn(),
        onToggleMute: vi.fn(),
      }),
    );

    const handler = addSpy.mock.calls[0]![1] as (e: KeyboardEvent) => void;
    const textarea = document.createElement('textarea');
    handler(createKeyboardEvent(' ', textarea));

    expect(onTogglePlay).not.toHaveBeenCalled();
  });

  it('skips events when focus is inside contenteditable', () => {
    const videoRef = { current: document.createElement('video') };
    const onTogglePlay = vi.fn();

    renderHook(() =>
      useVideoKeyboardShortcuts({
        videoRef,
        onTogglePlay,
        onToggleFullscreen: vi.fn(),
        onSeek: vi.fn(),
        onVolumeChange: vi.fn(),
        onToggleMute: vi.fn(),
      }),
    );

    const handler = addSpy.mock.calls[0]![1] as (e: KeyboardEvent) => void;
    const div = document.createElement('div');
    Object.defineProperty(div, 'isContentEditable', { value: true, configurable: true });
    handler(createKeyboardEvent(' ', div));

    expect(onTogglePlay).not.toHaveBeenCalled();
  });

  // ── play/pause ─────────────────────────────────────────────────────────────

  it('calls onTogglePlay for Space / k / K', () => {
    const onTogglePlay = vi.fn();
    const videoRef = { current: document.createElement('video') };

    renderHook(() =>
      useVideoKeyboardShortcuts({
        videoRef,
        onTogglePlay,
        onToggleFullscreen: vi.fn(),
        onSeek: vi.fn(),
        onVolumeChange: vi.fn(),
        onToggleMute: vi.fn(),
      }),
    );

    const handler = addSpy.mock.calls[0]![1] as (e: KeyboardEvent) => void;

    for (const key of [' ', 'k', 'K']) {
      onTogglePlay.mockClear();
      handler(createKeyboardEvent(key));
      expect(onTogglePlay).toHaveBeenCalledOnce();
    }
  });

  // ── seek ───────────────────────────────────────────────────────────────────

  it('calls onSeek with ±5 for ArrowLeft/ArrowRight', () => {
    const onSeek = vi.fn();
    const videoRef = { current: document.createElement('video') };

    renderHook(() =>
      useVideoKeyboardShortcuts({
        videoRef,
        onTogglePlay: vi.fn(),
        onToggleFullscreen: vi.fn(),
        onSeek,
        onVolumeChange: vi.fn(),
        onToggleMute: vi.fn(),
      }),
    );

    const handler = addSpy.mock.calls[0]![1] as (e: KeyboardEvent) => void;

    handler(createKeyboardEvent('ArrowLeft'));
    expect(onSeek).toHaveBeenCalledWith(-5);

    handler(createKeyboardEvent('ArrowRight'));
    expect(onSeek).toHaveBeenCalledWith(5);
  });

  it('calls onSeek with ±10 for j/J/l/L', () => {
    const onSeek = vi.fn();
    const videoRef = { current: document.createElement('video') };

    renderHook(() =>
      useVideoKeyboardShortcuts({
        videoRef,
        onTogglePlay: vi.fn(),
        onToggleFullscreen: vi.fn(),
        onSeek,
        onVolumeChange: vi.fn(),
        onToggleMute: vi.fn(),
      }),
    );

    const handler = addSpy.mock.calls[0]![1] as (e: KeyboardEvent) => void;

    handler(createKeyboardEvent('j'));
    expect(onSeek).toHaveBeenCalledWith(-10);

    handler(createKeyboardEvent('l'));
    expect(onSeek).toHaveBeenCalledWith(10);
  });

  // ── volume ─────────────────────────────────────────────────────────────────

  it('calls onToggleMute for m/M', () => {
    const onToggleMute = vi.fn();
    const videoRef = { current: document.createElement('video') };

    renderHook(() =>
      useVideoKeyboardShortcuts({
        videoRef,
        onTogglePlay: vi.fn(),
        onToggleFullscreen: vi.fn(),
        onSeek: vi.fn(),
        onVolumeChange: vi.fn(),
        onToggleMute,
      }),
    );

    const handler = addSpy.mock.calls[0]![1] as (e: KeyboardEvent) => void;

    for (const key of ['m', 'M']) {
      onToggleMute.mockClear();
      handler(createKeyboardEvent(key));
      expect(onToggleMute).toHaveBeenCalledOnce();
    }
  });

  it('calls onVolumeChange with +0.1 / -0.1 for ArrowUp/ArrowDown', () => {
    const onVolumeChange = vi.fn();
    const videoRef = { current: document.createElement('video') };

    renderHook(() =>
      useVideoKeyboardShortcuts({
        videoRef,
        onTogglePlay: vi.fn(),
        onToggleFullscreen: vi.fn(),
        onSeek: vi.fn(),
        onVolumeChange,
        onToggleMute: vi.fn(),
      }),
    );

    const handler = addSpy.mock.calls[0]![1] as (e: KeyboardEvent) => void;

    handler(createKeyboardEvent('ArrowUp'));
    expect(onVolumeChange).toHaveBeenCalledWith(0.1);

    handler(createKeyboardEvent('ArrowDown'));
    expect(onVolumeChange).toHaveBeenCalledWith(-0.1);
  });

  // ── fullscreen ─────────────────────────────────────────────────────────────

  it('calls onToggleFullscreen for f/F', () => {
    const onToggleFullscreen = vi.fn();
    const videoRef = { current: document.createElement('video') };

    renderHook(() =>
      useVideoKeyboardShortcuts({
        videoRef,
        onTogglePlay: vi.fn(),
        onToggleFullscreen,
        onSeek: vi.fn(),
        onVolumeChange: vi.fn(),
        onToggleMute: vi.fn(),
      }),
    );

    const handler = addSpy.mock.calls[0]![1] as (e: KeyboardEvent) => void;

    for (const key of ['f', 'F']) {
      onToggleFullscreen.mockClear();
      handler(createKeyboardEvent(key));
      expect(onToggleFullscreen).toHaveBeenCalledOnce();
    }
  });

  // ── unknown key ────────────────────────────────────────────────────────────

  it('ignores unknown keys', () => {
    const callbacks = {
      onTogglePlay: vi.fn(),
      onToggleFullscreen: vi.fn(),
      onSeek: vi.fn(),
      onVolumeChange: vi.fn(),
      onToggleMute: vi.fn(),
    };
    const videoRef = { current: document.createElement('video') };

    renderHook(() =>
      useVideoKeyboardShortcuts({ videoRef, ...callbacks }),
    );

    const handler = addSpy.mock.calls[0]![1] as (e: KeyboardEvent) => void;
    handler(createKeyboardEvent('z'));

    Object.values(callbacks).forEach((cb) => expect(cb).not.toHaveBeenCalled());
  });

  // ── null videoRef ──────────────────────────────────────────────────────────

  it('ignores events when videoRef.current is null', () => {
    const callbacks = {
      onTogglePlay: vi.fn(),
      onToggleFullscreen: vi.fn(),
      onSeek: vi.fn(),
      onVolumeChange: vi.fn(),
      onToggleMute: vi.fn(),
    };
    const videoRef = { current: null };

    renderHook(() =>
      useVideoKeyboardShortcuts({ videoRef, ...callbacks }),
    );

    const handler = addSpy.mock.calls[0]![1] as (e: KeyboardEvent) => void;
    handler(createKeyboardEvent(' '));

    Object.values(callbacks).forEach((cb) => expect(cb).not.toHaveBeenCalled());
  });
});
