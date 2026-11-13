import { useBill } from '@/store/useHouse'
import { useHouse } from '@/store/useHouse'
import { TARGET_RANGE } from '@/data/config'
import { Slider } from '@/components/ui/slider'
export function TargetPanel() {
 const bill=useBill(), target=useHouse(s=>s.targetBill), setTarget=useHouse(s=>s.setTarget)
 const delta=Math.abs(target-bill.total), under=bill.total<=target, ratio=Math.min(bill.total/Math.max(target,1),1)
 return <section className="glass w-full max-w-xs rounded-2xl p-4"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-medium">Target bill</h2><span className="text-sm tabular-nums">₹{target.toLocaleString('en-IN')}</span></div><div className="flex items-center gap-3"><svg viewBox="0 0 44 44" className="size-12 -rotate-90" aria-hidden="true"><circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeOpacity=".15" strokeWidth="4"/><circle cx="22" cy="22" r="18" fill="none" stroke={under?'#5eead4':'#fbbf24'} strokeWidth="4" strokeDasharray={`${ratio*113} 113`} strokeLinecap="round"/></svg><p aria-live="polite" className={`text-sm ${under?'text-teal-200':'text-amber-200'}`}>₹{delta.toLocaleString('en-IN')} {under?'under':'over'} target</p></div><Slider aria-label="Target monthly bill" className="mt-4" min={TARGET_RANGE.min} max={TARGET_RANGE.max} step={TARGET_RANGE.step} value={[target]} onValueChange={([v])=>v!==undefined&&setTarget(v)}/></section>
}
