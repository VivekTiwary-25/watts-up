import { BillPanel } from './BillPanel'
import { TargetPanel } from './TargetPanel'
import { ApplianceCard } from './ApplianceCard'
import { TopBar } from './TopBar'
import { ApplianceList } from './ApplianceList'
import { SoundController } from './SoundController'
export function HUD(){return <div className="pointer-events-none absolute inset-0 z-10 p-3 md:p-6"><SoundController/><div className="flex flex-col gap-3"><TopBar/><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><BillPanel/><TargetPanel/></div><div className="self-start"><ApplianceList/></div></div><ApplianceCard/></div>}
