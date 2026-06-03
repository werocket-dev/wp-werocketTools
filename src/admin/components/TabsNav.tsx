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
      'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors cursor-pointer select-none no-underline',
      active
        ? 'border-emerald-500 text-emerald-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    )

  return (
    <nav className="bg-white rounded-lg shadow mr-4 mb-6 flex items-center" aria-label="Onglets">
      <button type="button" className={linkClass(currentTab === 'dashboard')} onClick={() => onNavigate('dashboard')}>
        <IconLayoutDashboard size={20} />
        Tableau de bord
      </button>
      {modules.map(m => (
        <button type="button" key={m.id} className={linkClass(currentTab === m.id)} onClick={() => onNavigate(m.id)}>
          {MODULE_ICONS[m.id] ?? null}
          {m.name}
        </button>
      ))}
    </nav>
  )
}
