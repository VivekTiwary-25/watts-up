import { describe, expect, it } from 'vitest';
import type { ApplianceId } from '../data/appliances';
import { POWER_CUT } from '../data/config';
import { allCombos, batteryHours, bestCombo, canAddPick, comfortScore, costPerHour, isValidSelection, loadWatts, togglePick } from './powercut';

const picks: ApplianceId[] = ['fridge', 'fan', 'light'];

describe('power cut', () => {
  it('adds and removes picks without mutating the input', () => {
    expect(togglePick(['fridge', 'fan'], 'light')).toEqual({ picks, blocked: false });
    expect(togglePick(picks, 'fan')).toEqual({ picks: ['fridge', 'light'], blocked: false });
    expect(picks).toEqual(['fridge', 'fan', 'light']);
    expect(canAddPick(picks, 'fan')).toEqual({ ok: true });
  });

  it('blocks a fourth appliance with an explanation', () => {
    const reason = 'Inverter can only run 3 appliances';
    expect(canAddPick(picks, 'ac')).toEqual({ ok: false, reason });
    expect(togglePick(picks, 'ac')).toEqual({ picks, blocked: true, reason });
  });

  it('requires exactly three unique picks', () => {
    expect(isValidSelection(picks)).toBe(true);
    for (const invalid of [[], ['fan'], ['fan', 'light'], ['fan', 'fan', 'light'], [...picks, 'ac']] as ApplianceId[][]) {
      expect(isValidSelection(invalid)).toBe(false);
    }
  });

  it('calculates load, battery life, comfort and cost', () => {
    expect(loadWatts(picks)).toBe(265);
    expect(batteryHours(picks)).toBeCloseTo(1440 / 265);
    expect(batteryHours(picks, { name: 'Test', capacityWh: 530, usableFraction: 0.5 })).toBe(1);
    expect(batteryHours([])).toBe(Infinity);
    expect(comfortScore(picks)).toEqual({ score: 10, max: 12 });
    expect(costPerHour(['ac', 'fridge', 'fan'])).toBeCloseTo(1.725 * 8);
    expect(costPerHour([])).toBe(0);
  });

  it('generates every unique valid combination', () => {
    const combos = allCombos();
    expect(combos).toHaveLength(56);
    expect(combos.every(isValidSelection)).toBe(true);
    expect(new Set(combos.map((combo) => [...combo].sort().join(','))).size).toBe(56);
  });

  it('chooses the highest comfort with enough backup, then the longest runtime', () => {
    const best = bestCombo();
    expect([...best.picks].sort()).toEqual([...picks].sort());
    expect(best.comfort).toBe(10);
    expect(best.batteryHours).toBeCloseTo(1440 / 265);
    expect(best.costPerHour).toBeCloseTo(costPerHour(picks));
    const eligible = allCombos().filter((combo) => batteryHours(combo) >= POWER_CUT.minBackupHours);
    for (const combo of eligible) {
      expect(comfortScore(combo).score).toBeLessThanOrEqual(best.comfort);
      if (comfortScore(combo).score === best.comfort) expect(batteryHours(combo)).toBeLessThanOrEqual(best.batteryHours);
    }
  });
});
