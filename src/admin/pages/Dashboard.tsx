import { ModuleCard } from '../components/ModuleCard'
import type { Module } from '@/lib/types'

interface Props {
  modules: Module[]
  onToggle: (id: string, active: boolean) => void
  onNavigate: (tab: string) => void
}

export function Dashboard({ modules, onToggle, onNavigate }: Props) {
  if (!modules.length) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500 text-sm">
        Aucun module disponible.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {modules.map(module => (
        <ModuleCard
          key={module.id}
          module={module}
          onToggle={onToggle}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  )
}
