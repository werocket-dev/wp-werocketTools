import { useState } from 'react'
import { IconBrandWordpress, IconShoppingBag } from '@tabler/icons-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ModuleCard } from '../components/ModuleCard'
import { getModuleCategory, MODULE_GROUPS, WOO_THEME_VARS, type ModuleCategory, type ModuleGroup } from '@/lib/modules'
import type { Module } from '@/lib/types'

type FilterCategory = 'all' | ModuleCategory

interface Props {
  modules: Module[]
  onToggle: (id: string, active: boolean) => void
  onNavigate: (tab: string) => void
}

const FILTERS: { value: FilterCategory; label: string }[] = [
  { value: 'all', label: 'Tous' },
  ...MODULE_GROUPS.map(g => ({ value: g.id, label: g.label })),
]

const GROUP_ICONS: Record<ModuleCategory, typeof IconBrandWordpress> = {
  wordpress: IconBrandWordpress,
  woocommerce: IconShoppingBag,
}

export function Dashboard({ modules, onToggle, onNavigate }: Props) {
  const [filter, setFilter] = useState<FilterCategory>('all')

  if (!modules.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          Aucun module disponible.
        </CardContent>
      </Card>
    )
  }

  // Une section par groupe, dans l'ordre de MODULE_GROUPS ; les groupes
  // vides (ou exclus par le filtre) ne sont pas rendus.
  const sections = MODULE_GROUPS
    .filter(group => filter === 'all' || filter === group.id)
    .map(group => ({
      group,
      modules: modules.filter(m => getModuleCategory(m.id) === group.id),
    }))
    .filter(section => section.modules.length > 0)

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filtrer les modules">
        {FILTERS.map(f => {
          const isActive = filter === f.value
          return (
            <Button
              key={f.value}
              type="button"
              size="sm"
              variant={isActive ? 'default' : 'outline'}
              aria-pressed={isActive}
              className="rounded-full px-4"
              style={isActive && f.value === 'woocommerce' ? WOO_THEME_VARS : undefined}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          )
        })}
      </div>

      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            Aucun module dans cette catégorie.
          </CardContent>
        </Card>
      ) : (
        sections.map(({ group, modules: groupModules }) => (
          <ModuleGroupSection
            key={group.id}
            group={group}
            modules={groupModules}
            onToggle={onToggle}
            onNavigate={onNavigate}
          />
        ))
      )}
    </div>
  )
}

interface SectionProps {
  group: ModuleGroup
  modules: Module[]
  onToggle: (id: string, active: boolean) => void
  onNavigate: (tab: string) => void
}

function ModuleGroupSection({ group, modules, onToggle, onNavigate }: SectionProps) {
  const Icon = GROUP_ICONS[group.id]
  const activeCount = modules.filter(m => m.active).length
  const headingId = `werocket-group-${group.id}`

  return (
    <section aria-labelledby={headingId} className="space-y-4">
      {/* Le thème du groupe ne colore que l'en-tête : les cartes appliquent
          déjà le leur (ModuleCard), on ne veut pas teinter tout le fond. */}
      <div
        style={group.themeVars}
        className="flex items-center justify-between gap-4 flex-wrap border-b border-border pb-4"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon size={20} />
          </div>
          <div>
            {/* div + role : les règles h2/p de wp-admin, hors cascade layer,
                écrasent les utilitaires Tailwind (marges, taille de police). */}
            <div id={headingId} role="heading" aria-level={2} className="text-lg font-bold leading-tight text-foreground">
              {group.label}
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">{group.description}</div>
          </div>
        </div>
        <Badge variant="outline" className="tabular-nums">
          {activeCount}/{modules.length} actif{activeCount > 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {modules.map(module => (
          <ModuleCard
            key={module.id}
            module={module}
            onToggle={onToggle}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  )
}
