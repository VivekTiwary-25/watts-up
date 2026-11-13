import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ApplianceCard } from './ApplianceCard';
import { ApplianceList } from './ApplianceList';
import { BillPanel } from './BillPanel';
import { TargetPanel } from './TargetPanel';
import { useHouse } from '@/store/useHouse';

beforeEach(() => useHouse.setState(useHouse.getInitialState(), true));
afterEach(cleanup);

describe('UI behavior', () => {
  it('updates the bill when Split AC is toggled in the appliance list', () => {
    render(<><ApplianceList /><BillPanel /></>);
    fireEvent.click(screen.getByRole('button', { name: /appliances/i }));
    const acSwitch = screen.getByRole('switch', { name: 'Toggle Split AC' });
    expect(screen.getByText('₹798')).toBeTruthy();
    fireEvent.click(acSwitch);
    expect(screen.getByText('₹2,858')).toBeTruthy();
    fireEvent.click(acSwitch);
    expect(screen.getByText('₹798')).toBeTruthy();
  });

  it('shows monthly units, the tip, and one share bar per active appliance', () => {
    const { container } = render(<BillPanel />);
    expect(screen.getByText(/kWh \/ month/)).toBeTruthy();
    expect(screen.getByText(/is .* of your bill\. Running it/)).toBeTruthy();
    expect(container.querySelectorAll('.bg-teal-300')).toHaveLength(4);
  });

  it('reports whether the bill is over or under the target', () => {
    render(<TargetPanel />);
    act(() => useHouse.getState().setTarget(200));
    expect(screen.getByText(/over target/)).toBeTruthy();
    act(() => useHouse.getState().setTarget(2000));
    expect(screen.getByText(/under target/)).toBeTruthy();
  });

  it('shows appliance details and updates hours, cost, and switch state', () => {
    act(() => {
      useHouse.getState().select('ac');
      useHouse.getState().setOn('ac', true);
    });
    render(<ApplianceCard />);
    const dialog = screen.getByRole('dialog', { name: 'Split AC' });
    expect(within(dialog).getByText(/1500 W/)).toBeTruthy();
    const beforeCost = within(dialog).getByText(/of bill/).textContent;
    fireEvent.keyDown(within(dialog).getByRole('slider'), { key: 'ArrowRight' });
    expect(within(dialog).getByText('6.5 hours per day')).toBeTruthy();
    expect(within(dialog).getByText(/of bill/).textContent).not.toBe(beforeCost);
    fireEvent.click(within(dialog).getByRole('switch'));
    expect(useHouse.getState().on.ac).toBe(false);
  });

  it('blocks a fourth power-cut pick, confirms three, then restores the saved switches', () => {
    act(() => {
      useHouse.getState().toggle('ac');
      useHouse.getState().toggle('fan');
      useHouse.getState().startPowerCut();
      useHouse.getState().setPowerCutPhase('choosing');
      useHouse.getState().pick('fan');
      useHouse.getState().pick('light');
      useHouse.getState().pick('fridge');
      useHouse.getState().pick('ac');
    });
    expect(useHouse.getState().pickError?.message).toBe('Inverter can only run 3 appliances');
    expect(useHouse.getState().confirmPicks()).toBe(true);
    act(() => useHouse.getState().restorePower());
    expect(useHouse.getState()).toMatchObject({ powerCut: 'off', picks: [], savedOn: null, on: { ac: true, fan: false } });
  });
});
