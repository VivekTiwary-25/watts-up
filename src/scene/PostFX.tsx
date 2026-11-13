import {
  Bloom,
  EffectComposer,
  N8AO,
  Outline,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { QUALITY } from '@/data/config'
import { useQuality } from './quality'

const B = QUALITY.bloom

/**
 * The ONE EffectComposer. Must sit inside <Selection> (Outline reads it).
 * Pass order = JSX order: AO -> Bloom -> AgX tone map -> Outline -> Vignette.
 * The renderer runs NoToneMapping (see App) so bloom sees real HDR values and
 * we tone-map exactly once, here. Low tier: no AO, cheaper bloom, no MSAA.
 */
export function PostFX() {
  const tier = useQuality((s) => s.tier)
  const high = tier === 'high'

  return (
    <EffectComposer autoClear={false} multisampling={QUALITY.multisampling[tier]}>
      {high && (
        <N8AO
          aoRadius={QUALITY.ao.radius}
          distanceFalloff={QUALITY.ao.distanceFalloff}
          intensity={QUALITY.ao.intensity}
          quality={QUALITY.ao.quality}
          color="#05070d"
        />
      )}
      <Bloom
        mipmapBlur
        intensity={B.intensity[tier]}
        luminanceThreshold={B.threshold}
        luminanceSmoothing={B.smoothing}
        levels={B.levels[tier]}
      />
      <ToneMapping mode={ToneMappingMode.AGX} />
      <Outline
        blur
        edgeStrength={6}
        visibleEdgeColor={0x7fe8ff}
        hiddenEdgeColor={0x1b4a5a}
        xRay={false}
      />
      <Vignette eskil={false} offset={QUALITY.vignette.offset} darkness={QUALITY.vignette.darkness} />
    </EffectComposer>
  )
}
