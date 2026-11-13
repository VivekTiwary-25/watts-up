import { useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { useHouse } from '@/store/useHouse'

export function IntroOverlay() {
  const setView = useHouse((s) => s.setView)
  const reduced = useReducedMotion()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && useHouse.getState().view === 'intro') setView('overview')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setView])

  return (
    <motion.section
      className="pointer-events-auto absolute inset-x-4 bottom-[12%] z-20 mx-auto max-w-xl rounded-3xl border border-white/10 bg-slate-950/70 p-7 text-center text-slate-100 shadow-2xl backdrop-blur-xl md:p-10"
      initial={{ opacity: 0, y: reduced ? 0 : 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : 12 }}
      transition={{ duration: reduced ? 0 : 0.45 }}
    >
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Watt's Up?</h1>
      <p className="mt-3 text-sm text-slate-300 md:text-base">Flip switches in a living house and watch your electricity bill react.</p>
      <Button className="mt-7 h-12 rounded-xl bg-orange-500 px-8 text-base text-white hover:bg-orange-400" onClick={() => setView('overview')}>
        Step inside
      </Button>
    </motion.section>
  )
}
