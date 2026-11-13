import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useAnimationControls, useIsPresent } from 'motion/react'
import { X } from 'lucide-react'
import { APPLIANCE_BY_ID, type ApplianceId } from '@/data/appliances'
import { POWER_CUT, TARIFF } from '@/data/config'
import {
  allCombos,
  batteryHours,
  bestCombo,
  comfortScore,
  costPerHour,
  isValidSelection,
  loadWatts,
} from '@/lib/powercut'
import { useHouse } from '@/store/useHouse'
import { BatteryGauge } from './BatteryGauge'
import { backupComparison, formatDuration } from './formatDuration'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

const REDUCED_FLICKER_MS = 400

const vignetteStyle = {
  background:
    'radial-gradient(ellipse at 50% 38%, rgba(7,11,22,0.42) 0%, rgba(7,11,22,0.78) 58%, rgba(7,11,22,0.94) 100%)',
}

// Spring-free ease-out (quint-like) shared by the card transitions.
const CARD_EASE = [0.22, 1, 0.36, 1] as const

const cardMotion = {
  initial: { opacity: 0, y: 14, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: CARD_EASE } },
  exit: { opacity: 0, y: 8, scale: 0.985, transition: { duration: 0.24, ease: CARD_EASE } },
}

const reducedCardMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15, ease: 'linear' as const } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: 'linear' as const } },
}

const enterChild = {
  hidden: { opacity: 0, y: 8, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.32, ease: 'easeOut' as const },
  },
}

const statRow = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}

const statItem = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.26, ease: CARD_EASE } },
}

export function PowerCutOverlay() {
  const phase = useHouse((state) => state.powerCut)
  const setPowerCutPhase = useHouse((state) => state.setPowerCutPhase)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (phase !== 'flicker') return
    const ms = reduced ? REDUCED_FLICKER_MS : POWER_CUT.flickerMs
    const id = window.setTimeout(() => setPowerCutPhase('choosing'), ms)
    return () => window.clearTimeout(id)
  }, [phase, reduced, setPowerCutPhase])

  if (phase === 'off') return null

  const flickerMs = (reduced ? REDUCED_FLICKER_MS : POWER_CUT.flickerMs) / 1000

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        style={vignetteStyle}
        initial={{ opacity: phase === 'flicker' ? 0 : 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: phase === 'flicker' ? flickerMs : 0, ease: 'easeIn' }}
      />
      {phase === 'flicker' && (
        <>
          <div className="pointer-events-auto absolute inset-0" />
          <p className="sr-only" role="status">
            Power is out.
          </p>
          {!reduced && <Lightning />}
        </>
      )}
      <div className="absolute inset-x-0 bottom-0 grid justify-items-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] *:col-start-1 *:row-start-1 *:self-end">
        <AnimatePresence initial={!reduced}>
          {phase === 'choosing' && <ChoosingCard key="choosing" reduced={reduced} />}
          {phase === 'result' && <ResultCard key="result" reduced={reduced} />}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Lightning() {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.88, 0, 0, 0.5, 0, 0, 0.2, 0] }}
      transition={{
        duration: POWER_CUT.flickerMs / 1000,
        times: [0, 0.05, 0.12, 0.3, 0.36, 0.44, 0.82, 0.88, 1],
        ease: 'linear',
      }}
    />
  )
}

