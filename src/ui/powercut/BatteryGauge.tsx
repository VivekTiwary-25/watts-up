import { motion } from 'motion/react'
import { POWER_CUT } from '@/data/config'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

const FILL_WIDTH = 24

export function BatteryGauge({ hours }: { hours: number }) {
  const reduced = usePrefersReducedMotion()
  const finite = Number.isFinite(hours)
  const ratio = finite ? Math.min(Math.max(hours, 0) / 8, 1) : 1
  const short = finite && hours < POWER_CUT.minBackupHours

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 36 18"
      className="h-5 w-10 shrink-0 text-foreground"
    >
      <rect
        x="1"
        y="1"
        width="28"
        height="16"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect x="30.5" y="5.5" width="3.5" height="7" rx="1" fill="currentColor" />
      <motion.rect
        x="3"
        y="3"
        height="12"
        rx="1.5"
        fill={short ? 'var(--destructive)' : '#8fbfb3'}
        initial={false}
        animate={{ width: FILL_WIDTH * ratio }}
        transition={reduced ? { duration: 0 } : { type: 'spring', duration: 0.3, bounce: 0 }}
      />
    </svg>
  )
}
