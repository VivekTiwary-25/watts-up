// TEMPORARY stub — boss keeps T02's src/store/useHouse.ts at merge.
// useBill is inlined here because src/lib/bill.ts is T02's file and is not in this clone.

import { useMemo } from 'react'
import { create } from 'zustand'
import { APPLIANCES, type ApplianceId, type RoomId } from '@/data/appliances'
import { DEFAULT_TARGET_BILL, TARIFF, TIP_HOURS_CUT } from '@/data/config'
import { isValidSelection, togglePick } from '@/lib/powercut'

export type View = 'intro' | 'overview' | 'room'
export type PowerCutPhase = 'off' | 'flicker' | 'choosing' | 'result'

export interface BillItem {
  id: ApplianceId
  name: string
  units: number
  cost: number
  share: number
}

export interface BillResult {
  totalUnits: number
  energyCharge: number
  fixedCharge: number
  total: number
  items: BillItem[]
  tip: string
}

interface HouseState {
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
  toggle: (id: ApplianceId) => void
  setOn: (id: ApplianceId, v: boolean) => void
  setHours: (id: ApplianceId, h: number) => void
  setTarget: (n: number) => void
  setView: (v: View) => void
  goToRoom: (r: Exclude<RoomId, 'all'>) => void
  backToOverview: () => void
  setHovered: (id: ApplianceId | null) => void
  select: (id: ApplianceId | null) => void
  startPowerCut: () => void
  setPowerCutPhase: (p: PowerCutPhase) => void
  pick: (id: ApplianceId) => void
  confirmPicks: () => boolean
  restorePower: () => void
  toggleMute: () => void
}

function energyCharge(units: number, tariff = TARIFF) {
  if (units <= 0) return 0
  let remaining = units
  let previous = 0
  let charge = 0
  for (const slab of tariff.slabs) {
    const width = slab.upTo - previous
    const take = Math.min(remaining, width)
    charge += take * slab.rate
    remaining -= take
    previous = slab.upTo
    if (remaining <= 0) break
  }
  return charge
}

function billTotals(
  on: Record<ApplianceId, boolean>,
  hours: Record<ApplianceId, number>,
): Omit<BillResult, 'tip'> {
  const rows = APPLIANCES.filter((appliance) => on[appliance.id]).map((appliance) => ({
    id: appliance.id,
    name: appliance.name,
    units: (appliance.watts * (hours[appliance.id] ?? 0) * TARIFF.daysPerMonth) / 1000,
  }))
  const totalUnits = rows.reduce((sum, row) => sum + row.units, 0)
  const charge = energyCharge(totalUnits)
  const items = rows
    .map((row) => ({
      ...row,
      cost: totalUnits > 0 ? (charge * row.units) / totalUnits : 0,
      share: totalUnits > 0 ? row.units / totalUnits : 0,
    }))
    .sort((a, b) => b.cost - a.cost)
  return {
    totalUnits,
    energyCharge: charge,
    fixedCharge: TARIFF.fixedCharge,
    total: charge + TARIFF.fixedCharge,
    items,
  }
}

function computeBill(
  on: Record<ApplianceId, boolean>,
  hours: Record<ApplianceId, number>,
): BillResult {
  const totals = billTotals(on, hours)
  const top = totals.items[0]
  if (!top) {
    return {
      ...totals,
      tip: `Everything is off. Your bill is just the ${TARIFF.currency}${TARIFF.fixedCharge} fixed charge.`,
    }
  }
  const cutHours = Math.max(0, (hours[top.id] ?? 0) - TIP_HOURS_CUT)
  const reduced = billTotals(on, { ...hours, [top.id]: cutHours })
  const saving = Math.max(0, Math.round(totals.total - reduced.total))
  const percent = Math.round(top.share * 100)
  return {
    ...totals,
    tip: `${top.name} is ${percent}% of your bill. Running it ${TIP_HOURS_CUT} hours less a day saves ${TARIFF.currency}${saving}.`,
  }
}

const initialOn = Object.fromEntries(
  APPLIANCES.map((appliance) => [appliance.id, appliance.isOnByDefault]),
) as Record<ApplianceId, boolean>

const initialHours = Object.fromEntries(
  APPLIANCES.map((appliance) => [appliance.id, appliance.defaultHoursPerDay]),
) as Record<ApplianceId, number>

export const useHouse = create<HouseState>((set, get) => ({
  on: initialOn,
  hours: initialHours,
  targetBill: DEFAULT_TARGET_BILL,
  view: 'overview',
  focusRoom: null,
  hovered: null,
  selected: null,
  powerCut: 'off',
  picks: [],
  savedOn: null,
  pickError: null,
  muted: false,
  toggle: (id) => set((state) => ({ on: { ...state.on, [id]: !state.on[id] } })),
  setOn: (id, v) => set((state) => ({ on: { ...state.on, [id]: v } })),
  setHours: (id, h) => set((state) => ({ hours: { ...state.hours, [id]: h } })),
  setTarget: (n) => set({ targetBill: n }),
  setView: (v) => set({ view: v }),
  goToRoom: (r) => set({ view: 'room', focusRoom: r }),
  backToOverview: () => set({ view: 'overview', focusRoom: null }),
  setHovered: (id) => set({ hovered: id }),
  select: (id) => set({ selected: id }),
  startPowerCut: () => {
    const { on } = get()
    set({
      savedOn: { ...on },
      powerCut: 'flicker',
      picks: [],
      pickError: null,
    })
  },
  setPowerCutPhase: (p) => set({ powerCut: p }),
  pick: (id) => {
    const result = togglePick(get().picks, id)
    if (result.blocked) {
      set({
        pickError: {
          message: result.reason ?? 'Inverter can only run 3 appliances',
          at: Date.now(),
        },
      })
      return
    }
    set({ picks: result.picks })
  },
  confirmPicks: () => {
    if (!isValidSelection(get().picks)) return false
    set({ powerCut: 'result' })
    return true
  },
  restorePower: () => {
    const { savedOn, on } = get()
    set({
      on: savedOn ? { ...savedOn } : on,
      picks: [],
      savedOn: null,
      pickError: null,
      powerCut: 'off',
    })
  },
  toggleMute: () => set((state) => ({ muted: !state.muted })),
}))

export function useBill(): BillResult {
  const on = useHouse((state) => state.on)
  const hours = useHouse((state) => state.hours)
  return useMemo(() => computeBill(on, hours), [on, hours])
}

export function isPowered(
  state: Pick<HouseState, 'powerCut' | 'on' | 'picks'>,
  id: ApplianceId,
): boolean {
  return state.powerCut === 'off' ? state.on[id] : state.picks.includes(id)
}
