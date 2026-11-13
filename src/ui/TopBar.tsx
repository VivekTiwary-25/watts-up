import { ArrowLeft, Volume2, VolumeX, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useHouse } from '@/store/useHouse'

const VIEW_OPTIONS = [
  { label: 'Villa', villa: true },
  { label: 'Rooms', villa: false },
] as const

/** Segmented "Villa | Rooms" switch: the cut-open villa or the interactive clay rooms. */
function ViewToggle() {
  const villa = useHouse((s) => s.villa)
  const setVilla = useHouse((s) => s.setVilla)

  return (
    <div
      role="group"
      aria-label="Scene view"
      className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/20 p-1"
    >
      {VIEW_OPTIONS.map((option) => {
        const active = villa === option.villa
        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={active}
            onClick={() => setVilla(option.villa)}
            className={
              active
                ? 'clay px-3 text-sm font-medium text-cyan-100'
                : 'rounded-[var(--radius)] px-3 text-sm text-white/65 transition-colors hover:text-white'
            }
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function TopBar() {
  const view = useHouse((s) => s.view),
    back = useHouse((s) => s.backToOverview),
    start = useHouse((s) => s.startPowerCut),
    muted = useHouse((s) => s.muted),
    mute = useHouse((s) => s.toggleMute)
  return (
    <header className="glass pointer-events-auto flex flex-wrap items-center gap-2 rounded-2xl p-2">
      <h1 className="mr-auto min-w-0 px-1 text-base font-semibold tracking-tight sm:px-2 sm:text-lg">
        Watt's Up?
      </h1>
      {view !== 'intro' && <ViewToggle />}
      {view === 'room' && (
        <Button variant="ghost" onClick={back}>
          <ArrowLeft aria-hidden="true" /> Back to overview
        </Button>
      )}
      <Button variant="secondary" onClick={start}>
        <Zap aria-hidden="true" /> Power cut
      </Button>
      <Button variant="ghost" size="icon" aria-label={muted ? 'Unmute' : 'Mute'} onClick={mute}>
        {muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
      </Button>
    </header>
  )
}
