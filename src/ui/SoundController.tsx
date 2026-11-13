import { useEffect } from 'react'
import { APPLIANCES } from '../data/appliances'
import { playClick, playPowerUp, playThunder, setFanHum, setMuted, unlockAudio } from '../lib/sound'
import { isPowered, useHouse } from '../store/useHouse'

export function SoundController() {
  useEffect(() => {
    const sync = () => {
      const state = useHouse.getState()
      setMuted(state.muted)
      setFanHum(isPowered(state, 'fan') ? 1 : 0)
    }
    const unlock = () => {
      unlockAudio()
      sync()
    }
    sync()
    // Capture runs before appliance handlers so the first toggle can make a sound.
    window.addEventListener('pointerdown', unlock, true)
    window.addEventListener('keydown', unlock, true)
    const unsubscribe = useHouse.subscribe((state, previous) => {
      setMuted(state.muted)
      if (state.powerCut !== previous.powerCut) {
        if (state.powerCut === 'flicker') playThunder()
        if (state.powerCut === 'off') playPowerUp()
      } else {
        for (const { id } of APPLIANCES) {
          if (state.on[id] !== previous.on[id]) playClick(state.on[id])
          if (state.picks.includes(id) !== previous.picks.includes(id))
            playClick(state.picks.includes(id))
        }
      }
      if (isPowered(state, 'fan') !== isPowered(previous, 'fan')) {
        setFanHum(isPowered(state, 'fan') ? 1 : 0)
      }
    })
    return () => {
      unsubscribe()
      window.removeEventListener('pointerdown', unlock, true)
      window.removeEventListener('keydown', unlock, true)
      setFanHum(0)
    }
  }, [])
  return null
}
