import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { motion, useAnimationControls } from 'motion/react'
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

const enterChild = {
  hidden: { opacity: 0, y: 8, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.32, ease: 'easeOut' as const },
  },
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
      <div className="absolute inset-x-0 bottom-0 flex justify-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {phase === 'choosing' && <ChoosingCard reduced={reduced} />}
        {phase === 'result' && <ResultCard reduced={reduced} />}
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

  return (
    <CardShell reduced={reduced} shakeAt={pickError?.at} label="Inverter backup">
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
      {shown && (
        <p
          className="mt-3 rounded-full border border-amber-300/40 bg-amber-400/15 px-3 py-2 text-center text-sm font-medium text-amber-100"
          role="alert"
        >
          {shown}
        </p>
      )}
      <Enter reduced={reduced}>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3" aria-label="Backup slots">
          {slots.map((id, index) => (
            <li key={id ?? `empty-${index}`}>
              {id ? (
                <button
                  type="button"
                  onClick={() => pick(id)}
                  title={APPLIANCE_BY_ID[id].name}
                  aria-label={`Remove ${APPLIANCE_BY_ID[id].name} from backup`}
                  className="flex min-h-11 w-full items-center gap-2 rounded-xl bg-white/5 pr-2.5 pl-3 text-left text-sm transition-[background-color] duration-150 ease-out hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <span className="truncate">{APPLIANCE_BY_ID[id].name}</span>
                  <X
                    className="ml-auto size-3.5 shrink-0 opacity-70"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </button>
              ) : (
                <div className="flex min-h-11 items-center rounded-xl border border-dashed border-white/15 px-3 text-sm text-muted-foreground">
                  Empty
                </div>
              )}
            </li>
          ))}
        </ul>
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
        <div className="mt-4 border-t border-white/10 px-2 pt-4">
          <h3 className="text-balance text-base font-semibold">Best possible combo</h3>
          <p className="mt-1 text-pretty text-sm">{joinNames(best.picks)}</p>
        </div>
        <StatRow
          comfort={`${bestComfort.score}/${bestComfort.max}`}
          backup={formatDuration(best.batteryHours)}
          cost={`${formatRupees(best.costPerHour)}/h`}
        />
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
  shakeAt,
  label,
  children,
}: {
  reduced: boolean
  shakeAt?: number
  label: string
  children: ReactNode
}) {
  const controls = useAnimationControls()

  useEffect(() => {
    if (reduced || shakeAt == null) return
    void controls.start({
      x: [0, -10, 10, -8, 8, -4, 4, 0],
      transition: { duration: 0.45, ease: 'easeInOut' },
    })
  }, [shakeAt, reduced, controls])

  return (
    <motion.section
      role="region"
      aria-label={label}
      className="glass pointer-events-auto max-h-[min(36rem,calc(100svh-2rem))] w-full max-w-md overflow-y-auto rounded-3xl p-3"
      animate={controls}
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

function Enter({ reduced, children }: { reduced: boolean; children: ReactNode }) {
  return <motion.div variants={reduced ? undefined : enterChild}>{children}</motion.div>
}

function StatRow({ comfort, backup, cost }: { comfort: string; backup: string; cost: string }) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2 px-2">
      <Stat label="Comfort" value={comfort} />
      <Stat label="Backup" value={backup} />
      <Stat label="Cost" value={cost} />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="tabular-nums text-lg font-semibold tracking-tight">{value}</p>
    </div>
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
