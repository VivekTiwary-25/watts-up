import { useMemo } from 'react'
import { create } from 'zustand'
import { APPLIANCES, type ApplianceId, type RoomId } from '../data/appliances'
import { DEFAULT_TARGET_BILL, TARGET_RANGE } from '../data/config'
import { computeBill, type BillResult } from '../lib/bill'
import { isValidSelection, togglePick } from '../lib/powercut'

export type { ApplianceId, RoomId } from '../data/appliances'
export type View = 'intro' | 'overview' | 'room'
export type PowerCutPhase = 'off' | 'flicker' | 'choosing' | 'result'

export interface HouseState {
  on: Record<ApplianceId, boolean>
  hours: Record<ApplianceId, number>
  targetBill: number
  view: View
  focusRoom: Exclude<RoomId, 'all'> | null
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
  goToRoom(r: Exclude<RoomId, 'all'>): void
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

export const useHouse = create<HouseState>((set, get) => ({
  on: Object.fromEntries(APPLIANCES.map((a) => [a.id, a.isOnByDefault])) as Record<
    ApplianceId,
    boolean
  >,
  hours: Object.fromEntries(APPLIANCES.map((a) => [a.id, a.defaultHoursPerDay])) as Record<
    ApplianceId,
    number
  >,
  targetBill: DEFAULT_TARGET_BILL,
  view: 'intro',
  focusRoom: null,
  hovered: null,
  selected: null,
  powerCut: 'off',
  picks: [],
  savedOn: null,
  pickError: null,
  muted: false,
  toggle: (id) => {
    if (get().powerCut !== 'off') {
      get().pick(id)
      return
    }
    set((s) => ({ on: { ...s.on, [id]: !s.on[id] } }))
  },
  setOn: (id, v) => set((s) => ({ on: { ...s.on, [id]: v } })),
  setHours: (id, h) => {
    if (Number.isFinite(h))
      set((s) => ({ hours: { ...s.hours, [id]: Math.max(0, Math.min(24, h)) } }))
  },
  setTarget: (n) => {
    if (Number.isFinite(n))
      set({ targetBill: Math.max(TARGET_RANGE.min, Math.min(TARGET_RANGE.max, n)) })
  },
  setView: (view) => set({ view }),
  goToRoom: (focusRoom) => set({ view: 'room', focusRoom }),
  backToOverview: () => set({ view: 'overview', focusRoom: null }),
  setHovered: (hovered) => set({ hovered }),
  select: (selected) => set({ selected }),
  startPowerCut: () => {
    if (get().powerCut !== 'off') return
    set((s) => ({ savedOn: { ...s.on }, powerCut: 'flicker', picks: [], pickError: null }))
  },
  setPowerCutPhase: (powerCut) => set({ powerCut }),
  pick: (id) =>
    set((s) => {
      const result = togglePick(s.picks, id)
      return {
        picks: result.picks,
        pickError: result.blocked ? { message: result.reason!, at: Date.now() } : null,
      }
    }),
  confirmPicks: () => {
    if (!isValidSelection(get().picks)) return false
    set({ powerCut: 'result', pickError: null })
    return true
  },
  restorePower: () =>
    set((s) => ({
      on: s.savedOn ?? s.on,
      savedOn: null,
      picks: [],
      pickError: null,
      powerCut: 'off',
    })),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
}))

export function useBill(): BillResult {
  const on = useHouse((s) => s.on)
  const hours = useHouse((s) => s.hours)
  return useMemo(() => computeBill(on, hours), [on, hours])
}

export const isPowered = (
  s: Pick<HouseState, 'powerCut' | 'on' | 'picks'>,
  id: ApplianceId,
): boolean => (s.powerCut === 'off' ? s.on[id] : s.picks.includes(id))
