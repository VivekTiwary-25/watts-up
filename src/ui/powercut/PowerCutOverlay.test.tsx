import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { POWER_CUT } from '@/data/config'
import { useHouse } from '@/store/useHouse'
import { PowerCutOverlay } from './PowerCutOverlay'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  useHouse.setState({
    powerCut: 'off',
    picks: [],
    pickError: null,
    savedOn: null,
  })
})

test('renders nothing while power is on', () => {
  useHouse.setState({ powerCut: 'off' })
  const { container } = render(<PowerCutOverlay />)
  expect(container.childElementCount).toBe(0)
})

test('flicker advances to choosing after the blackout', () => {
  vi.useFakeTimers()
  useHouse.setState({ powerCut: 'flicker', picks: [] })
  render(<PowerCutOverlay />)
  expect(screen.getByRole('status').textContent).toContain('Power is out.')
  act(() => {
    vi.advanceTimersByTime(POWER_CUT.flickerMs)
  })
  expect(useHouse.getState().powerCut).toBe('choosing')
  expect(
    screen.getByRole('heading', { name: 'Inverter backup: choose 3 to keep running.' }),
  ).toBeTruthy()
})
test('confirm stays disabled until exactly three appliances are kept', () => {
  useHouse.setState({ powerCut: 'choosing', picks: ['fan', 'fridge'] })
  render(<PowerCutOverlay />)
  expect(
    screen.getByRole('heading', { name: 'Inverter backup: choose 3 to keep running.' }).textContent,
  ).toBe('Inverter backup: choose 3 to keep running.')
  expect(screen.getByRole('button', { name: 'Confirm' }).hasAttribute('disabled')).toBe(true)
  expect(screen.getByText('Picked 2 of 3')).toBeTruthy()
  expect(screen.getByText('225 W').textContent).toContain('225 W')

  act(() => {
    useHouse.setState({ picks: ['fan', 'fridge', 'light'] })
  })
  expect(
    screen.getByRole('button', { name: 'Confirm 3 appliances' }).hasAttribute('disabled'),
  ).toBe(false)
  expect(screen.getByText('Picked 3 of 3')).toBeTruthy()
  expect(screen.getByText('265 W').textContent).toContain('265 W')
  expect(screen.getByText('5h 26m').textContent).toContain('5h 26m')
})

test('clicking a filled slot unpicks it', () => {
  useHouse.setState({ powerCut: 'choosing', picks: ['fan', 'fridge', 'light'] })
  render(<PowerCutOverlay />)
  fireEvent.click(screen.getByRole('button', { name: 'Remove Ceiling Fan from backup' }))
  expect(useHouse.getState().picks).toEqual(['fridge', 'light'])
  expect(screen.getByRole('button', { name: 'Confirm' }).hasAttribute('disabled')).toBe(true)
})

test('shows the inverter limit for 3.5 seconds and restarts its timer on a new error', () => {
  vi.useFakeTimers()
  useHouse.setState({
    powerCut: 'choosing',
    picks: ['fan', 'fridge', 'light'],
    pickError: { message: 'Inverter can only run 3 appliances', at: 5 },
  })
  render(<PowerCutOverlay />)
  expect(screen.getByRole('alert').textContent).toContain('Inverter can only run 3 appliances')
  act(() => {
    vi.advanceTimersByTime(POWER_CUT.messageMs - 500)
  })
  act(() => {
    useHouse.setState({ pickError: { message: 'Inverter can only run 3 appliances', at: 6 } })
    vi.advanceTimersByTime(500)
  })
  expect(screen.getByRole('alert').textContent).toContain('Inverter can only run 3 appliances')
  act(() => {
    vi.advanceTimersByTime(POWER_CUT.messageMs - 1)
  })
  expect(screen.getByRole('alert')).toBeTruthy()
  act(() => {
    vi.advanceTimersByTime(1)
  })
  expect(screen.queryByRole('alert')).toBeNull()
})

test('confirm moves a valid selection to the result', () => {
  useHouse.setState({ powerCut: 'choosing', picks: ['ac', 'fridge', 'fan'] })
  render(<PowerCutOverlay />)
  fireEvent.click(screen.getByRole('button', { name: 'Confirm 3 appliances' }))
  expect(useHouse.getState().powerCut).toBe('result')
  expect(screen.getByText('Yours lasts 4h 36m less').textContent).toBe('Yours lasts 4h 36m less')
  expect(screen.getByText('Checked all 56 combinations.').textContent).toBe(
    'Checked all 56 combinations.',
  )
  expect(screen.getByText('12/12').textContent).toBe('12/12')
  expect(screen.getByText('10/12').textContent).toBe('10/12')
  expect(screen.getByRole('progressbar', { name: 'Comfort' }).getAttribute('aria-valuenow')).toBe(
    '12',
  )
  expect(
    screen.getByRole('region', { name: 'Backup result' }).querySelector('.text-emerald-300'),
  ).toBeTruthy()
})

test('restore power ends the cut and try again returns to choosing', () => {
  const savedOn = { ...useHouse.getState().on, ac: true }
  useHouse.setState({
    powerCut: 'result',
    picks: ['fan', 'fridge', 'light'],
    savedOn,
    on: { ...savedOn, ac: false },
  })
  const view = render(<PowerCutOverlay />)
  expect(screen.getByText('This is the best possible combo').textContent).toBe(
    'This is the best possible combo',
  )

  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(useHouse.getState().powerCut).toBe('choosing')
  expect(useHouse.getState().picks).toEqual(['fan', 'fridge', 'light'])

  act(() => {
    useHouse.setState({ powerCut: 'result' })
  })
  fireEvent.click(screen.getByRole('button', { name: 'Restore power' }))
  expect(useHouse.getState().powerCut).toBe('off')
  expect(useHouse.getState().on.ac).toBe(true)
  expect(useHouse.getState().picks).toEqual([])
  expect(view.container.childElementCount).toBe(0)
})
