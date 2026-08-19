import "@testing-library/jest-dom/vitest";

const values = new Map<string, string>();
Object.defineProperty(globalThis, "sessionStorage", {
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  },
});

const browserEvents = new EventTarget();
Object.defineProperty(globalThis, "window", {
  value: {
    dispatchEvent: browserEvents.dispatchEvent.bind(browserEvents),
    addEventListener: browserEvents.addEventListener.bind(browserEvents),
    removeEventListener: browserEvents.removeEventListener.bind(browserEvents),
  },
});
