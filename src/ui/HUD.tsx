import { BillPanel } from './BillPanel'
import { TargetPanel } from './TargetPanel'
import { ApplianceCard } from './ApplianceCard'
import { TopBar } from './TopBar'
import { ApplianceList } from './ApplianceList'
import { IntroOverlay } from './IntroOverlay'
export function HUD(){const intro=useHouse(s=>s.view==='intro'),reduced=useReducedMotion();return <div className="pointer-events-none absolute inset-0 z-10 p-3 md:p-6"><AnimatePresence>{intro?<IntroOverlay key="intro"/>:<motion.div key="hud" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?0:0.3}}><div className="flex flex-col gap-3"><TopBar/><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><BillPanel/><TargetPanel/></div><div className="self-start"><ApplianceList/></div></div><ApplianceCard/></motion.div>}</AnimatePresence></div>}
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useHouse } from '@/store/useHouse'
