import { MainsDriver } from './MainsDriver'
import { RoomLights, SceneLights } from './Lighting'

/** All "living house" effects. MainsDriver must stay first: useFrame runs in mount order. */
export function Effects() {
  return (
    <>
      <MainsDriver />
      <SceneLights />
      <RoomLights />
    </>
  )
}
