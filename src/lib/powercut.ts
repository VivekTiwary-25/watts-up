// TEMPORARY stub — boss keeps T02's src/lib/powercut.ts at merge.

import { APPLIANCES, type ApplianceId } from '@/data/appliances'
import { INVERTER, POWER_CUT } from '@/data/config'

const BLOCKED = 'Inverter can only run 3 appliances'

function appliance(id: ApplianceId) {
  const found = APPLIANCES.find((item) => item.id === id)
  if (!found) throw new Error(`Unknown appliance: ${id}`)
  return found
}

export function canAddPick(
  picks: ApplianceId[],
  id: ApplianceId,
): { ok: boolean; reason?: string } {
  if (picks.includes(id)) return { ok: true }
  if (picks.length >= POWER_CUT.picks) return { ok: false, reason: BLOCKED }
  return { ok: true }
}

export function togglePick(
  picks: ApplianceId[],
  id: ApplianceId,
): { picks: ApplianceId[]; blocked: boolean; reason?: string } {
  if (picks.includes(id)) {
    return { picks: picks.filter((pick) => pick !== id), blocked: false }
  }
  const gate = canAddPick(picks, id)
  if (!gate.ok) return { picks, blocked: true, reason: gate.reason }
  return { picks: [...picks, id], blocked: false }
}

export function isValidSelection(picks: ApplianceId[]): boolean {
  return picks.length === POWER_CUT.picks && new Set(picks).size === picks.length
}

export function loadWatts(picks: ApplianceId[]): number {
  return picks.reduce((sum, id) => sum + appliance(id).watts, 0)
}

export function batteryHours(
  picks: ApplianceId[],
  inverter = INVERTER,
): number {
  const load = loadWatts(picks)
  if (load <= 0) return Number.POSITIVE_INFINITY
  return (inverter.capacityWh * inverter.usableFraction) / load
}

export function comfortScore(picks: ApplianceId[]): { score: number; max: number } {
  const max = [...APPLIANCES]
    .map((item) => item.comfortScore)
    .sort((a, b) => b - a)
    .slice(0, POWER_CUT.picks)
    .reduce((sum, score) => sum + score, 0)
  const score = picks.reduce((sum, id) => sum + appliance(id).comfortScore, 0)
  return { score, max }
}

export function costPerHour(picks: ApplianceId[]): number {
  return (loadWatts(picks) / 1000) * POWER_CUT.costRatePerUnit
}

export function allCombos(): ApplianceId[][] {
  const ids = APPLIANCES.map((item) => item.id)
  const combos: ApplianceId[][] = []
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      for (let k = j + 1; k < ids.length; k++) {
        const a = ids[i]
        const b = ids[j]
        const c = ids[k]
        if (a && b && c) combos.push([a, b, c])
      }
    }
  }
  return combos
}

export function bestCombo(): {
  picks: ApplianceId[]
  comfort: number
  batteryHours: number
  costPerHour: number
} {
  let best: {
    picks: ApplianceId[]
    comfort: number
    batteryHours: number
    costPerHour: number
  } | null = null

  for (const picks of allCombos()) {
    const hours = batteryHours(picks)
    if (hours < POWER_CUT.minBackupHours) continue
    const comfort = comfortScore(picks).score
    const cost = costPerHour(picks)
    if (
      !best ||
      comfort > best.comfort ||
      (comfort === best.comfort && hours > best.batteryHours)
    ) {
      best = { picks, comfort, batteryHours: hours, costPerHour: cost }
    }
  }

  if (best) return best
  const fallback: ApplianceId[] = ['fridge', 'fan', 'light']
  return {
    picks: fallback,
    comfort: comfortScore(fallback).score,
    batteryHours: batteryHours(fallback),
    costPerHour: costPerHour(fallback),
  }
}
