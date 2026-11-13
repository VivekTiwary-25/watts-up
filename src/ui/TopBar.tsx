import { ArrowLeft, Volume2, VolumeX, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useHouse } from '@/store/useHouse'
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
