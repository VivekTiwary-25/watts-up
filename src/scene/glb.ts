import type { ApplianceId } from '@/store/useHouse'

/** Model file per appliance. Contract: Appliance.modelFile; convention is `<id>.glb`. */
export const modelUrl = (id: ApplianceId) => `/models/${id}.glb`

// Vite serves index.html (200, text/html) for missing files — treat that as missing.
const probes = new Map<string, Promise<boolean>>()
export function glbExists(url: string): Promise<boolean> {
  let p = probes.get(url)
  if (!p) {
    p = fetch(url, { method: 'HEAD' })
      .then((res) => res.ok && !(res.headers.get('content-type') ?? '').includes('text/html'))
      .catch(() => false)
    probes.set(url, p)
  }
  return p
}
