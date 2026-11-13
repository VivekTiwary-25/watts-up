import { ChevronLeft, ChevronRight, Home, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROOMS as ROOM_INFO } from '@/data/config'
import { useHouse } from '@/store/useHouse'
import { ROOM_IDS, type Room } from '@/scene/layout'
import { requestResetView } from '@/scene/cameraShots'

function roomName(id: Room) {
  return ROOM_INFO.find((r) => r.id === id)?.name ?? id
}

function step(current: Room, dir: 1 | -1): Room {
  const i = ROOM_IDS.indexOf(current)
  return ROOM_IDS[(i + dir + ROOM_IDS.length) % ROOM_IDS.length]
}

/** Camera navigation: overview / reset view, and previous / next room while inside a room. */
export function RoomNav() {
  const view = useHouse((s) => s.view)
  const villa = useHouse((s) => s.villa)
  const focusRoom = useHouse((s) => s.focusRoom)
  const goToRoom = useHouse((s) => s.goToRoom)
  const backToOverview = useHouse((s) => s.backToOverview)

  if (view === 'intro' || villa) return null
  const inRoom = view === 'room' && focusRoom !== null

  return (
    <nav
      aria-label="Camera navigation"
      className="glass pointer-events-auto flex w-full max-w-sm items-center gap-1 rounded-2xl p-1.5"
    >
      {inRoom ? (
        <>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Previous room: ${roomName(step(focusRoom, -1))}`}
            onClick={() => goToRoom(step(focusRoom, -1))}
          >
            <ChevronLeft />
          </Button>
          <p className="min-w-0 flex-1 truncate text-center text-sm font-medium" aria-live="polite">
            {roomName(focusRoom)}
          </p>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Next room: ${roomName(step(focusRoom, 1))}`}
            onClick={() => goToRoom(step(focusRoom, 1))}
          >
            <ChevronRight />
          </Button>
          <Button variant="secondary" size="sm" onClick={backToOverview}>
            <Home />
            Overview
          </Button>
        </>
      ) : (
        <>
          <p className="min-w-0 flex-1 truncate px-2 text-sm text-muted-foreground">Whole house</p>
          <Button variant="ghost" size="sm" onClick={requestResetView}>
            <RotateCcw />
            Reset view
          </Button>
        </>
      )}
    </nav>
  )
}
