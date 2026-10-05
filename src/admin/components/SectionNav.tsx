import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SectionNavItem<T extends string> {
  id: T
  label: string
  icon: LucideIcon
  /** Mention à droite (« Active », « Erreur »…) */
  meta?: React.ReactNode
}

export interface SectionNavGroup<T extends string> {
  label: string
  items: SectionNavItem<T>[]
}

interface Props<T extends string> {
  groups: SectionNavGroup<T>[]
  current: T
  onChange: (section: T) => void
  /** Bloc sous les groupes, séparé par une bordure (aide, shortcodes…) */
  footer?: React.ReactNode
}

/** Navigation secondaire d'une page de module (colonne de gauche des maquettes). */
export function SectionNav<T extends string>({ groups, current, onChange, footer }: Props<T>) {
  return (
    <nav aria-label="Réglages du module" className="flex shrink-0 flex-col gap-5 lg:w-[212px]">
      {groups.map(group => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <div className="px-2.5 pb-1.5 text-[11px] font-semibold tracking-wide text-subtle-foreground uppercase">{group.label}</div>
          {group.items.map(({ id, label, icon: Icon, meta }) => {
            const active = current === id
            return (
              <button
                key={id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => onChange(id)}
                className={cn(
                  'flex h-9 w-full items-center gap-2.5 rounded-[8px] px-2.5 text-left text-[13px] transition-colors',
                  active
                    ? 'bg-card font-semibold text-foreground ring-1 ring-border [&>svg]:text-primary'
                    : 'font-medium text-muted-foreground hover:bg-card/60 hover:text-foreground [&>svg]:text-subtle-foreground'
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {meta}
              </button>
            )
          })}
        </div>
      ))}
      {footer && <div className="flex flex-col gap-2 border-t border-border px-2.5 py-3.5">{footer}</div>}
    </nav>
  )
}
