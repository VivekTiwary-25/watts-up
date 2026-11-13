import type { ComponentType } from 'react'
import type { ApplianceId } from '@/store/useHouse'
import { AcModel } from './Ac'
import { FanModel } from './Fan'
import { FridgeModel } from './Fridge'
import { GeyserModel } from './Geyser'
import type { PlaceholderProps } from './kit'
import { LightModel } from './Light'
import { StoveModel } from './Stove'
import { TvModel } from './Tv'
import { WasherModel } from './Washer'

export { usePlaceholderMats } from './kit'

export const PLACEHOLDER_MODELS: Record<ApplianceId, ComponentType<PlaceholderProps>> = {
  fridge: FridgeModel,
  ac: AcModel,
  tv: TvModel,
  fan: FanModel,
  light: LightModel,
  washer: WasherModel,
  geyser: GeyserModel,
  stove: StoveModel,
}
