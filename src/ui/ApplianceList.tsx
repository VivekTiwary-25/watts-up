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
    <section className="glass pointer-events-auto w-64 rounded-2xl p-3">
      <button
        className="w-full text-left text-sm font-medium"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        Appliances <span className="float-right">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <ul className="mt-2 space-y-1">
          {APPLIANCES.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-white/5"
            >
              <button className="text-sm" onClick={() => select(a.id)}>
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
