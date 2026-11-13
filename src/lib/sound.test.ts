import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SOUND } from '../data/config'

function parameter() {
  return {
    value: 0,
    cancelScheduledValues: vi.fn(),
    setTargetAtTime: vi.fn(),
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  }
}

function node() {
  return {
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    gain: parameter(),
    frequency: parameter(),
    type: '',
    buffer: null,
    onended: null,
  }
}

function mockAudio() {
  const gains: ReturnType<typeof node>[] = []
  const oscillators: ReturnType<typeof node>[] = []
  const sources: ReturnType<typeof node>[] = []
  const context = {
    currentTime: 0,
    sampleRate: 48000,
    state: 'suspended',
    destination: {},
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    createGain: vi.fn(() => {
      const n = node()
      gains.push(n)
      return n
    }),
    createOscillator: vi.fn(() => {
      const n = node()
      oscillators.push(n)
      return n
    }),
    createBufferSource: vi.fn(() => {
      const n = node()
      sources.push(n)
      return n
    }),
    createBiquadFilter: vi.fn(node),
    createBuffer: vi.fn(() => ({ getChannelData: () => new Float32Array(96000) })),
  }
  const constructor = vi.fn(function () {
    return context
  })
  vi.stubGlobal('AudioContext', constructor)
  return { context, constructor, gains, oscillators, sources }
}

beforeEach(() => {
  vi.resetModules()
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('synthesized sound', () => {
  it('does not create audio before the first gesture', async () => {
    const { constructor } = mockAudio()
    const sound = await import('./sound')
    sound.setMuted(false)
    sound.playClick(true)
    sound.setFanHum(1)
    sound.playThunder()
    sound.playPowerUp()
    expect(constructor).not.toHaveBeenCalled()
  })

  it('creates one context on unlock and resumes suspended audio', async () => {
    const { constructor, context } = mockAudio()
    const sound = await import('./sound')
    sound.unlockAudio()
    sound.unlockAudio()
    expect(constructor).toHaveBeenCalledTimes(1)
    expect(context.resume).toHaveBeenCalled()
  })

  it('ramps master gain to zero on mute and restores configured volume', async () => {
    const { gains, oscillators } = mockAudio()
    const sound = await import('./sound')
    sound.unlockAudio()
    expect(gains[0].gain.value).toBe(SOUND.masterVolume)
    sound.setMuted(true)
    expect(gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.04)
    sound.playClick(true)
    sound.playPowerUp()
    expect(oscillators).toHaveLength(0)
    sound.setMuted(false)
    expect(gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(SOUND.masterVolume, 0, 0.04)
  })

  it('preserves mute set before unlock', async () => {
    const { gains } = mockAudio()
    const sound = await import('./sound')
    sound.setMuted(true)
    sound.unlockAudio()
    expect(gains[0].gain.value).toBe(0)
  })

  it('stays silent without AudioContext or if construction fails', async () => {
    vi.stubGlobal('AudioContext', undefined)
    const sound = await import('./sound')
    const exercise = () => {
      sound.unlockAudio()
      sound.playClick(false)
      sound.setFanHum(1)
      sound.playThunder()
      sound.playPowerUp()
      sound.setMuted(true)
    }
    expect(exercise).not.toThrow()
    vi.stubGlobal(
      'AudioContext',
      vi.fn(function () {
        throw new Error('Unavailable')
      }),
    )
    expect(exercise).not.toThrow()
  })

  it('handles a browser refusing resume', async () => {
    const { context } = mockAudio()
    context.resume.mockRejectedValue(new Error('Blocked'))
    const sound = await import('./sound')
    expect(() => sound.unlockAudio()).not.toThrow()
    await Promise.resolve()
  })

  it('plays higher clicks for on and schedules short noise bursts', async () => {
    const { oscillators, sources } = mockAudio()
    const sound = await import('./sound')
    sound.unlockAudio()
    sound.playClick(true)
    sound.playClick(false)
    expect(oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(540, 0)
    expect(oscillators[1].frequency.setValueAtTime).toHaveBeenCalledWith(360, 0)
    expect(sources[0].stop).toHaveBeenCalledWith(0.045)
  })

  it('reuses the fan oscillator and smoothly clamps its level', async () => {
    const { gains, oscillators } = mockAudio()
    const sound = await import('./sound')
    sound.unlockAudio()
    sound.setFanHum(0)
    expect(oscillators).toHaveLength(0)
    sound.setFanHum(2)
    expect(gains[1].gain.setTargetAtTime).toHaveBeenLastCalledWith(SOUND.fan.volume, 0, 0.04)
    sound.setFanHum(-1)
    expect(gains[1].gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.04)
    sound.setFanHum(1)
    expect(oscillators).toHaveLength(1)
  })

  it('synthesizes a rumble and rising restore tone', async () => {
    const { context, oscillators, sources } = mockAudio()
    const sound = await import('./sound')
    sound.unlockAudio()
    sound.playThunder()
    sound.playPowerUp()
    expect(context.createBiquadFilter).toHaveBeenCalled()
    expect(sources[0].stop).toHaveBeenCalledWith(1.4)
    expect(oscillators[0].frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(640, 0.5)
  })

  it('connects gesture, appliance, pick, mute and power changes, then cleans up', async () => {
    const { constructor, gains, oscillators, sources } = mockAudio()
    const { createElement } = await import('react')
    const { render } = await import('@testing-library/react/pure')
    const { SoundController } = await import('../ui/SoundController')
    const { useHouse } = await import('../store/useHouse')
    const mounted = render(createElement(SoundController))
    try {
      expect(constructor).not.toHaveBeenCalled()
      window.dispatchEvent(new Event('pointerdown'))
      expect(constructor).toHaveBeenCalledTimes(1)
      expect(oscillators).toHaveLength(1)
      useHouse.getState().toggle('fan')
      expect(oscillators).toHaveLength(2)
      expect(gains[1].gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.04)
      useHouse.getState().startPowerCut()
      expect(sources).toHaveLength(2)
      useHouse.getState().setPowerCutPhase('choosing')
      useHouse.getState().pick('fan')
      expect(oscillators).toHaveLength(3)
      expect(gains[1].gain.setTargetAtTime).toHaveBeenLastCalledWith(SOUND.fan.volume, 0, 0.04)
      useHouse.getState().restorePower()
      expect(oscillators).toHaveLength(4)
      useHouse.getState().toggleMute()
      expect(gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.04)
    } finally {
      mounted.unmount()
    }
    const count = oscillators.length
    useHouse.getState().toggle('fan')
    window.dispatchEvent(new Event('keydown'))
    expect(oscillators).toHaveLength(count)
    expect(gains[1].gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.04)
  })
})
