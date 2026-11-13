import { describe, expect, it } from 'vitest'
import { APPLIANCES, type ApplianceId } from '../data/appliances'
import { TARIFF, TIP_HOURS_CUT } from '../data/config'
import { computeBill, energyCharge, monthlyUnits } from './bill'
import { formatINR } from './format'

const on = Object.fromEntries(APPLIANCES.map((a) => [a.id, a.isOnByDefault])) as Record<
  ApplianceId,
  boolean
>
const hours = Object.fromEntries(APPLIANCES.map((a) => [a.id, a.defaultHoursPerDay])) as Record<
  ApplianceId,
  number
>

describe('bill', () => {
  it('converts watts and daily hours to monthly units', () => {
    expect(monthlyUnits(1500, 6)).toBe(270)
    expect(monthlyUnits(1000, 2, 10)).toBe(20)
  })

  it.each([
    [0, 0],
    [50, 200],
    [100, 400],
    [150, 700],
    [200, 1000],
    [250, 1400],
  ])('charges %s units as %s', (units, charge) => {
    expect(energyCharge(units)).toBe(charge)
  })

  it('calculates the default bill and proportional sorted costs', () => {
    const bill = computeBill(on, hours)
    expect(bill.totalUnits).toBeCloseTo(149.7)
    expect(bill.total).toBeCloseTo(798.2)
    expect(bill.items.reduce((sum, item) => sum + item.share, 0)).toBeCloseTo(1)
    expect(bill.items.reduce((sum, item) => sum + item.cost, 0)).toBeCloseTo(bill.energyCharge)
    expect(bill.items.map((item) => item.id)).toEqual(['fridge', 'fan', 'tv', 'light'])
    for (const item of bill.items) {
      expect(item.cost).toBeCloseTo((bill.energyCharge * item.units) / bill.totalUnits)
    }
  })

  it('charges only the fixed charge when everything is off', () => {
    const allOff = { ...on, fan: false, fridge: false, tv: false, light: false }
    const bill = computeBill(allOff, hours)
    expect(bill.total).toBe(100)
    expect(bill.items).toEqual([])
    expect(bill.tip).toBe('Everything is off. Your bill is just the ₹100 fixed charge.')
  })

  it('gives a top-share tip with the actual slab saving, including short usage', () => {
    for (const acHours of [6, 1]) {
      const currentHours = { ...hours, ac: acHours }
      const currentOn = { ...on, ac: true, fridge: false, fan: false, tv: false, light: false }
      const bill = computeBill(currentOn, currentHours)
      const reduced = computeBill(currentOn, {
        ...currentHours,
        ac: Math.max(0, acHours - TIP_HOURS_CUT),
      })
      expect(bill.tip).toBe(
        `Split AC is 100% of your bill. Running it 2 hours less a day saves ${formatINR(bill.total - reduced.total)}.`,
      )
    }
  })

  it('uses the supplied appliances and tariff', () => {
    const tariff = {
      ...TARIFF,
      daysPerMonth: 10,
      fixedCharge: 20,
      slabs: [{ upTo: Infinity, rate: 2 }],
    }
    const bill = computeBill(
      on,
      hours,
      APPLIANCES.filter((a) => a.id === 'fan'),
      tariff,
    )
    expect(bill.totalUnits).toBe(7.5)
    expect(bill.total).toBe(35)
    expect(bill.tip).toContain('saves ₹3.')
  })

  it('keeps zero-hour enabled appliances finite', () => {
    const bill = computeBill(on, { ...hours, fan: 0, fridge: 0, tv: 0, light: 0 })
    expect(bill.total).toBe(100)
    expect(bill.items.every((item) => item.share === 0 && item.cost === 0)).toBe(true)
  })

  it('formats rupees with Indian grouping and optional decimals', () => {
    expect(formatINR(1234567.8)).toBe('₹12,34,568')
    expect(formatINR(798.2, 2)).toBe('₹798.20')
  })
})
