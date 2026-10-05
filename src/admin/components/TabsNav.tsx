import { LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ModuleIcon } from '@/lib/module-icons'
import { MODULE_GROUPS, getModuleCategory } from '@/lib/modules'
import type { Module } from '@/lib/types'

interface Props {
  modules: Module[]
  currentTab: string
  onNavigate: (tab: string) => void
}

/** Ordre des groupes du tableau de bord : les onglets d'un même groupe restent côte à côte. */
const GROUP_ORDER = MODULE_GROUPS.map(g => g.id)

export function TabsNav({ modules, currentTab, onNavigate }: Props) {
  const tabs = modules
    .filter(m => m.active)
    .sort((a, b) => GROUP_ORDER.indexOf(getModuleCategory(a.id)) - GROUP_ORDER.indexOf(getModuleCategory(b.id)))

  const item = (id: string, label: string, icon: React.ReactNode) => {
    const active = currentTab === id
    return (
      <button
        key={id}
        type="button"
        aria-current={active ? 'page' : undefined}
        onClick={() => onNavigate(id)}
        className={cn(
          'inline-flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-[7px] px-3 text-[13px] whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inverse-accent',
          active
            ? 'bg-inverse-foreground font-semibold text-inverse [&_svg]:text-primary'
            : 'font-medium text-inverse-foreground/80 hover:bg-inverse-foreground/8 hover:text-inverse-foreground [&_svg]:text-inverse-muted-foreground'
        )}
      >
        {icon}
        {label}
      </button>
    )
  }

  return (
    <nav
      aria-label="Navigation principale"
      className="flex max-w-full gap-0.5 overflow-x-auto rounded-[10px] bg-inverse-foreground/8 p-1 ring-1 ring-inverse-foreground/10"
    >
      {item('dashboard', 'Tableau de bord', <LayoutGrid size={15} />)}
      {tabs.map(m => item(m.id, m.name, <ModuleIcon id={m.id} size={15} />))}
    </nav>
  )
}
