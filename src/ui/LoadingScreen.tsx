import { useProgress } from '@react-three/drei'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

export function LoadingScreen() {
  const { active, progress } = useProgress()
  const reducedMotion = useReducedMotion()

  return (
    <AnimatePresence>
      {(active || progress < 100) && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#0b1020] text-slate-100"
          role="status"
          aria-label="Loading your home"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.3 }}
        >
          <h1 className="text-3xl font-semibold tracking-tight">Watt's Up?</h1>
          <div
            className="h-1 w-64 max-w-[80vw] overflow-hidden rounded-full bg-slate-700"
            role="progressbar"
            aria-label="Home assets"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <div
              className="h-full rounded-full bg-cyan-200 shadow-[0_0_10px_#a5f3fc]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-slate-300">Loading your home… {Math.round(progress)}%</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
