import { useEffect } from 'react'

interface Disposable {
  dispose(): void
}

/**
 * Free GPU resources a component created itself (useMemo materials, geometries, textures)
 * when it unmounts. R3F only auto-disposes JSX-declared objects, not ones passed as props.
 * StrictMode's dev remount is safe: three re-uploads a disposed resource on next use.
 */
export function useDispose(...items: (Disposable | null | undefined)[]) {
  useEffect(
    () => () => {
      for (const item of items) item?.dispose()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    items,
  )
}
