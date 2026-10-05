import { ArrowUpRight, KeyRound, PanelLeft, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LINKS } from '@/lib/modules'

export type GeneralSection = 'login' | 'menu'

const GROUPS: { label: string; items: { id: GeneralSection; label: string; icon: LucideIcon }[] }[] = [
  { label: 'Sécurité', items: [{ id: 'login', label: 'URL de connexion', icon: KeyRound }] },
  { label: 'Administration', items: [{ id: 'menu', label: 'Menu d\'administration', icon: PanelLeft }] },
]

interface Props {
  current: GeneralSection
  onChange: (section: GeneralSection) => void
  /** Pastille « Active » à côté d'une entrée */
  activeBadges: Partial<Record<GeneralSection, boolean>>
}

/** Navigation secondaire du module Général (colonne de gauche). */
export function SubNav({ current, onChange, activeBadges }: Props) {
  return (
    <nav aria-label="Réglages du module" className="flex shrink-0 flex-col gap-5 lg:w-[212px]">
      {GROUPS.map(group => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <div className="px-2.5 pb-1.5 text-[11px] font-semibold tracking-wide text-subtle-foreground uppercase">{group.label}</div>
          {group.items.map(({ id, label, icon: Icon }) => {
            const active = current === id
            return (
              <button
                key={id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => onChange(id)}
                className={cn(
                  'flex h-9 w-full items-center gap-2.5 rounded-[8px] px-2.5 text-left text-[13px] font-medium transition-colors',
                  active
                    ? 'bg-card text-foreground ring-1 ring-border [&_svg]:text-primary'
                    : 'text-muted-foreground hover:bg-card/60 hover:text-foreground [&_svg]:text-subtle-foreground'
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {activeBadges[id] && <span className="text-xs font-medium text-primary">Active</span>}
              </button>
            )
          })}
        </div>
      ))}
      <div className="flex flex-col gap-1.5 border-t border-border px-2.5 py-3.5">
        <div className="text-xs font-medium text-muted-foreground">D'autres réglages arrivent bientôt dans ce module.</div>
        <a
          href={LINKS.support}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary no-underline hover:underline"
        >
          Suggérer une fonctionnalité
          <ArrowUpRight className="size-[13px]" />
        </a>
      </div>
    </nav>
  )
}