function ChoosingCard({ reduced }: { reduced: boolean }) {
  const picks = useHouse((state) => state.picks)
  const pick = useHouse((state) => state.pick)
  const pickError = useHouse((state) => state.pickError)
  const confirmPicks = useHouse((state) => state.confirmPicks)
  const shown = useErrorToast(pickError)
  const ready = isValidSelection(picks)
  const hours = batteryHours(picks)
  const watts = loadWatts(picks)
  const open = Math.max(0, POWER_CUT.picks - picks.length)
  const slots = Array.from({ length: POWER_CUT.picks }, (_, index) => picks[index] ?? null)
  // Slots already filled when the card opens should not pulse; only new picks do.
  const [initialPicks] = useState(() => new Set(picks))

  return (
    <CardShell reduced={reduced} label="Inverter backup">
      <Enter reduced={reduced}>
        <h2 className="text-balance px-2 pt-2 text-lg font-semibold tracking-tight">
          Inverter backup: choose 3 to keep running.
        </h2>
        <p className="mt-1 px-2 text-pretty text-sm text-muted-foreground">
          {open === 0
            ? 'Click a filled slot to remove it.'
            : `Select ${open === 1 ? '1 more' : `${open} more`} in the house.`}
        </p>
      </Enter>
      <Enter reduced={reduced}>
        <Shake reduced={reduced} at={pickError?.at}>
          {shown && (
            <motion.p
              className="mt-3 rounded-full border border-amber-300/40 bg-amber-400/15 px-3 py-2 text-center text-sm font-medium text-amber-100"
              role="alert"
              initial={reduced ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: CARD_EASE }}
            >
              {shown}
            </motion.p>
          )}
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3" aria-label="Backup slots">
            {slots.map((id, index) => (
              <li key={id ?? `empty-${index}`}>
                {id ? (
                  <motion.button
                    type="button"
                    onClick={() => pick(id)}
                    title={APPLIANCE_BY_ID[id].name}
                    aria-label={`Remove ${APPLIANCE_BY_ID[id].name} from backup`}
                    className="relative flex min-h-11 w-full items-center gap-2 rounded-xl bg-white/5 pr-2.5 pl-3 text-left text-sm transition-[background-color] duration-150 ease-out hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    initial={reduced || initialPicks.has(id) ? false : { scale: 0.97 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.22, ease: CARD_EASE }}
                  >
                    {!initialPicks.has(id) && <SlotPulse />}
                    <span className="relative truncate">{APPLIANCE_BY_ID[id].name}</span>
                    <X
                      className="relative ml-auto size-3.5 shrink-0 opacity-70"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </motion.button>
                ) : (
                  <div className="flex min-h-11 items-center rounded-xl border border-dashed border-white/15 px-3 text-sm text-muted-foreground">
                    Empty
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Shake>
      </Enter>
      <Enter reduced={reduced}>
        <div className="mt-3 flex items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-2">
            <BatteryGauge hours={hours} />
            <p className="tabular-nums text-sm">
              <span className="sr-only">Backup time </span>
              {Number.isFinite(hours) ? (
                formatDuration(hours)
              ) : (
                <>
                  <span aria-hidden="true">—</span>
                  <span className="sr-only">No load yet</span>
                </>
              )}
            </p>
          </div>
          <p className="tabular-nums text-sm">
            <span className="sr-only">Load </span>
            {`${watts.toLocaleString('en-IN')} W`}
          </p>
        </div>
        <p className="mb-2 px-2 text-sm text-muted-foreground" aria-live="polite">
          Picked {picks.length} of {POWER_CUT.picks}
        </p>
        <button
          type="button"
          className="clay min-h-11 w-full px-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!ready}
          onClick={() => confirmPicks()}
        >
          {ready ? `Confirm ${POWER_CUT.picks} appliances` : 'Confirm'}
        </button>
      </Enter>
    </CardShell>
  )
}

function ResultCard({ reduced }: { reduced: boolean }) {
  const picks = useHouse((state) => state.picks)
  const restorePower = useHouse((state) => state.restorePower)
  const setPowerCutPhase = useHouse((state) => state.setPowerCutPhase)
  const hours = batteryHours(picks)
  const comfort = comfortScore(picks)
  const cost = costPerHour(picks)
  const best = useMemo(() => bestCombo(), [])
  const bestComfort = comfortScore(best.picks)
  const comboCount = useMemo(() => allCombos().length, [])
  const samePicks =
    picks.length === best.picks.length && picks.every((id) => best.picks.includes(id))
  const comparison = samePicks
    ? 'This is the best possible combo'
    : backupComparison(hours, best.batteryHours)

  return (
    <CardShell reduced={reduced} label="Backup result">
      <Enter reduced={reduced}>
        <div className="flex items-center justify-between gap-3 px-2 pt-2">
          <h2 className="text-balance text-lg font-semibold tracking-tight">Your backup</h2>
          <BatteryGauge hours={hours} />
        </div>
        <StatRow
          reduced={reduced}
          comfort={`${comfort.score}/${comfort.max}`}
          backup={Number.isFinite(hours) ? formatDuration(hours) : '—'}
          cost={`${formatRupees(cost)}/h`}
        />
        <div className="mt-3 px-2">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Comfort</span>
            <span>
              {comfort.score} / {comfort.max}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Comfort"
            aria-valuemin={0}
            aria-valuemax={comfort.max}
            aria-valuenow={comfort.score}
            className="h-2 overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${(comfort.score / comfort.max) * 100}%` }}
            />
          </div>
        </div>
        <p className="mt-3 px-2 text-pretty text-sm">
          <span className="text-muted-foreground">Your picks. </span>
          {picks.map((id, index) => (
            <span key={id} className={best.picks.includes(id) ? 'text-emerald-300' : undefined}>
              {index > 0 ? ', ' : ''}
              {APPLIANCE_BY_ID[id].name}
            </span>
          ))}
        </p>
      </Enter>
      <Enter reduced={reduced}>
        <div className="mt-4 rounded-2xl bg-teal-300/[0.05] pt-3 pb-3 shadow-[inset_0_0_0_1px_rgba(153,246,228,0.14),0_0_24px_rgba(94,234,212,0.06)]">
          <div className="px-2">
            <h3 className="text-balance text-base font-semibold">Best possible combo</h3>
            <p className="mt-1 text-pretty text-sm text-teal-50">{joinNames(best.picks)}</p>
          </div>
          <StatRow
            reduced={reduced}
            comfort={`${bestComfort.score}/${bestComfort.max}`}
            backup={formatDuration(best.batteryHours)}
            cost={`${formatRupees(best.costPerHour)}/h`}
          />
        </div>
        <p className="mt-3 px-2 text-pretty text-sm">{comparison}</p>
        <p className="mt-1 px-2 text-pretty text-sm text-muted-foreground">
          Checked all {comboCount} combinations.
        </p>
      </Enter>
      <Enter reduced={reduced}>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            className="clay min-h-11 px-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            onClick={restorePower}
          >
            Restore power
          </button>
          <button
            type="button"
            className="clay min-h-11 px-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            onClick={() => setPowerCutPhase('choosing')}
          >
            Try again
          </button>
        </div>
      </Enter>
    </CardShell>
  )
}

function CardShell({
  reduced,
  label,
  children,
}: {
  reduced: boolean
  label: string
  children: ReactNode
}) {
  const isPresent = useIsPresent()
  const card = reduced ? reducedCardMotion : cardMotion

  return (
    <motion.section
      role="region"
      aria-label={label}
      aria-hidden={isPresent ? undefined : true}
      inert={!isPresent}
      className="glass pointer-events-auto max-h-[min(36rem,calc(100svh-2rem))] w-full max-w-md origin-bottom overflow-y-auto rounded-3xl p-3 data-[leaving=true]:pointer-events-none"
      data-leaving={isPresent ? undefined : true}
      initial={card.initial}
      animate={card.animate}
      exit={card.exit}
    >
      <motion.div
        initial={reduced ? false : 'hidden'}
        animate="show"
        variants={
          reduced ? undefined : { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
        }
      >
        {children}
      </motion.div>
    </motion.section>
  )
}

/** Brief 2-3 px shake when a 4th pick is blocked. Skipped under reduced motion. */
function Shake({ reduced, at, children }: { reduced: boolean; at?: number; children: ReactNode }) {
  const controls = useAnimationControls()

  useEffect(() => {
    if (reduced || at == null) return
    void controls.start({
      x: [0, -3, 3, -2, 2, 0],
      transition: { duration: 0.25, ease: 'easeInOut' },
    })
  }, [at, reduced, controls])

  return <motion.div animate={controls}>{children}</motion.div>
}

/** One-shot green-cyan glow when a slot fills. Opacity only, so it is motion-safe. */
function SlotPulse() {
  return (
    <motion.span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-xl bg-teal-300/10 shadow-[inset_0_0_0_1px_rgba(94,234,212,0.5),0_0_16px_rgba(94,234,212,0.22)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{ duration: 0.7, times: [0, 0.25, 1], ease: 'easeOut' }}
    />
  )
}

function Enter({ reduced, children }: { reduced: boolean; children: ReactNode }) {
  return <motion.div variants={reduced ? undefined : enterChild}>{children}</motion.div>
}

function StatRow({
  reduced,
  comfort,
  backup,
  cost,
}: {
  reduced: boolean
  comfort: string
  backup: string
  cost: string
}) {
  return (
    <motion.div
      className="mt-3 grid grid-cols-3 gap-2 px-2"
      variants={reduced ? undefined : statRow}
    >
      <Stat reduced={reduced} label="Comfort" value={comfort} />
      <Stat reduced={reduced} label="Backup" value={backup} />
      <Stat reduced={reduced} label="Cost" value={cost} />
    </motion.div>
  )
}

function Stat({ reduced, label, value }: { reduced: boolean; label: string; value: string }) {
  return (
    <motion.div className="min-w-0" variants={reduced ? undefined : statItem}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="tabular-nums text-lg font-semibold tracking-tight">{value}</p>
    </motion.div>
  )
}

function useErrorToast(pickError: { message: string; at: number } | null) {
  const at = pickError?.at
  const message = pickError?.message
  const [expiredAt, setExpiredAt] = useState<number | null>(null)

  useEffect(() => {
    if (at == null || !message) return
    const id = window.setTimeout(() => setExpiredAt(at), POWER_CUT.messageMs)
    return () => window.clearTimeout(id)
  }, [at, message])

  if (at == null || !message || expiredAt === at) return null
  return message
}

function formatRupees(amount: number) {
  return `${TARIFF.currency}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function joinNames(ids: ApplianceId[]) {
  const names = ids.map((id) => APPLIANCE_BY_ID[id].name)
  if (names.length === 0) return 'None selected'
  if (names.length === 1) return names[0] ?? 'None selected'
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`
}
