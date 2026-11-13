import { MotionGlobalConfig } from 'motion/react'

MotionGlobalConfig.skipAnimations = true

class TestResizeObserver implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = TestResizeObserver

window.matchMedia = (query: string) =>
  ({
    matches: query.includes('prefers-reduced-motion: reduce'),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList
