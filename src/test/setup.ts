import '@testing-library/jest-dom';

// ─── jsdom localStorage polyfill ────────────────────────────────────────────
// jsdom's localStorage may be a stub without setItem/removeItem in some environments.
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.setItem !== 'function') {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    get length() { return store.size; },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
  };
  Object.defineProperty(globalThis, 'localStorage', { value: localStorage, writable: true, configurable: true });
  if (typeof globalThis.window !== 'undefined') {
    Object.defineProperty(globalThis.window, 'localStorage', { value: localStorage, writable: true, configurable: true });
  }
}

// ─── jsdom PointerEvent polyfill ─────────────────────────────────────────────
// jsdom does not implement PointerEvent; base-ui Checkbox relies on it.
// Adding the constructor to globalThis enables testing-library/user-event clicks.
if (typeof globalThis.PointerEvent === 'undefined') {
  class PointerEvent extends MouseEvent {
    pointerId: number;
    width: number;
    height: number;
    pressure: number;
    tangentialPressure: number;
    tiltX: number;
    tiltY: number;
    twist: number;
    pointerType: string;
    isPrimary: boolean;
    constructor(type: string, init?: PointerEventInit) {
      super(type, init);
      this.pointerId   = init?.pointerId   ?? 0;
      this.width      = init?.width      ?? 1;
      this.height     = init?.height     ?? 1;
      this.pressure   = init?.pressure   ?? 0;
      this.tangentialPressure = init?.tangentialPressure ?? 0;
      this.tiltX      = init?.tiltX      ?? 0;
      this.tiltY      = init?.tiltY      ?? 0;
      this.twist      = init?.twist      ?? 0;
      this.pointerType = init?.pointerType ?? 'mouse';
      this.isPrimary  = init?.isPrimary  ?? true;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).PointerEvent = PointerEvent;
}
