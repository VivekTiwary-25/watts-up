import { useEffect, useState } from 'react'
import { useBill } from '@/store/useHouse'
import { Card } from '@/components/ui/card'
import { formatINR } from '@/lib/format'
import { AnimatedNumber } from './AnimatedNumber'
export function BillPanel() {
  const bill = useBill()
  const [expanded, setExpanded] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const message = `Monthly estimate ${formatINR(bill.total)}`

  useEffect(() => {
    const timeout = window.setTimeout(() => setAnnouncement(message), 500)
    return () => window.clearTimeout(timeout)
  }, [message])

  return (
    <Card className="glass pointer-events-auto w-full max-w-sm gap-2 rounded-3xl p-3 tabular-nums sm:gap-3 sm:rounded-2xl sm:p-4">
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </span>
      <div className="flex items-center justify-between gap-3 sm:block">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Monthly estimate
        </div>
        <div className="text-xl font-semibold sm:text-3xl">
          <AnimatedNumber value={bill.total} />
        </div>
        <button
          className="rounded-xl px-2 text-xs hover:bg-white/10 sm:hidden"
          aria-expanded={expanded}
          aria-controls="bill-details"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Hide details' : 'Bill details'}
        </button>
      </div>
      <div
        id="bill-details"
        className={`${expanded ? 'block' : 'hidden'} max-h-[40svh] space-y-3 overflow-y-auto overscroll-contain sm:block sm:max-h-none`}
      >
        <div className="text-sm text-muted-foreground">
          <AnimatedNumber value={bill.totalUnits} currency={false} /> kWh / month
        </div>
        <div className="space-y-2">
          {bill.items.map((item) => (
            <div key={item.id} className="text-xs">
              <div className="mb-1 flex justify-between">
                <span>{item.name}</span>
                <span>{Math.round(item.share * 100)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded bg-white/10">
                <div
                  className="h-full origin-left rounded bg-teal-300 transition-transform duration-500"
                  style={{ transform: `scaleX(${item.share})` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="min-h-10 text-xs text-muted-foreground">{bill.tip}</p>
        <div className="border-t border-white/10 pt-2 text-xs text-muted-foreground">
          Includes {formatINR(bill.fixedCharge)} fixed charge
        </div>
      </div>
    </Card>
  )
}
