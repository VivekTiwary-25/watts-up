# Shared contract (code against this; owners implement it exactly)

## Types — `src/data/appliances.ts` (owner T02)
```ts
export type RoomId = 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'all';
export type ApplianceId = 'fan'|'ac'|'fridge'|'tv'|'light'|'washer'|'geyser'|'stove';
export interface Appliance { id: ApplianceId; name: string; room: RoomId; watts: number;
  defaultHoursPerDay: number; isOnByDefault: boolean; comfortScore: number; modelFile: string; description: string; }
export const APPLIANCES: Appliance[];            // table from brief; light room = 'all'
export const APPLIANCE_BY_ID: Record<ApplianceId, Appliance>;
```
isOnByDefault: fan, fridge, tv, light = true; ac, washer, geyser, stove = false.

## Config — `src/data/config.ts` (owner T02)
```ts
export const TARIFF = { slabs: [{ upTo: 100, rate: 4 }, { upTo: 200, rate: 6 }, { upTo: Infinity, rate: 8 }], fixedCharge: 100, daysPerMonth: 30, currency: '₹' };
export const INVERTER = { name: 'VoltVault 1800', capacityWh: 1800, usableFraction: 0.8 };   // 1440 Wh usable
export const POWER_CUT = { picks: 3, minBackupHours: 2, costRatePerUnit: 8, flickerMs: 1400 };
export const DEFAULT_TARGET_BILL = 1500; export const TARGET_RANGE = { min: 200, max: 5000, step: 50 };
export const TIP_HOURS_CUT = 2;
export const ROOMS: { id: Exclude<RoomId,'all'>; name: string }[];   // Living room, Kitchen, Bedroom, Bathroom
```

## Bill — `src/lib/bill.ts` (owner T02)
```ts
monthlyUnits(watts: number, hoursPerDay: number, days = TARIFF.daysPerMonth): number // w*h*days/1000
energyCharge(units: number, tariff = TARIFF): number   // slab
interface BillItem { id: ApplianceId; name: string; units: number; cost: number; share: number /*0..1*/ }
interface BillResult { totalUnits: number; energyCharge: number; fixedCharge: number; total: number; items: BillItem[] /* only ON appliances, sorted cost desc */; tip: string }
computeBill(on: Record<ApplianceId, boolean>, hours: Record<ApplianceId, number>, appliances = APPLIANCES, tariff = TARIFF): BillResult
```
- item.cost = energyCharge * item.units / totalUnits (proportional slab allocation); share = units/totalUnits.
- tip: top-share item: "Split AC is 54% of your bill. Running it 2 hours less a day saves ₹380." (saving = total now − total with that item's hours − TIP_HOURS_CUT, min 0; round ₹). Nothing on → "Everything is off. Your bill is just the ₹100 fixed charge."
- Default state: 149.7 units, total ₹798.20.

## Power cut — `src/lib/powercut.ts` (owner T02)
```ts
canAddPick(picks: ApplianceId[], id): { ok: boolean; reason?: string }  // 4th → ok:false, reason "Inverter can only run 3 appliances"
togglePick(picks, id): { picks: ApplianceId[]; blocked: boolean; reason?: string }
isValidSelection(picks): boolean            // exactly POWER_CUT.picks, unique
loadWatts(picks): number
batteryHours(picks, inverter = INVERTER): number   // capacityWh*usableFraction / loadWatts
comfortScore(picks): { score: number; max: number } // max = sum of top-3 comfortScores (=12)
costPerHour(picks): number                  // loadWatts/1000 * POWER_CUT.costRatePerUnit
allCombos(): ApplianceId[][]                 // 56
bestCombo(): { picks; comfort; batteryHours; costPerHour }  // highest comfort among combos with batteryHours >= minBackupHours; tie → longer battery
```
Expected best: fridge + fan + light (comfort 10/12, ~5.4 h).

## Store — `src/store/useHouse.ts` (owner T02)
```ts
type View = 'intro' | 'overview' | 'room';
type PowerCutPhase = 'off' | 'flicker' | 'choosing' | 'result';
interface HouseState {
  on: Record<ApplianceId, boolean>; hours: Record<ApplianceId, number>; targetBill: number;
  view: View; focusRoom: Exclude<RoomId,'all'> | null;
  hovered: ApplianceId | null; selected: ApplianceId | null;
  powerCut: PowerCutPhase; picks: ApplianceId[]; savedOn: Record<ApplianceId, boolean> | null;
  pickError: { message: string; at: number } | null;
  muted: boolean;
  toggle(id): void; setOn(id, v): void; setHours(id, h): void; setTarget(n): void;
  setView(v): void; goToRoom(r): void; backToOverview(): void;
  setHovered(id|null): void; select(id|null): void;
  startPowerCut(): void;      // saves `on` to savedOn, phase 'flicker' (UI advances to 'choosing' via setPowerCutPhase)
  setPowerCutPhase(p): void;
  pick(id): void;             // uses togglePick; sets pickError when blocked
  confirmPicks(): boolean;    // only if isValidSelection → phase 'result'
  restorePower(): void;       // on = savedOn, clear picks, phase 'off'
  toggleMute(): void;
}
export const useHouse; export const useBill = () => BillResult (memoised from on/hours);
export const isPowered = (s, id) => s.powerCut === 'off' ? s.on[id] : s.picks.includes(id)   // what the 3D scene should show as running
```
While powerCut !== 'off', clicking an appliance calls `pick(id)` instead of `toggle(id)`.
