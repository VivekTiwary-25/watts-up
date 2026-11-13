import type { RoomId } from './appliances';

export const TARIFF = {
  slabs: [{ upTo: 100, rate: 4 }, { upTo: 200, rate: 6 }, { upTo: Infinity, rate: 8 }],
  fixedCharge: 100,
  daysPerMonth: 30,
  currency: '₹',
};
export const INVERTER = { name: 'VoltVault 1800', capacityWh: 1800, usableFraction: 0.8 };
export const POWER_CUT = { picks: 3, minBackupHours: 2, costRatePerUnit: 8, flickerMs: 1400 };
export const DEFAULT_TARGET_BILL = 1500;
export const TARGET_RANGE = { min: 200, max: 5000, step: 50 };
export const TIP_HOURS_CUT = 2;
export const SOUND = {
  masterVolume: 0.22,
  click: { enabled: true, volume: 0.18 },
  fan: { enabled: true, volume: 0.035 },
  thunder: { enabled: true, volume: 0.3 },
  powerUp: { enabled: true, volume: 0.1 },
};
export const ROOMS: { id: Exclude<RoomId, 'all'>; name: string }[] = [
  { id: 'living', name: 'Living room' },
  { id: 'kitchen', name: 'Kitchen' },
  { id: 'bedroom', name: 'Bedroom' },
  { id: 'bathroom', name: 'Bathroom' },
];
