import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ModuleCard } from '../components/ModuleCard'
import { cn } from '@/lib/utils'
import { getModuleCategory } from '@/lib/modules'
import type { Module } from '@/lib/types'

type FilterCategory = 'all' | 'wordpress' | 'woocommerce'

interface Props {
  modules: Module[]
  onToggle: (id: string, active: boolean) => void
  onNavigate: (tab: string) => void
}

const FILTERS: { value: FilterCategory; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'wordpress', label: 'WordPress' },
  { value: 'woocommerce', label: 'WooCommerce' },
]

// Couleur primaire WooCommerce pour le filtre actif
const WOO_PRIMARY = '271 47% 52%'

export function Dashboard({ modules, onToggle, onNavigate }: Props) {
  const [filter, setFilter] = useState<FilterCategory>('all')

  const filtered = filter === 'all'
    ? modules
    : modules.filter(m => getModuleCategory(m.id) === filter)

  if (!modules.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          Aucun module disponible.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => {
          const isActive = filter === f.value
          const isWoo = f.value === 'woocommerce'
          return (
            <button
              key={f.value}
              type="button"
              style={isActive && isWoo ? { '--primary': WOO_PRIMARY } as React.CSSProperties : undefined}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all border',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-foreground/30'
              )}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            Aucun module dans cette catégorie.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(module => (
            <ModuleCard
              key={module.id}
              module={module}
              onToggle={onToggle}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
