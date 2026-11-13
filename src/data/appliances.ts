export type RoomId = 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'all'
export type ApplianceId =
  'fan' | 'ac' | 'fridge' | 'tv' | 'light' | 'washer' | 'geyser' | 'stove'

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
    description: 'A gentle breeze keeps your room comfortable.',
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
    description: 'Cool down your bedroom on warm nights.',
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
    description: 'Keep your food fresh and drinks chilled.',
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
    description: 'Enjoy your favourite shows together.',
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
    description: 'Brighten your home with a little energy.',
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
    description: 'Let the machine take care of laundry day.',
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
    description: 'Warm water makes your morning shower cosy.',
  },
  {
    id: 'stove',
    name: 'Electric Stove',
    room: 'kitchen',
    watts: 1500,
    defaultHoursPerDay: 1,
    isOnByDefault: false,
    comfortScore: 2,
    modelFile: 'stove.glb',
    description: 'Cook a hot meal on the hob or in the oven.',
  },
]

export const APPLIANCE_BY_ID = Object.fromEntries(
  APPLIANCES.map((appliance) => [appliance.id, appliance]),
) as Record<ApplianceId, Appliance>
