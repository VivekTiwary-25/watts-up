// TEMPORARY stub — boss keeps T02's src/data/appliances.ts at merge.

export type RoomId = 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'all'

export type ApplianceId =
  | 'fan'
  | 'ac'
  | 'fridge'
  | 'tv'
  | 'light'
  | 'washer'
  | 'geyser'
  | 'microwave'

export interface Appliance {
  id: ApplianceId
  name: string
  room: RoomId
  watts: number
  defaultHoursPerDay: number
  isOnByDefault: boolean
  comfortScore: number
  modelFile: string
  description: string
}

export const APPLIANCES: Appliance[] = [
  {
    id: 'fan',
    name: 'Ceiling Fan',
    room: 'living',
    watts: 75,
    defaultHoursPerDay: 10,
    isOnByDefault: true,
    comfortScore: 3,
    modelFile: 'fan.glb',
    description: 'Keeps the living room air moving without much draw.',
  },
  {
    id: 'ac',
    name: 'Split AC',
    room: 'bedroom',
    watts: 1500,
    defaultHoursPerDay: 6,
    isOnByDefault: false,
    comfortScore: 5,
    modelFile: 'ac.glb',
    description: 'Cools the bedroom fast, and it is the hungriest load in the house.',
  },
  {
    id: 'fridge',
    name: 'Refrigerator',
    room: 'kitchen',
    watts: 150,
    defaultHoursPerDay: 24,
    isOnByDefault: true,
    comfortScore: 4,
    modelFile: 'fridge.glb',
    description: 'Runs all day so the kitchen food stays cold.',
  },
  {
    id: 'tv',
    name: 'Television',
    room: 'living',
    watts: 100,
    defaultHoursPerDay: 4,
    isOnByDefault: true,
    comfortScore: 2,
    modelFile: 'tv.glb',
    description: 'Evening entertainment in the living room.',
  },
  {
    id: 'light',
    name: 'LED Lights',
    room: 'all',
    watts: 40,
    defaultHoursPerDay: 6,
    isOnByDefault: true,
    comfortScore: 3,
    modelFile: 'light.glb',
    description: 'A small LED load, shared across every room.',
  },
  {
    id: 'washer',
    name: 'Washing Machine',
    room: 'bathroom',
    watts: 500,
    defaultHoursPerDay: 1,
    isOnByDefault: false,
    comfortScore: 1,
    modelFile: 'washer.glb',
    description: 'A short wash cycle in the bathroom.',
  },
  {
    id: 'geyser',
    name: 'Geyser',
    room: 'bathroom',
    watts: 2000,
    defaultHoursPerDay: 1,
    isOnByDefault: false,
    comfortScore: 2,
    modelFile: 'geyser.glb',
    description: 'Heats bath water, and it pulls a lot of power.',
  },
  {
    id: 'microwave',
    name: 'Microwave',
    room: 'kitchen',
    watts: 1200,
    defaultHoursPerDay: 0.5,
    isOnByDefault: false,
    comfortScore: 1,
    modelFile: 'microwave.glb',
    description: 'Quick kitchen heat for a few minutes.',
  },
]

export const APPLIANCE_BY_ID: Record<ApplianceId, Appliance> = Object.fromEntries(
  APPLIANCES.map((appliance) => [appliance.id, appliance]),
) as Record<ApplianceId, Appliance>
