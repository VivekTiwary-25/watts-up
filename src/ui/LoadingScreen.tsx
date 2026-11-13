import { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

/** Hide once loading has been idle this long after at least one item finished. */
const IDLE_HIDE_MS = 1500
/** Hide if no loader has started by this point (everything cached / nothing to load). */
const NO_START_HIDE_MS = 3000
/** Hard fallback: never block the app longer than this, whatever the loaders report. */
const HARD_HIDE_MS = 45000

/**
 * Decides when the loading screen should go away. Once hidden it stays hidden, so models
 * that lazy-load later never bring the overlay back.
 */
function useLoadingGate() {
  const { active, progress, loaded, total } = useProgress()
  const [hidden, setHidden] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (active || loaded > 0 || total > 0) started.current = true
  }, [active, loaded, total])

  // Normal finish: loaders idle and everything reported done (progress only hits 100
  // after at least one item loaded, so this never fires on the initial 0/0 state).
  const finished = !active && progress >= 100

  // Idle for IDLE_HIDE_MS after at least one item loaded (covers progress stuck below 100).
  useEffect(() => {
    if (hidden || active || loaded < 1) return
    const t = window.setTimeout(() => setHidden(true), IDLE_HIDE_MS)
    return () => window.clearTimeout(t)
  }, [hidden, active, loaded])

  // Nothing started loading in time, plus the hard fallback.
  useEffect(() => {
    const noStart = window.setTimeout(() => {
      if (!started.current) setHidden(true)
    }, NO_START_HIDE_MS)
    const hard = window.setTimeout(() => setHidden(true), HARD_HIDE_MS)
    return () => {
      window.clearTimeout(noStart)
      window.clearTimeout(hard)
    }
  }, [])

  // Latch the finish during render so a later lazy load can't bring the overlay back.
  if (finished && !hidden) setHidden(true)

  return { visible: !hidden && !finished, progress }
}

export function LoadingScreen() {
  const { visible, progress } = useLoadingGate()
  const reducedMotion = useReducedMotion()
  const percent = Math.min(100, Math.max(0, Math.round(progress)))

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#0b1020] text-slate-100 tabular-nums"
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
            aria-valuenow={percent}
          >
            <div
              className="h-full rounded-full bg-cyan-200 shadow-[0_0_10px_#a5f3fc]"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-sm text-slate-300">Loading your home… {percent}%</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
