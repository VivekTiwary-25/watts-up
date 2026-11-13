import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useDispose } from './useDispose'

describe('useDispose', () => {
  it('disposes every item on unmount, skipping nulls', () => {
    const a = { dispose: vi.fn() }
    const b = { dispose: vi.fn() }
    const { unmount } = renderHook(() => useDispose(a, null, b))
    expect(a.dispose).not.toHaveBeenCalled()
    unmount()
    expect(a.dispose).toHaveBeenCalledOnce()
    expect(b.dispose).toHaveBeenCalledOnce()
  })
})
