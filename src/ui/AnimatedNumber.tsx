import { motion, useReducedMotion } from 'motion/react'

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})
export function AnimatedNumber({ value, currency = true }: { value: number; currency?: boolean }) {
  const reduced = useReducedMotion()
  return (
    <motion.span
      className="tabular-nums"
      initial={false}
      animate={{ opacity: 1 }}
      key={value}
      transition={{ duration: reduced ? 0 : 0.35 }}
    >
      {currency
        ? money.format(value)
        : new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(value)}
    </motion.span>
  )
}
