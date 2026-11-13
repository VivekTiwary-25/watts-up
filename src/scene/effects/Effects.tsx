import { Ac } from './Ac'
import { Fan } from './Fan'
import { Geyser } from './Geyser'
import { MainsDriver } from './MainsDriver'
import { RoomLights, SceneLights } from './Lighting'
import { Tv } from './Tv'

/** All "living house" effects. MainsDriver must stay first: useFrame runs in mount order. */
export function Effects() {
  return (
    <>
      <MainsDriver />
      <SceneLights />
      <RoomLights />
      <Fan />
      <Tv />
      <Ac />
      <Geyser />
    </>
  )
}
