import { APPLIANCE_BY_ID } from '@/data/appliances'
import type { ApplianceId } from '@/store/useHouse'

/** Model file per appliance, from Appliance.modelFile unless `file` overrides it. */
export const modelUrl = (id: ApplianceId, file?: string) =>
  `/models/${file ?? APPLIANCE_BY_ID[id].modelFile}`

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
