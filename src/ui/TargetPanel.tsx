import { useEffect, useState } from 'react'
import { useBill } from '@/store/useHouse'
import { useHouse } from '@/store/useHouse'
import { TARGET_RANGE } from '@/data/config'
import { formatINR } from '@/lib/format'
export function TargetPanel() {
  const bill = useBill(),
    target = useHouse((s) => s.targetBill),
    setTarget = useHouse((s) => s.setTarget)
  const delta = Math.abs(target - bill.total),
    under = bill.total <= target,
    ratio = Math.min(bill.total / Math.max(target, 1), 1)
  const message = `${formatINR(delta)} ${under ? 'under' : 'over'} target`
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    const timeout = window.setTimeout(() => setAnnouncement(message), 500)
    return () => window.clearTimeout(timeout)
  }, [message])

  return (
    <section className="glass pointer-events-auto w-full rounded-2xl p-3 tabular-nums sm:max-w-xs sm:p-4">
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </span>
      <div className="mb-1 flex items-center justify-between sm:mb-3">
        <h2 className="text-sm font-medium">
          <label htmlFor="target-bill">Target bill</label>
        </h2>
        <span className="text-sm tabular-nums">{formatINR(target)}</span>
      </div>
      <div className="flex items-center gap-3">
        <svg
          viewBox="0 0 44 44"
          className="hidden size-12 shrink-0 -rotate-90 sm:block"
          aria-hidden="true"
        >
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeOpacity=".15"
            strokeWidth="4"
          />
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke={under ? '#5eead4' : '#fbbf24'}
            strokeWidth="4"
            strokeDasharray={`${ratio * 113} 113`}
            strokeLinecap="round"
          />
        </svg>
        <p className={`text-sm ${under ? 'text-teal-200' : 'text-amber-200'}`}>{message}</p>
      </div>
      <input
        id="target-bill"
        type="range"
        aria-label="Target monthly bill"
        aria-valuetext={`Rs ${target.toLocaleString('en-IN')} target`}
        className="ui-range mt-1 sm:mt-4"
        min={TARGET_RANGE.min}
        max={TARGET_RANGE.max}
        step={TARGET_RANGE.step}
        value={target}
        onChange={(event) => setTarget(event.currentTarget.valueAsNumber)}
      />
    </section>
  )
}
