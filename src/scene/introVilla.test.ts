import { afterEach, describe, expect, it } from 'vitest'
import { useHouse } from '@/store/useHouse'
import { INTRO_BUDGET, skipIntro } from './IntroVilla'

describe('skipIntro', () => {
  afterEach(() => {
    useHouse.setState({ view: 'intro', villa: false })
  })

  it('goes from the intro to the overhead rooms view', () => {
    useHouse.setState({ view: 'intro' })
    skipIntro()
    expect(useHouse.getState().view).toBe('overview')
  })

  it('leaves any other view alone', () => {
    useHouse.setState({ view: 'room' })
    skipIntro()
    expect(useHouse.getState().view).toBe('room')
  })
})

describe('INTRO_BUDGET', () => {
  it('gives the villa 8 s and caps the intro DPR at 1.25', () => {
    expect(INTRO_BUDGET.timeoutMs).toBe(8000)
    expect(INTRO_BUDGET.maxDpr).toBe(1.25)
  })
})
