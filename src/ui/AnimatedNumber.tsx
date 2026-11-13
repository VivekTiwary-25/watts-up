import { formatINR } from '@/lib/format'

const number = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 1,
})
export function AnimatedNumber({ value, currency = true }: { value: number; currency?: boolean }) {
  return <span className="tabular-nums">{currency ? formatINR(value) : number.format(value)}</span>
}
