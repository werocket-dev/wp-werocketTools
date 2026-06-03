import { ModuleCard } from '../components/ModuleCard'
import type { Module } from '@/lib/types'

interface Props {
  modules: Module[]
  onToggle: (id: string, active: boolean) => void
  onNavigate: (tab: string) => void
}

export function Dashboard({ modules, onToggle, onNavigate }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">Modules disponibles</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map(module => (
          <ModuleCard
            key={module.id}
            module={module}
            onToggle={onToggle}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  )
}
