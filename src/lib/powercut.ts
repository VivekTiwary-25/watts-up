import { APPLIANCES, APPLIANCE_BY_ID, type ApplianceId } from '../data/appliances';
import { INVERTER, POWER_CUT } from '../data/config';

export function canAddPick(picks: ApplianceId[], id: ApplianceId): { ok: boolean; reason?: string } {
  if (!picks.includes(id) && picks.length >= POWER_CUT.picks) {
    return { ok: false, reason: `Inverter can only run ${POWER_CUT.picks} appliances` };
  }
  return { ok: true };
}

export function togglePick(picks: ApplianceId[], id: ApplianceId): { picks: ApplianceId[]; blocked: boolean; reason?: string } {
  if (picks.includes(id)) return { picks: picks.filter((pick) => pick !== id), blocked: false };
  const check = canAddPick(picks, id);
  return check.ok
    ? { picks: [...picks, id], blocked: false }
    : { picks, blocked: true, reason: check.reason };
}

export function isValidSelection(picks: ApplianceId[]): boolean {
  return picks.length === POWER_CUT.picks && new Set(picks).size === POWER_CUT.picks;
}

export function loadWatts(picks: ApplianceId[]): number {
  return picks.reduce((sum, id) => sum + APPLIANCE_BY_ID[id].watts, 0);
}

export function batteryHours(picks: ApplianceId[], inverter = INVERTER): number {
  return inverter.capacityWh * inverter.usableFraction / loadWatts(picks);
}

export function comfortScore(picks: ApplianceId[]): { score: number; max: number } {
  return {
    score: picks.reduce((sum, id) => sum + APPLIANCE_BY_ID[id].comfortScore, 0),
    max: APPLIANCES.map((a) => a.comfortScore).sort((a, b) => b - a).slice(0, POWER_CUT.picks).reduce((sum, score) => sum + score, 0),
  };
}

export function costPerHour(picks: ApplianceId[]): number {
  return loadWatts(picks) / 1000 * POWER_CUT.costRatePerUnit;
}

export function allCombos(): ApplianceId[][] {
  const combos: ApplianceId[][] = [];
  function choose(start: number, picks: ApplianceId[]) {
    if (picks.length === POWER_CUT.picks) {
      combos.push(picks);
      return;
    }
    for (let i = start; i < APPLIANCES.length; i++) {
      choose(i + 1, [...picks, APPLIANCES[i].id]);
    }
  }
  choose(0, []);
  return combos;
}

export function bestCombo(): { picks: ApplianceId[]; comfort: number; batteryHours: number; costPerHour: number } {
  return allCombos().map((picks) => ({
    picks,
    comfort: comfortScore(picks).score,
    batteryHours: batteryHours(picks),
    costPerHour: costPerHour(picks),
  })).filter((combo) => combo.batteryHours >= POWER_CUT.minBackupHours)
    .sort((a, b) => b.comfort - a.comfort || b.batteryHours - a.batteryHours)[0];
}
