import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import { APPLIANCE_BY_ID } from '@/data/appliances'
import { useBill } from '@/store/useHouse'
import { useHouse } from '@/store/useHouse'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
export function ApplianceCard() {
  const id = useHouse((s) => s.selected ?? s.hovered),
    select = useHouse((s) => s.select),
    reduced = useReducedMotion(),
    bill = useBill(),
    on = useHouse((s) => s.on),
    toggle = useHouse((s) => s.toggle),
    hours = useHouse((s) => s.hours),
    setHours = useHouse((s) => s.setHours)
  const item = id ? APPLIANCE_BY_ID[id] : null,
    line = bill.items.find((x) => x.id === id)
  return (
    <AnimatePresence>
      {item && (
        <motion.aside
          role="dialog"
          aria-label={item.name}
          initial={{ opacity: 0, y: reduced ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onKeyDown={(e) => e.key === 'Escape' && select(null)}
          className="glass fixed inset-x-3 bottom-3 z-20 rounded-2xl p-5 md:inset-auto md:bottom-6 md:right-6 md:w-80"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">{item.name}</h2>
              <p className="text-xs capitalize text-muted-foreground">
                {item.room} · {item.watts} W
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close appliance details"
              onClick={() => select(null)}
            >
              <X />
            </Button>
          </div>
          <p className="my-3 text-sm text-muted-foreground">{item.description}</p>
          <label className="mb-2 block text-xs text-muted-foreground">
            {hours[id!]} hours per day
          </label>
          <Slider
            aria-label={`${item.name} hours per day`}
            min={0}
            max={24}
            step={0.5}
            value={[hours[id!]]}
            onValueChange={([v]) => v !== undefined && setHours(id!, v)}
          />
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm">
              {line
                ? `₹${line.cost.toFixed(0)} · ${Math.round(line.share * 100)}% of bill`
                : 'No current cost'}
            </div>
            <label className="flex items-center gap-2 text-sm">
              {on[id!] ? 'On' : 'Off'}
              <Switch checked={on[id!]} onCheckedChange={() => toggle(id!)} />
            </label>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
