import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type StatusTone = 'success' | 'warning' | 'destructive' | 'neutral'

const TONES: Record<StatusTone, { badge: string; dot: string }> = {
  success: { badge: 'bg-primary-muted text-primary-strong', dot: 'bg-primary' },
  warning: { badge: 'bg-warning-muted text-warning', dot: 'bg-warning' },
  destructive: { badge: 'bg-destructive/10 text-destructive', dot: 'bg-destructive' },
  neutral: { badge: 'bg-muted text-muted-foreground ring-1 ring-border', dot: 'bg-subtle-foreground' },
}

/** Pastille d'état (point ou icône + libellé) : « Actif », « 3 points à vérifier », « Disponible »… */
export function StatusBadge({ tone = 'success', icon, children, className }: {
  tone?: StatusTone
  /** Remplace le point (taille 12 px) */
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  const t = TONES[tone]
  return (
    <Badge className={cn('h-[22px] gap-1.5 rounded-full px-2 text-xs font-semibold [&>svg]:size-3!', t.badge, className)}>
      {icon ?? <span className={cn('size-1.5 rounded-full', t.dot)} aria-hidden />}
      {children}
    </Badge>
  )
}
