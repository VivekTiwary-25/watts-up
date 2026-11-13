import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useHouse } from '@/store/useHouse'
import { BillPanel } from './BillPanel'
import { TargetPanel } from './TargetPanel'
import { ApplianceCard } from './ApplianceCard'
import { TopBar } from './TopBar'
import { ApplianceList } from './ApplianceList'
import { IntroOverlay } from './IntroOverlay'
import { SoundController } from './SoundController'
import { PowerCutOverlay } from './powercut'
import { RoomNav } from './RoomNav'
import { FirstHint } from './FirstHint'

export function HUD() {
  const intro = useHouse((s) => s.view === 'intro')
  const reduced = useReducedMotion()
  return (
    <div className="pointer-events-none absolute inset-0 z-10 p-3 md:p-6">
      <SoundController />
      <AnimatePresence>
        {intro ? (
          <IntroOverlay key="intro" />
        ) : (
          <motion.div
            key="hud"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.3 }}
          >
            <div className="flex flex-col gap-3">
              <TopBar />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-1 sm:gap-3">
                  <BillPanel />
                  <RoomNav />
                </div>
                <div className="absolute inset-x-3 bottom-3 max-h-[35svh] space-y-2 overflow-y-auto overscroll-contain sm:static sm:max-h-none sm:w-64 sm:shrink-0 sm:overflow-visible md:w-72">
                  <TargetPanel />
                  <ApplianceList />
                </div>
              </div>
            </div>
            <ApplianceCard />
            <FirstHint />
          </motion.div>
        )}
      </AnimatePresence>
      {!intro && <PowerCutOverlay />}
    </div>
  )
}
