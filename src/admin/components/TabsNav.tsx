import { IconLayoutDashboard, IconCookie, IconStarFilled, IconBuildingStore } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import type { Module } from '@/lib/types'

const MODULE_ICONS: Record<string, React.ReactNode> = {
  cookies: <IconCookie size={18} />,
  google_reviews: <IconStarFilled size={18} />,
  google_business: <IconBuildingStore size={18} />,
}

interface Props {
  modules: Module[]
  currentTab: string
  onNavigate: (tab: string) => void
}

export function TabsNav({ modules, currentTab, onNavigate }: Props) {
  const linkClass = (active: boolean) =>
    cn(
      'flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors cursor-pointer select-none',
      active
        ? 'border-primary text-primary'
        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
    )

  return (
    <nav className="bg-white rounded-xl shadow-sm border border-border flex items-center">
      <button className={linkClass(currentTab === 'dashboard')} onClick={() => onNavigate('dashboard')}>
        <IconLayoutDashboard size={18} />
        Tableau de bord
      </button>
      {modules.map(m => (
        <button key={m.id} className={linkClass(currentTab === m.id)} onClick={() => onNavigate(m.id)}>
          {MODULE_ICONS[m.id] ?? null}
          {m.name}
        </button>
      ))}
    </nav>
  )
}
