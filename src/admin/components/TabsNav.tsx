import { IconLayoutDashboard } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { ModuleIcon } from '@/lib/module-icons'
import type { Module } from '@/lib/types'

interface Props {
  modules: Module[]
  currentTab: string
  onNavigate: (tab: string) => void
}

export function TabsNav({ modules, currentTab, onNavigate }: Props) {
  const tabClass = (active: boolean) =>
    cn(
      'relative inline-flex items-center gap-2.5 rounded-full px-6 py-2.5 text-[15px] font-medium whitespace-nowrap transition-all cursor-pointer select-none',
      active
        ? 'bg-primary text-primary-foreground shadow-md ring-1 ring-primary/20'
        : 'text-muted-foreground hover:text-foreground'
    )

  return (
    <nav
      className="bg-background/95 backdrop-blur rounded-full p-1.5 inline-flex items-center gap-1 ring-1 ring-foreground/10 shadow-sm"
      aria-label="Navigation principale"
    >
      <button type="button" className={tabClass(currentTab === 'dashboard')} onClick={() => onNavigate('dashboard')}>
        <IconLayoutDashboard size={18} />
        Tableau de bord
      </button>
      {modules.filter(m => m.active).map(m => (
        <button type="button" key={m.id} className={tabClass(currentTab === m.id)} onClick={() => onNavigate(m.id)}>
          <ModuleIcon id={m.id} size={18} />
          {m.name}
        </button>
      ))}
    </nav>
  )
}
