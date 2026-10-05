import { Heading, SeparatorHorizontal, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Les deux types de séparateurs : popover « Ajouter » et carte d'explication. */
export const SEPARATOR_TYPES: { type: 'space' | 'heading'; icon: LucideIcon; title: string; description: string }[] = [
  { type: 'space', icon: SeparatorHorizontal, title: 'Espace', description: 'Un vide pour aérer le menu.' },
  { type: 'heading', icon: Heading, title: 'Titre de section', description: 'Un petit intitulé, ex. « Boutique ».' },
]

/** Carré gris 28 px contenant une icône (lignes du menu, types de séparateurs). */
export function IconChip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-muted text-muted-foreground ring-1 ring-border', className)}>
      {children}
    </span>
  )
}

/** Icône + titre + description d'un type de séparateur. */
export function SeparatorTypeInfo({ icon: Icon, title, description }: Omit<(typeof SEPARATOR_TYPES)[number], 'type'>) {
  return (
    <>
      <IconChip><Icon className="size-3.5" /></IconChip>
      <span>
        <span className="block text-[13px] font-semibold text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </>
  )
}
