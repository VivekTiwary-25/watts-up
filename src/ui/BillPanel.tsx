import { useBill } from '@/store/useHouse'
import { Card } from '@/components/ui/card'
import { AnimatedNumber } from './AnimatedNumber'
export function BillPanel() {
 const bill = useBill()
 return <Card className="glass w-full max-w-sm gap-3 p-4"><div className="text-xs uppercase tracking-widest text-muted-foreground">Monthly estimate</div><div className="text-3xl font-semibold"><AnimatedNumber value={bill.total}/></div><div className="text-sm text-muted-foreground"><AnimatedNumber value={bill.totalUnits} currency={false}/> kWh / month</div><div className="space-y-2">{bill.items.map(item=><div key={item.id} className="text-xs"><div className="mb-1 flex justify-between"><span>{item.name}</span><span>{Math.round(item.share*100)}%</span></div><div className="h-1.5 overflow-hidden rounded bg-white/10"><div className="h-full rounded bg-teal-300 transition-[width] duration-500" style={{width:`${item.share*100}%`}}/></div></div>)}</div><p className="min-h-10 text-xs text-muted-foreground">{bill.tip}</p><div className="border-t border-white/10 pt-2 text-xs text-muted-foreground">Includes {new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(bill.fixedCharge)} fixed charge</div></Card>
}
