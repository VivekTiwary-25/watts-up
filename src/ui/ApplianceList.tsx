import { useState } from 'react'
import { APPLIANCES } from '@/data/appliances'
import { useHouse } from '@/store/useHouse'
import { Switch } from '@/components/ui/switch'
export function ApplianceList() {
  const [open, setOpen] = useState(false),
    on = useHouse((s) => s.on),
    toggle = useHouse((s) => s.toggle),
    select = useHouse((s) => s.select)
  return (
    <section className="glass pointer-events-auto w-full rounded-2xl p-3">
      <button
        className="w-full rounded-lg text-left text-sm font-medium hover:bg-white/5"
        aria-expanded={open}
        aria-controls="appliance-list"
        onClick={() => setOpen(!open)}
      >
        Appliances{' '}
        <span aria-hidden="true" className="float-right">
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <ul id="appliance-list" className="mt-2 space-y-1">
          {APPLIANCES.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-white/5"
            >
              <button
                className="min-w-0 flex-1 rounded-lg pr-2 text-left text-sm"
                onClick={() => select(a.id)}
              >
                {a.name}
              </button>
              <Switch
                aria-label={`Toggle ${a.name}`}
                checked={on[a.id]}
                onCheckedChange={() => toggle(a.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
