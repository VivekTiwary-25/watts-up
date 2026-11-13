import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApplianceCard } from './ApplianceCard'
import { ApplianceList } from './ApplianceList'
import { BillPanel } from './BillPanel'
import { TargetPanel } from './TargetPanel'
import { TopBar } from './TopBar'
import { AnimatedNumber } from './AnimatedNumber'
import { useHouse } from '@/store/useHouse'

beforeEach(() => useHouse.setState(useHouse.getInitialState(), true))
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('UI behavior', () => {
  it('updates the bill when Split AC is toggled in the appliance list', async () => {
    render(
      <>
        <ApplianceList />
        <BillPanel />
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: /appliances/i }))
    const acSwitch = screen.getByRole('switch', { name: 'Toggle Split AC' })
    expect(screen.getByText('₹798')).toBeTruthy()
    fireEvent.click(acSwitch)
    expect(await screen.findByText('₹2,858')).toBeTruthy()
    fireEvent.click(acSwitch)
    expect(await screen.findByText('₹798')).toBeTruthy()
  })

  it('shows monthly units, the tip, and one share bar per active appliance', () => {
    const { container } = render(<BillPanel />)
    expect(screen.getByText(/kWh \/ month/)).toBeTruthy()
    expect(screen.getByText(/is .* of your bill\. Running it/)).toBeTruthy()
    expect(container.querySelectorAll('.bg-teal-300')).toHaveLength(4)
  })

  it('reports whether the bill is over or under the target', () => {
    render(<TargetPanel />)
    act(() => useHouse.getState().setTarget(200))
    expect(screen.getByText(/over target/)).toBeTruthy()
    act(() => useHouse.getState().setTarget(2000))
    expect(screen.getByText(/under target/)).toBeTruthy()
  })

  it('shows appliance details and updates hours, cost, and switch state', () => {
    act(() => {
      useHouse.getState().select('ac')
      useHouse.getState().setOn('ac', true)
    })
    render(<ApplianceCard />)
    const dialog = screen.getByRole('dialog', { name: 'Split AC' })
    expect(within(dialog).getByText(/1500 W/)).toBeTruthy()
    const beforeCost = within(dialog).getByText(/of bill/).textContent
    fireEvent.change(within(dialog).getByRole('slider'), { target: { value: '6.5' } })
    expect(within(dialog).getByText('6.5 hours per day')).toBeTruthy()
    expect(within(dialog).getByText(/of bill/).textContent).not.toBe(beforeCost)
    fireEvent.click(within(dialog).getByRole('switch'))
    expect(useHouse.getState().on.ac).toBe(false)
  })

  it('names range controls and exposes descriptive values and switch state', () => {
    useHouse.getState().select('ac')
    render(
      <>
        <ApplianceCard />
        <TargetPanel />
        <TopBar />
      </>,
    )
    const hours = screen.getByRole('slider', { name: 'Split AC hours per day' })
    expect(hours.getAttribute('aria-valuetext')).toBe('6 hours per day')
    const target = screen.getByRole('slider', { name: 'Target monthly bill' })
    expect(target.getAttribute('aria-valuetext')).toBe('Rs 1,500 target')
    fireEvent.change(target, { target: { value: '2000' } })
    expect(target.getAttribute('aria-valuetext')).toBe('Rs 2,000 target')
    const toggle = screen.getByRole('switch', { name: 'Toggle Split AC' })
    expect(toggle.getAttribute('aria-checked')).toBe('false')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('button', { name: 'Close appliance details' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Mute' })).toBeTruthy()
  })

  it('closes selected and hovered details with Escape and restores the opener focus', () => {
    render(
      <>
        <ApplianceList />
        <ApplianceCard />
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Appliances' }))
    const opener = screen.getByRole('button', { name: 'Split AC' })
    opener.focus()
    fireEvent.click(opener)
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Close appliance details' }),
    )
    act(() => useHouse.getState().setHovered('ac'))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(useHouse.getState()).toMatchObject({ selected: null, hovered: null })
    expect(document.activeElement).toBe(opener)
    act(() => useHouse.getState().setHovered('fan'))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(useHouse.getState()).toMatchObject({ selected: null, hovered: null })
  })

  it('debounces bill announcements and cancels stale totals', () => {
    vi.useFakeTimers()
    render(<BillPanel />)
    const status = screen.getByRole('status')
    expect(status.getAttribute('aria-live')).toBe('polite')
    expect(status.getAttribute('aria-atomic')).toBe('true')
    act(() => vi.advanceTimersByTime(500))
    expect(status.textContent).toBe('Monthly estimate ₹798')
    act(() => useHouse.getState().toggle('ac'))
    act(() => vi.advanceTimersByTime(400))
    expect(status.textContent).toBe('Monthly estimate ₹798')
    act(() => useHouse.getState().setHours('ac', 1))
    act(() => vi.advanceTimersByTime(499))
    expect(status.textContent).toBe('Monthly estimate ₹798')
    act(() => vi.advanceTimersByTime(1))
    expect(status.textContent).toBe('Monthly estimate ₹1,068')
  })

  it('announces the target state after the adjustment settles', () => {
    vi.useFakeTimers()
    render(<TargetPanel />)
    const status = screen.getByRole('status')
    expect(status.getAttribute('aria-live')).toBe('polite')
    act(() => vi.advanceTimersByTime(500))
    expect(status.textContent).toBe('₹702 under target')
    act(() => useHouse.getState().setTarget(200))
    act(() => vi.advanceTimersByTime(499))
    expect(status.textContent).toBe('₹702 under target')
    act(() => vi.advanceTimersByTime(1))
    expect(status.textContent).toBe('₹598 over target')
  })

  it('expands the compact bill and counts to the final number', async () => {
    render(<BillPanel />)
    const details = screen.getByRole('button', { name: 'Bill details' })
    expect(details.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(details)
    expect(details.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(details)
    expect(details.getAttribute('aria-expanded')).toBe('false')
    const { rerender } = render(<AnimatedNumber value={1500} />)
    rerender(<AnimatedNumber value={2500} />)
    expect(await screen.findByText('₹2,500')).toBeTruthy()
  })

  it('blocks a fourth power-cut pick, confirms three, then restores the saved switches', () => {
    act(() => {
      useHouse.getState().toggle('ac')
      useHouse.getState().toggle('fan')
      useHouse.getState().startPowerCut()
      useHouse.getState().setPowerCutPhase('choosing')
      useHouse.getState().pick('fan')
      useHouse.getState().pick('light')
      useHouse.getState().pick('fridge')
      useHouse.getState().pick('ac')
    })
    expect(useHouse.getState().pickError?.message).toBe('Inverter can only run 3 appliances')
    expect(useHouse.getState().confirmPicks()).toBe(true)
    act(() => useHouse.getState().restorePower())
    expect(useHouse.getState()).toMatchObject({
      powerCut: 'off',
      picks: [],
      savedOn: null,
      on: { ac: true, fan: false },
    })
  })
})
