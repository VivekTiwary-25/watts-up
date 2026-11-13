import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'motion/react'
import { formatINR } from '@/lib/format'

const number = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 1,
})
export function AnimatedNumber({ value, currency = true }: { value: number; currency?: boolean }) {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(value)
  const from = useRef(value)

  useEffect(() => {
    if (reduced) {
      from.current = value
      setShown(value)
      return
    }
    const controls = animate(from.current, value, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (next) => {
        from.current = next
        setShown(next)
      },
    })
    return () => controls.stop()
  }, [value, reduced])

  return <span className="tabular-nums">{currency ? formatINR(shown) : number.format(shown)}</span>
}
