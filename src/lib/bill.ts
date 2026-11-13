import { APPLIANCES, type ApplianceId } from '../data/appliances'
import { TARIFF, TIP_HOURS_CUT } from '../data/config'
import { formatINR } from './format'

export interface BillItem {
  id: ApplianceId
  name: string
  units: number
  cost: number
  share: number
}

export interface BillResult {
  totalUnits: number
  energyCharge: number
  fixedCharge: number
  total: number
  items: BillItem[]
  tip: string
}

export function monthlyUnits(
  watts: number,
  hoursPerDay: number,
  days = TARIFF.daysPerMonth,
): number {
  return (watts * hoursPerDay * days) / 1000
}

export function energyCharge(units: number, tariff = TARIFF): number {
  let charge = 0
  let previousLimit = 0
  for (const slab of tariff.slabs) {
    charge += Math.max(0, Math.min(units, slab.upTo) - previousLimit) * slab.rate
    if (units <= slab.upTo) break
    previousLimit = slab.upTo
  }
  return charge
}

export function computeBill(
  on: Record<ApplianceId, boolean>,
  hours: Record<ApplianceId, number>,
  appliances = APPLIANCES,
  tariff = TARIFF,
): BillResult {
  const active = appliances.filter((appliance) => on[appliance.id])
  const usage = active.map((appliance) => ({
    id: appliance.id,
    name: appliance.name,
    units: monthlyUnits(appliance.watts, hours[appliance.id], tariff.daysPerMonth),
  }))
  const totalUnits = usage.reduce((sum, item) => sum + item.units, 0)
  const charge = energyCharge(totalUnits, tariff)
  const items = usage
    .map((item) => {
      const share = totalUnits > 0 ? item.units / totalUnits : 0
      return { ...item, share, cost: charge * share }
    })
    .sort((a, b) => b.cost - a.cost)
  let tip = `Everything is off. Your bill is just the ${formatINR(tariff.fixedCharge)} fixed charge.`
  const top = items[0]
  if (totalUnits === 0 && active.length > 0) {
    tip = `Your appliances are on but set to 0 hours. Your bill is just the ${formatINR(tariff.fixedCharge)} fixed charge.`
  } else if (top) {
    const appliance = active.find((item) => item.id === top.id)!
    const reducedUnits = monthlyUnits(
      appliance.watts,
      Math.max(0, hours[top.id] - TIP_HOURS_CUT),
      tariff.daysPerMonth,
    )
    const saving = charge - energyCharge(totalUnits - top.units + reducedUnits, tariff)
    tip = `${top.name} is ${Math.round(top.share * 100)}% of your bill. Running it ${TIP_HOURS_CUT} hours less a day saves ${formatINR(saving)}.`
  }
  return {
    totalUnits,
    energyCharge: charge,
    fixedCharge: tariff.fixedCharge,
    total: charge + tariff.fixedCharge,
    items,
    tip,
  }
}
