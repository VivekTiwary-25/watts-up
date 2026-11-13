import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useHouse } from '@/store/useHouse'

const HINT_MS = 8000
/** Shown once per page load, on the first arrival after the intro. */
let shown = false

/** One-time tip on how to drive the camera; leaves on the first interaction or after 8 s. */
export function FirstHint() {
  const afterIntro = useHouse((s) => s.view !== 'intro')
  const reduced = useReducedMotion()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!afterIntro || shown) return
    shown = true
    setVisible(true)
    let dismissed = false
    const hide = () => {
      dismissed = true
      setVisible(false)
    }
    const timer = window.setTimeout(hide, HINT_MS)
    // let the click that ended the intro pass before listening for the first real interaction
    const listen = window.setTimeout(() => {
      window.addEventListener('pointerdown', hide, { once: true })
      window.addEventListener('wheel', hide, { once: true, passive: true })
      window.addEventListener('keydown', hide, { once: true })
    }, 300)
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(listen)
      window.removeEventListener('pointerdown', hide)
      window.removeEventListener('wheel', hide)
      window.removeEventListener('keydown', hide)
      // unmounted before it was seen out (e.g. StrictMode re-run): allow it to show again
      if (!dismissed) shown = false
    }
  }, [afterIntro])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="first-hint"
          role="status"
          className="glass pointer-events-none absolute bottom-[38svh] left-1/2 z-20 w-max max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full px-4 py-2 text-center text-xs text-slate-100 sm:bottom-6 sm:text-sm"
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: 8 }}
          transition={{ duration: reduced ? 0 : 0.35 }}
        >
          Drag to spin · Click a room to step in · Click any appliance
        </motion.div>
      )}
    </AnimatePresence>
  )
}
