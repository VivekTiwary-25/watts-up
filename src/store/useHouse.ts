// TEMPORARY STUB (T03). Matches coord/CONTRACT.md "Store" so the scene can be built in
// parallel. T02 owns the real file — replace this wholesale at merge.
import { create } from 'zustand'

export type RoomId = 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'all'
export type ApplianceId = 'fan' | 'ac' | 'fridge' | 'tv' | 'light' | 'washer' | 'geyser' | 'microwave'
export type View = 'intro' | 'overview' | 'room'
export type PowerCutPhase = 'off' | 'flicker' | 'choosing' | 'result'
type Room = Exclude<RoomId, 'all'>

const IDS: ApplianceId[] = ['fan', 'ac', 'fridge', 'tv', 'light', 'washer', 'geyser', 'microwave']
const WATTS: Record<ApplianceId, number> = { fan: 75, ac: 1500, fridge: 150, tv: 100, light: 40, washer: 500, geyser: 2000, microwave: 1200 }
const HOURS: Record<ApplianceId, number> = { fan: 8, ac: 6, fridge: 24, tv: 4, light: 6, washer: 1, geyser: 1, microwave: 0.5 }
const DEFAULT_ON: Record<ApplianceId, boolean> = { fan: true, ac: false, fridge: true, tv: true, light: true, washer: false, geyser: false, microwave: false }

export interface BillItem { id: ApplianceId; name: string; units: number; cost: number; share: number }
export interface BillResult { totalUnits: number; energyCharge: number; fixedCharge: number; total: number; items: BillItem[]; tip: string }

export interface HouseState {
  on: Record<ApplianceId, boolean>
  hours: Record<ApplianceId, number>
  targetBill: number
  view: View
  focusRoom: Room | null
  hovered: ApplianceId | null
  selected: ApplianceId | null
  powerCut: PowerCutPhase
  picks: ApplianceId[]
  savedOn: Record<ApplianceId, boolean> | null
  pickError: { message: string; at: number } | null
  muted: boolean
  toggle(id: ApplianceId): void
  setOn(id: ApplianceId, v: boolean): void
  setHours(id: ApplianceId, h: number): void
  setTarget(n: number): void
  setView(v: View): void
  goToRoom(r: Room): void
  backToOverview(): void
  setHovered(id: ApplianceId | null): void
  select(id: ApplianceId | null): void
  startPowerCut(): void
  setPowerCutPhase(p: PowerCutPhase): void
  pick(id: ApplianceId): void
  confirmPicks(): boolean
  restorePower(): void
  toggleMute(): void
}

export const useHouse = create<HouseState>()((set, get) => ({
  on: { ...DEFAULT_ON },
  hours: { ...HOURS },
  targetBill: 1500,
  view: 'overview',
  focusRoom: null,
  hovered: null,
  selected: null,
  powerCut: 'off',
  picks: [],
  savedOn: null,
  pickError: null,
  muted: false,
  toggle: (id) => set((s) => ({ on: { ...s.on, [id]: !s.on[id] } })),
  setOn: (id, v) => set((s) => ({ on: { ...s.on, [id]: v } })),
  setHours: (id, h) => set((s) => ({ hours: { ...s.hours, [id]: h } })),
  setTarget: (n) => set({ targetBill: n }),
  setView: (v) => set({ view: v }),
  goToRoom: (r) => set({ view: 'room', focusRoom: r }),
  backToOverview: () => set({ view: 'overview', focusRoom: null }),
  setHovered: (id) => set({ hovered: id }),
  select: (id) => set({ selected: id }),
  startPowerCut: () => set((s) => ({ savedOn: { ...s.on }, powerCut: 'flicker', picks: [] })),
  setPowerCutPhase: (p) => set({ powerCut: p }),
  pick: (id) =>
    set((s) => {
      if (s.picks.includes(id)) return { picks: s.picks.filter((p) => p !== id) }
      if (s.picks.length >= 3) return { pickError: { message: 'Inverter can only run 3 appliances', at: Date.now() } }
      return { picks: [...s.picks, id] }
    }),
  confirmPicks: () => {
    if (get().picks.length !== 3) return false
    set({ powerCut: 'result' })
    return true
  },
  restorePower: () => set((s) => ({ on: s.savedOn ?? s.on, picks: [], savedOn: null, powerCut: 'off' })),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
}))

export const isPowered = (s: HouseState, id: ApplianceId) =>
  s.powerCut === 'off' ? s.on[id] : s.picks.includes(id)

// Stub bill: flat 6/unit, no slabs. Real one is T02's computeBill.
export const useBill = (): BillResult => {
  const on = useHouse((s) => s.on)
  const hours = useHouse((s) => s.hours)
  const items = IDS.filter((id) => on[id]).map((id) => ({ id, name: id, units: (WATTS[id] * hours[id] * 30) / 1000, cost: 0, share: 0 }))
  const totalUnits = items.reduce((a, i) => a + i.units, 0)
  const energyCharge = totalUnits * 6
  for (const i of items) {
    i.share = totalUnits ? i.units / totalUnits : 0
    i.cost = energyCharge * i.share
  }
  items.sort((a, b) => b.cost - a.cost)
  return { totalUnits, energyCharge, fixedCharge: 100, total: energyCharge + 100, items, tip: '' }
}
